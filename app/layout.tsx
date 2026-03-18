import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K-Arena | AI Financial Exchange',
  description: 'AI-native financial exchange platform. Demo environment.',
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en" />
      </head>
      <body style={{ background: '#080808', color: '#F0F0EC' }}>{children}</body>
    </html>
  )
}
