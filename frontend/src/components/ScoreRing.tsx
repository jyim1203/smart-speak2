'use client'

import { useEffect, useState } from 'react'
import { getScoreColor } from '@/lib/utils'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  animate?: boolean
}

export function ScoreRing({
  score,
  size = 140,
  strokeWidth = 8,
  label,
  sublabel,
  animate = true,
}: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score)
  const [dashOffset, setDashOffset] = useState<number>(0)

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  useEffect(() => {
    if (!animate) return
    const timer = setTimeout(() => {
      setDisplayScore(score)
    }, 100)

    // Count up animation
    const start = Date.now()
    const duration = 1200
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    return () => clearTimeout(timer)
  }, [score, animate])

  const progress = displayScore / 100
  const offset = circumference * (1 - progress)
  const color = getScoreColor(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
          style={{ transition: animate ? 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-medium leading-none"
          style={{ fontSize: size * 0.22, color }}
        >
          {displayScore}
        </span>
        {label && (
          <span
            className="text-frost/60 font-body mt-1"
            style={{ fontSize: size * 0.09 }}
          >
            {label}
          </span>
        )}
        {sublabel && (
          <span
            className="text-frost/30 font-mono mt-0.5"
            style={{ fontSize: size * 0.08 }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  )
}
