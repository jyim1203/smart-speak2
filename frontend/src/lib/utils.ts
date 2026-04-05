import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { MetricScore } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#00E5A0'
  if (score >= 60) return '#FFB443'
  if (score >= 40) return '#FF8C42'
  return '#FF5C5C'
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  return { high: '#FF5C5C', medium: '#FFB443', low: '#4DA8FF' }[priority]
}

export function getPriorityBg(priority: 'high' | 'medium' | 'low'): string {
  return {
    high: 'rgba(255,92,92,0.1)',
    medium: 'rgba(255,180,67,0.1)',
    low: 'rgba(77,168,255,0.1)',
  }[priority]
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    eye_contact: '👁',
    confidence: '💪',
    speech_pace: '⏱',
    filler_words: '🔇',
    posture: '🧍',
    vocal_variety: '🎵',
  }
  return icons[category] || '📊'
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    eye_contact: 'Eye Contact',
    confidence: 'Confidence',
    speech_pace: 'Speech Pace',
    filler_words: 'Filler Words',
    posture: 'Posture',
    vocal_variety: 'Vocal Variety',
  }
  return labels[category] || category
}
