'use client'

import { cn } from '@/lib/utils'

interface ProcessingStateProps {
  progress: number
  stage: string
}

const STAGES = [
  { label: 'Uploading video', icon: '⬆' },
  { label: 'Indexing with Twelve Labs', icon: '🎬' },
  { label: 'Transcribing audio', icon: '🎙' },
  { label: 'Analyzing speech patterns', icon: '📊' },
  { label: 'Generating coaching tips', icon: '✨' },
]

export function ProcessingState({ progress, stage }: ProcessingStateProps) {
  const stageIndex = Math.min(
    Math.floor((progress / 100) * STAGES.length),
    STAGES.length - 1
  )

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {/* Animated waveform */}
      <div className="flex items-end gap-1 h-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="waveform-bar w-1.5 rounded-full bg-signal"
            style={{
              height: `${20 + Math.random() * 28}px`,
              animationDelay: `${i * 0.08}s`,
              opacity: 0.4 + (i / 12) * 0.6,
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm space-y-2">
        <div className="flex justify-between text-xs text-frost/40 font-mono">
          <span>{STAGES[stageIndex].icon} {STAGES[stageIndex].label}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-signal rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stage dots */}
      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={cn(
              'w-2 h-2 rounded-full transition-all duration-500',
              i < stageIndex && 'bg-signal',
              i === stageIndex && 'bg-signal scale-125 animate-pulse',
              i > stageIndex && 'bg-white/10'
            )} />
            {i < STAGES.length - 1 && (
              <div className={cn(
                'w-6 h-px transition-all duration-500',
                i < stageIndex ? 'bg-signal/40' : 'bg-white/10'
              )} />
            )}
          </div>
        ))}
      </div>

      <p className="text-frost/30 text-xs font-mono text-center max-w-xs">
        AI analysis takes 1–2 minutes depending on video length
      </p>
    </div>
  )
}
