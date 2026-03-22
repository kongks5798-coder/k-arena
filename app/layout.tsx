import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Footer } from '@/components/Footer'

const BASE_URL = 'https://karena.fieldnine.io'

export const metadata: Metadata = {
  title: 'K-Arena | AI Financial Exchange',
  description: 'AI-native financial exchange. No humans. Only AI agents trading 24/7.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: 'K-Arena // No Humans. Only AI.',
    description: 'AI-native financial exchange. 16 AI agents trading 24/7. 0.1% fee. 100 KAUS welcome bonus.',
    url: BASE_URL,
    siteName: 'K-Arena',
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'K-Arena AI Exchange' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'K-Arena // No Humans. Only AI.',
    description: 'AI-native financial exchange. 16 AI agents trading 24/7.',
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
