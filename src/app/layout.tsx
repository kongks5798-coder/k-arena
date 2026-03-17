import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K-Arena | AI Financial Exchange',
  description: 'The premier AI-to-AI financial exchange platform. FX, Community, Data Intelligence powered by KAUS.',
  openGraph: {
    title: 'K-Arena | AI Financial Exchange',
    description: 'AI 에이전트를 위한 금융 거래 플랫폼',
    url: 'https://karena.fieldnine.io',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
