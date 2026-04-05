'use client'

import { useState } from 'react'
import { RotateCcw, Download, Quote } from 'lucide-react'
import { ScoreRing } from './ScoreRing'
import { MetricCard } from './MetricCard'
import { CoachingTips } from './CoachingTips'
import { cn, getScoreColor, getScoreLabel, formatDuration } from '@/lib/utils'
import type { AnalysisResult } from '@/types'

interface ResultsDashboardProps {
  result: AnalysisResult
  onReset: () => void
}

type Tab = 'overview' | 'metrics' | 'tips'

export function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const [tab, setTab] = useState<Tab>('overview')

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'metrics', label: 'Metrics' },
    { key: 'tips', label: `Tips (${result.coaching_tips.length})` },
  ]

  const topFillers = Object.entries(result.filler_word_count)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="w-full animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-frost">Analysis Complete</h2>
          <p className="text-frost/40 text-sm mt-0.5 font-mono">
            {formatDuration(result.video_duration)} video · {new Date(result.timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-frost/50 hover:text-frost hover:bg-white/5 transition-all"
          >
            <RotateCcw size={14} />
            New analysis
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200',
              tab === t.key
                ? 'bg-white/[0.08] text-frost'
                : 'text-frost/40 hover:text-frost/70'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          {/* Score hero */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center gap-6">
            <ScoreRing
              score={result.overall_score}
              size={140}
              label="Overall"
              sublabel={getScoreLabel(result.overall_score)}
            />
            <div className="flex-1">
              <p className="text-frost/70 text-sm leading-relaxed mb-4">{result.summary}</p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-frost/30 text-xs font-mono mb-1">Speech pace</p>
                  <p className="text-frost font-medium text-sm">
                    <span style={{ color: getScoreColor(result.metrics.speech_pace.score) }}>
                      {result.words_per_minute}
                    </span>
                    <span className="text-frost/30 text-xs ml-1">WPM</span>
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-white/[0.03] border border-white/[0.05]">
                  <p className="text-frost/30 text-xs font-mono mb-1">Filler words</p>
                  <p className="text-frost font-medium text-sm">
                    <span style={{ color: getScoreColor(result.metrics.filler_words.score) }}>
                      {Object.values(result.filler_word_count).reduce((a, b) => a + b, 0)}
                    </span>
                    <span className="text-frost/30 text-xs ml-1">total</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript excerpt */}
          {result.transcript_excerpt && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-3">
                <Quote size={14} className="text-signal" />
                <span className="text-frost/40 text-xs font-mono uppercase tracking-wider">Transcript excerpt</span>
              </div>
              <p className="text-frost/60 text-sm leading-relaxed italic font-display">
                "{result.transcript_excerpt}"
              </p>
            </div>
          )}

          {/* Filler word breakdown */}
          {topFillers.length > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-frost/40 text-xs font-mono uppercase tracking-wider mb-4">Filler word breakdown</p>
              <div className="space-y-2">
                {topFillers.map(([word, count]) => {
                  const total = Object.values(result.filler_word_count).reduce((a, b) => a + b, 0)
                  const pct = total ? Math.round((count / total) * 100) : 0
                  return (
                    <div key={word} className="flex items-center gap-3">
                      <span className="text-frost/60 text-sm font-mono w-16 flex-shrink-0">"{word}"</span>
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warn/60 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-frost/40 text-xs font-mono w-8 text-right">{count}×</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top 3 tips preview */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-frost/40 text-xs font-mono uppercase tracking-wider">Top priorities</p>
              <button
                onClick={() => setTab('tips')}
                className="text-signal text-xs hover:underline font-mono"
              >
                View all →
              </button>
            </div>
            <div className="space-y-2">
              {result.coaching_tips
                .filter(t => t.priority === 'high')
                .slice(0, 3)
                .map((tip, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-frost text-sm">{tip.title}</p>
                      <p className="text-frost/30 text-xs mt-0.5">{tip.description.slice(0, 80)}…</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* METRICS TAB */}
      {tab === 'metrics' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          {Object.entries(result.metrics).map(([category, metric], i) => (
            <MetricCard
              key={category}
              category={category}
              metric={metric}
              delay={i * 80}
            />
          ))}
        </div>
      )}

      {/* TIPS TAB */}
      {tab === 'tips' && (
        <div className="animate-fade-in">
          <CoachingTips tips={result.coaching_tips} />
        </div>
      )}
    </div>
  )
}
