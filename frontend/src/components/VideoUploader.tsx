'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Film, X, CheckCircle } from 'lucide-react'
import { cn, formatFileSize } from '@/lib/utils'

interface VideoUploaderProps {
  onFileSelect: (file: File) => void
  disabled?: boolean
}

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/mov']
const MAX_SIZE_MB = 500

export function VideoUploader({ onFileSelect, disabled }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validate = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|MOV|MP4)$/)) {
      return 'Please upload an MP4, MOV, or WebM video file.'
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File size must be under ${MAX_SIZE_MB}MB.`
    }
    return null
  }

  const handleFile = useCallback((file: File) => {
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    setSelectedFile(file)
    onFileSelect(file)
  }, [onFileSelect])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const clear = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group',
            'border-white/10 hover:border-signal/40 hover:bg-signal/5',
            isDragging && 'border-signal bg-signal/5 drop-zone-active',
            disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={disabled}
          />

          {/* Icon */}
          <div className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300',
            'bg-white/5 group-hover:bg-signal/10',
            isDragging && 'bg-signal/10 scale-110'
          )}>
            <Upload
              size={28}
              className={cn(
                'transition-colors duration-300 text-frost/40',
                'group-hover:text-signal',
                isDragging && 'text-signal'
              )}
            />
          </div>

          <p className="text-frost font-body font-medium mb-1">
            {isDragging ? 'Drop it here' : 'Drop your video here'}
          </p>
          <p className="text-frost/40 text-sm mb-4">or click to browse</p>
          <p className="text-frost/25 text-xs font-mono">
            MP4 · MOV · WebM &nbsp;·&nbsp; max {MAX_SIZE_MB}MB
          </p>

          {/* Scan line on drag */}
          {isDragging && (
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              <div className="scan-line absolute inset-x-0 h-16 opacity-60" />
            </div>
          )}
        </div>
      ) : (
        <div className="border border-white/10 rounded-2xl p-5 flex items-center gap-4 bg-white/[0.02]">
          <div className="w-12 h-12 rounded-xl bg-signal/10 flex items-center justify-center flex-shrink-0">
            <Film size={22} className="text-signal" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-frost font-medium truncate text-sm">{selectedFile.name}</p>
            <p className="text-frost/40 text-xs mt-0.5 font-mono">{formatFileSize(selectedFile.size)}</p>
          </div>
          <CheckCircle size={18} className="text-signal flex-shrink-0" />
          <button
            onClick={e => { e.stopPropagation(); clear() }}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-frost/40 hover:text-frost transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-danger text-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
