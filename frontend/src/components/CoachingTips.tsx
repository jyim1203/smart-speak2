'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'
import { cn, getPriorityColor, getPriorityBg, getCategoryLabel } from '@/lib/utils'
import type { CoachingTip } from '@/types'

interface CoachingTipsProps {
  tips: CoachingTip[]
}

export function CoachingTips({ tips }: CoachingTipsProps) {
  const [expanded, setExpanded] = useState<number | null>(0)

  const sorted = [...tips].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 }
    return order[a.priority] - order[b.priority]
  })

  return (
    <div className="space-y-2">
      {sorted.map((tip, i) => {
        const isOpen = expanded === i
        const priorityColor = getPriorityColor(tip.priority)
        const priorityBg = getPriorityBg(tip.priority)

        return (
          <div
            key={i}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              {/* Priority badge */}
              <span
                className="text-[10px] font-mono font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0"
                style={{ color: priorityColor, backgroundColor: priorityBg }}
              >
                {tip.priority}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-frost text-sm font-medium truncate">{tip.title}</p>
                <p className="text-frost/30 text-xs mt-0.5">{getCategoryLabel(tip.category)}</p>
              </div>

              {isOpen
                ? <ChevronUp size={16} className="text-frost/30 flex-shrink-0" />
                : <ChevronDown size={16} className="text-frost/30 flex-shrink-0" />
              }
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-white/5">
                <p className="text-frost/60 text-sm leading-relaxed mt-3 mb-4">
                  {tip.description}
                </p>

                {/* Drill */}
                <div className="rounded-lg p-3 bg-signal/5 border border-signal/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Dumbbell size={14} className="text-signal" />
                    <span className="text-signal text-xs font-mono font-medium uppercase tracking-wider">Practice Drill</span>
                  </div>
                  <p className="text-frost/70 text-sm leading-relaxed">{tip.drill}</p>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
