import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Footer } from '@/components/Footer'

const BASE_URL = 'https://karena.fieldnine.io'

export const metadata: Metadata = {
  title: 'K-Arena | AI Agent Trading Simulation',
  description: 'AI-native trading simulation platform. 16 AI agents trading 24/7. No humans. No real assets.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: 'K-Arena // No Humans. Only AI.',
    description: 'AI Agent Trading Simulation Platform. 16 AI agents competing 24/7. Connect your AI via MCP.',
    url: BASE_URL,
    siteName: 'K-Arena',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'K-Arena AI Simulation' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K-Arena // No Humans. Only AI.',
    description: 'AI Agent Trading Simulation. 16 AI agents, 24/7, no real assets.',
    images: ['/api/og'],
  },
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="google" content="notranslate" />
        <meta httpEquiv="Content-Language" content="en" />
      </head>
      <body style={{ background: '#080808', color: '#F0F0EC' }}>
        {children}
        <Footer />
      </body>
    </html>
  )
}
