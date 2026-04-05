import type { AnalysisJob, AnalysisResult } from '@/types'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001'

export async function submitVideoForAnalysis(
  file: File,
  onProgress?: (pct: number) => void
): Promise<{ jobId: string }> {
  const formData = new FormData()
  formData.append('video', file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BACKEND_URL}/api/analyze/submit`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error during upload'))
    xhr.send(formData)
  })
}

export async function pollJobStatus(jobId: string): Promise<AnalysisJob> {
  const res = await fetch(`${BACKEND_URL}/api/analyze/status/${jobId}`)
  if (!res.ok) throw new Error('Failed to poll job status')
  return res.json()
}

export async function submitRecordingBlob(
  blob: Blob,
  onProgress?: (pct: number) => void
): Promise<{ jobId: string }> {
  const type = blob.type || 'video/webm'
  const ext = type.includes('mp4') ? 'mp4' : 'webm'
  const file = new File([blob], `recording.${ext}`, { type })
  return submitVideoForAnalysis(file, onProgress)
}

// Poll with exponential backoff until complete or error
export async function waitForResult(
  jobId: string,
  onStatusUpdate: (job: AnalysisJob) => void,
  maxWaitMs = 300_000
): Promise<AnalysisResult> {
  const start = Date.now()
  let delay = 2000

  while (Date.now() - start < maxWaitMs) {
    const job = await pollJobStatus(jobId)
    onStatusUpdate(job)

    if (job.status === 'complete' && job.result) {
      return job.result
    }
    if (job.status === 'error') {
      throw new Error(job.error || 'Analysis failed')
    }

    await new Promise(r => setTimeout(r, delay))
    delay = Math.min(delay * 1.4, 8000)
  }

  throw new Error('Analysis timed out')
}
