'use client'

import { useState, useCallback } from 'react'
import { Mic2, Upload, Sparkles } from 'lucide-react'
import { VideoUploader } from '@/components/VideoUploader'
import { VideoRecorder } from '@/components/VideoRecorder'
import { ProcessingState } from '@/components/ProcessingState'
import { ResultsDashboard } from '@/components/ResultsDashboard'
import { submitVideoForAnalysis, submitRecordingBlob, waitForResult } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { AnalysisResult, AnalysisStatus } from '@/types'

type InputMode = 'upload' | 'record'

export default function Home() {
  const [inputMode, setInputMode] = useState<InputMode>('upload')
  const [status, setStatus] = useState<AnalysisStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null)

  const runAnalysis = useCallback(async (source: File | Blob) => {
    try {
      setStatus('uploading')
      setProgress(0)
      setError(null)

      const { jobId } = source instanceof File
        ? await submitVideoForAnalysis(source, pct => setProgress(Math.round(pct * 0.3)))
        : await submitRecordingBlob(source, pct => setProgress(Math.round(pct * 0.3)))

      setStatus('processing')
      setProgress(30)

      const analysisResult = await waitForResult(
        jobId,
        (job) => {
          setProgress(30 + Math.round((job.progress / 100) * 70))
          setProgressStage(job.status)
        }
      )

      setResult(analysisResult)
      setStatus('complete')
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setRecordingBlob(blob)
  }, [])

  const handleAnalyze = useCallback(() => {
    const source = inputMode === 'upload' ? selectedFile : recordingBlob
    if (source) runAnalysis(source)
  }, [inputMode, selectedFile, recordingBlob, runAnalysis])

  const reset = useCallback(() => {
    setStatus('idle')
    setProgress(0)
    setResult(null)
    setError(null)
    setSelectedFile(null)
    setRecordingBlob(null)
  }, [])

  const isReady = inputMode === 'upload' ? !!selectedFile : !!recordingBlob
  const isProcessing = status === 'uploading' || status === 'processing'

  return (
    <main className="min-h-screen grid-bg">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-20%] left-[30%] w-[600px] h-[600px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #00E5A0, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle, #4DA8FF, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-20">

        {/* Hero — only show when idle/error */}
        {(status === 'idle' || status === 'error') && !result && (
          <>
            {/* Logo + wordmark */}
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/20 flex items-center justify-center">
                <Mic2 size={16} className="text-signal" />
              </div>
              <span className="font-display text-frost text-xl tracking-tight">SpeakIQ</span>
            </div>

            {/* Headline */}
            <div className="mb-10">
              <h1 className="font-display text-4xl sm:text-5xl text-frost leading-tight mb-3">
                Speak with{' '}
                <span className="text-signal signal-text-glow italic">confidence.</span>
              </h1>
              <p className="text-frost/50 text-lg leading-relaxed max-w-md">
                Upload or record a video and get AI feedback on your eye contact, speech patterns, confidence, and more.
              </p>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8 backdrop-blur-sm">

              {/* Mode tabs */}
              <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-6">
                {([
                  { key: 'upload', label: 'Upload video', icon: Upload },
                  { key: 'record', label: 'Record now', icon: Mic2 },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setInputMode(key); setSelectedFile(null); setRecordingBlob(null) }}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200',
                      inputMode === key
                        ? 'bg-white/[0.09] text-frost shadow-sm'
                        : 'text-frost/40 hover:text-frost/70'
                    )}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Input area */}
              {inputMode === 'upload' ? (
                <VideoUploader onFileSelect={handleFileSelect} disabled={isProcessing} />
              ) : (
                <VideoRecorder
                  onRecordingComplete={handleRecordingComplete}
                  disabled={isProcessing}
                />
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 p-3 rounded-xl bg-danger/10 border border-danger/20">
                  <p className="text-danger text-sm">{error}</p>
                </div>
              )}

              {/* Analyze button */}
              {isReady && !isProcessing && (
                <button
                  onClick={handleAnalyze}
                  className={cn(
                    'mt-5 w-full py-3.5 rounded-xl font-medium text-sm transition-all duration-200',
                    'bg-signal text-ink hover:bg-signal-dim active:scale-[0.99]',
                    'flex items-center justify-center gap-2 signal-glow'
                  )}
                >
                  <Sparkles size={16} />
                  Analyze my speech
                </button>
              )}
            </div>

            {/* Footer note */}
            <p className="text-center text-frost/20 text-xs mt-6 font-mono">
              Powered by Twelve Labs · Deepgram · Gemini
            </p>
          </>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 backdrop-blur-sm animate-fade-in">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-signal/10 border border-signal/20 flex items-center justify-center">
                <Mic2 size={16} className="text-signal" />
              </div>
              <span className="font-display text-frost text-xl tracking-tight">SpeakIQ</span>
            </div>
            <ProcessingState progress={progress} stage={progressStage} />
          </div>
        )}

        {/* Results */}
        {status === 'complete' && result && (
          <ResultsDashboard result={result} onReset={reset} />
        )}
      </div>
    </main>
  )
}
