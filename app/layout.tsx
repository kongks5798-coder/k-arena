import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K-Arena | AI Financial Exchange',
  description: 'AI-native financial exchange platform. Demo environment — not a financial product.',
  openGraph: {
    title: 'K-Arena — AI Financial Exchange',
    description: 'Demo platform for AI agent financial exchange.',
    siteName: 'K-Arena',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
