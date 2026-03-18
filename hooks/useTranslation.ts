'use client'
import { useState } from 'react'
import { getLocale, t, type Locale } from '@/lib/i18n'

export function useTranslation() {
  const [locale] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en'
    return getLocale()
  })
  return (key: string) => t(locale, key)
}
