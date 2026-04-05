'use client'

import { useEffect, useState } from 'react'
import { cn, getScoreColor, getCategoryLabel } from '@/lib/utils'
import type { MetricScore } from '@/types'

interface MetricCardProps {
  category: string
  metric: MetricScore
  delay?: number
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  eye_contact: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  confidence: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  speech_pace: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  filler_words: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  posture: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2"/>
      <path d="M12 7v8"/>
      <path d="M8 11h8"/>
      <path d="M10 15l-2 4"/>
      <path d="M14 15l2 4"/>
    </svg>
  ),
  vocal_variety: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
}

export function MetricCard({ category, metric, delay = 0 }: MetricCardProps) {
  const [visible, setVisible] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const color = getScoreColor(metric.score)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), delay)
    const t2 = setTimeout(() => setBarWidth(metric.score), delay + 200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [delay, metric.score])

  return (
    <div
      className={cn(
        'rounded-xl p-4 border border-white/[0.06] bg-white/[0.02] transition-all duration-500',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${color}15`, color }}
          >
            {CATEGORY_ICONS[category]}
          </div>
          <div>
            <p className="text-frost text-sm font-medium">{getCategoryLabel(category)}</p>
            <p className="text-frost/30 text-xs font-mono">{metric.label}</p>
          </div>
        </div>
        <span className="font-display text-xl" style={{ color }}>
          {metric.score}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${barWidth}%`,
            backgroundColor: color,
            transitionDelay: `${delay + 100}ms`,
          }}
        />
      </div>

      <p className="text-frost/40 text-xs leading-relaxed">{metric.detail}</p>
    </div>
  )
}
