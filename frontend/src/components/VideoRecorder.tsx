'use client'

import { useRef, useEffect } from 'react'
import { Video, Square, Pause, Play, RotateCcw, Circle } from 'lucide-react'
import { useRecorder } from '@/hooks/useRecorder'
import { cn, formatDuration } from '@/lib/utils'

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  disabled?: boolean
}

export function VideoRecorder({ onRecordingComplete, disabled }: VideoRecorderProps) {
  const { state, duration, blob, previewUrl, stream, start, stop, pause, resume, reset, error } = useRecorder()
  const liveRef = useRef<HTMLVideoElement>(null)

  // Attach live stream to video element
  useEffect(() => {
    if (liveRef.current && stream) {
      liveRef.current.srcObject = stream
    }
  }, [stream])

  // Notify parent when recording is done
  useEffect(() => {
    if (blob && state === 'stopped') {
      onRecordingComplete(blob)
    }
  }, [blob, state, onRecordingComplete])

  const isLive = state === 'recording' || state === 'paused'
  const isDone = state === 'stopped' && previewUrl

  return (
    <div className="w-full space-y-4">
      {/* Video area */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden bg-ink-muted aspect-video',
        'border transition-all duration-300',
        isLive ? 'border-signal/40' : 'border-white/10'
      )}>
        {/* Live feed */}
        {isLive && (
          <video
            ref={liveRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
        )}

        {/* Playback preview */}
        {isDone && (
          <video
            src={previewUrl!}
            controls
            className="w-full h-full object-cover"
          />
        )}

        {/* Idle state */}
        {state === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Video size={28} className="text-frost/30" />
            </div>
            <p className="text-frost/30 text-sm">Camera preview will appear here</p>
          </div>
        )}

        {/* Requesting permissions */}
        {state === 'requesting' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-signal animate-pulse" />
            <p className="text-frost/50 text-sm">Requesting camera access…</p>
          </div>
        )}

        {/* Recording indicator */}
        {state === 'recording' && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            <span className="text-white text-xs font-mono font-medium">{formatDuration(duration)}</span>
          </div>
        )}

        {/* Paused indicator */}
        {state === 'paused' && (
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1.5 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-warn" />
            <span className="text-white text-xs font-mono font-medium">PAUSED · {formatDuration(duration)}</span>
          </div>
        )}

        {/* Pulse ring for recording */}
        {state === 'recording' && (
          <div className="absolute top-3 right-3">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-signal" />
              <div className="absolute inset-0 rounded-full bg-signal animate-pulse-ring" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        {state === 'idle' && (
          <button
            onClick={start}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200',
              'bg-signal text-ink hover:bg-signal-dim active:scale-95',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            <Circle size={16} className="fill-current" />
            Start Recording
          </button>
        )}

        {state === 'recording' && (
          <>
            <button
              onClick={pause}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-frost transition-all"
            >
              <Pause size={16} />
              Pause
            </button>
            <button
              onClick={stop}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 hover:bg-danger/20 text-danger transition-all"
            >
              <Square size={14} className="fill-current" />
              Stop & Analyze
            </button>
          </>
        )}

        {state === 'paused' && (
          <>
            <button
              onClick={resume}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-signal/10 hover:bg-signal/20 text-signal transition-all"
            >
              <Play size={16} className="fill-current" />
              Resume
            </button>
            <button
              onClick={stop}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-danger/10 hover:bg-danger/20 text-danger transition-all"
            >
              <Square size={14} className="fill-current" />
              Stop & Analyze
            </button>
          </>
        )}

        {state === 'stopped' && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-frost transition-all"
          >
            <RotateCcw size={15} />
            Record Again
          </button>
        )}
      </div>

      {error && (
        <p className="text-center text-danger text-sm">{error}</p>
      )}
    </div>
  )
}
