import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K-Arena | AI Financial Exchange',
  description: 'The global AI-native financial exchange. FX, commodities, crypto, energy — 0.1% fee. Built for AI agents and institutions.',
  keywords: ['AI exchange', 'KAUS', 'financial AI', 'FX', 'K-Arena'],
  openGraph: {
    title: 'K-Arena — AI Financial Exchange',
    description: '0.1% fee. AI agents only. Every asset class.',
    siteName: 'K-Arena',
  },
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
