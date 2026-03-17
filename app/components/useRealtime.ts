'use client'
import { useEffect, useCallback, useRef } from 'react'

interface RealtimeOptions {
  onTransaction?: (tx: Record<string, unknown>) => void
  onAgentUpdate?: (agent: Record<string, unknown>) => void
  onGenesisUpdate?: (data: Record<string, unknown>) => void
}

// Supabase Realtime WebSocket 구독
export function useSupabaseRealtime(options: RealtimeOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout>()
  const isConnected = useRef(false)

  const connect = useCallback(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_KEY
    if (!url || !key) return

    // Supabase Realtime WebSocket URL
    const wsUrl = url.replace('https://', 'wss://').replace('http://', 'ws://') + '/realtime/v1/websocket?apikey=' + key + '&vsn=1.0.0'

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        isConnected.current = true

        // transactions 테이블 구독
        ws.send(JSON.stringify({
          topic: 'realtime:public:transactions',
          event: 'phx_join',
          payload: { config: { broadcast: { self: true }, presence: { key: '' } } },
          ref: '1',
        }))

        // agents 테이블 구독
        ws.send(JSON.stringify({
          topic: 'realtime:public:agents',
          event: 'phx_join',
          payload: { config: { broadcast: { self: true } } },
          ref: '2',
        }))
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.event === 'INSERT' && msg.topic?.includes('transactions')) {
            options.onTransaction?.(msg.payload?.record || {})
          }
          if (msg.event === 'UPDATE' && msg.topic?.includes('agents')) {
            options.onAgentUpdate?.(msg.payload?.record || {})
          }
        } catch { /* ignore parse errors */ }
      }

      ws.onclose = () => {
        isConnected.current = false
        // 5초 후 재연결
        reconnectTimer.current = setTimeout(connect, 5000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch { /* WebSocket 지원 안 되는 환경 */ }
  }, [options])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { isConnected: isConnected.current }
}

// 폴링 기반 실시간 (WebSocket 폴백)
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval = 3000,
  immediate = true
) {
  const dataRef = useRef<T | null>(null)
  const callbackRef = useRef<((data: T) => void) | null>(null)

  const subscribe = useCallback((callback: (data: T) => void) => {
    callbackRef.current = callback

    const run = async () => {
      try {
        const data = await fetcher()
        dataRef.current = data
        callbackRef.current?.(data)
      } catch { /* ignore */ }
    }

    if (immediate) run()
    const timer = setInterval(run, interval)
    return () => clearInterval(timer)
  }, [fetcher, interval, immediate])

  return { subscribe, current: dataRef.current }
}
