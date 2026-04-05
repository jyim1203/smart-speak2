import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpeakIQ — AI Public Speaking Coach',
  description: 'Upload or record a video and get AI-powered feedback on your speech patterns, confidence, eye contact, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
