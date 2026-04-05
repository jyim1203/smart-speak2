export interface AnalysisResult {
  overall_score: number
  summary: string
  metrics: {
    eye_contact: MetricScore
    confidence: MetricScore
    speech_pace: MetricScore
    filler_words: MetricScore
    posture: MetricScore
    vocal_variety: MetricScore
  }
  filler_word_count: Record<string, number>
  words_per_minute: number
  transcript_excerpt: string
  coaching_tips: CoachingTip[]
  timestamp: string
  video_duration: number
}

export interface MetricScore {
  score: number       // 0-100
  label: string       // "Excellent" | "Good" | "Needs Work" | "Poor"
  detail: string      // one-line explanation
}

export interface CoachingTip {
  category: 'eye_contact' | 'confidence' | 'speech_pace' | 'filler_words' | 'posture' | 'vocal_variety'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  drill: string       // actionable exercise
}

export type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'complete' | 'error'

export interface AnalysisJob {
  jobId: string
  status: AnalysisStatus
  progress: number    // 0-100
  result?: AnalysisResult
  error?: string
}
