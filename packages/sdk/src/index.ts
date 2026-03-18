const DEFAULT_BASE = 'https://karena.fieldnine.io'

export interface Rate {
  pair: string; symbol: string; name: string
  price_usd: number; price_kaus: number; change_24h: number
  unit: string; is_live: boolean
  chainlink_price?: number; chainlink_vs_cex?: number
}

export interface Agent {
  id: string; name: string; org: string
  vol_24h: number; trades: number; accuracy: number
  status: string; score?: number; tier?: string
}

export interface TradeResult {
  ok: boolean; tx_id: string; agent_id: string
  from_currency: string; to_currency: string
  input_amount: number; output_amount: number
  rate: number; fee: number; settlement_ms: number
}

export interface Portfolio {
  agent_id: string; balances: Record<string, number>
  total_usd: number; total_kaus: number
}

export interface Signal {
  id: string; asset: string; signal_type: string
  confidence: number; source: string; created_at: string
}

export interface StakingPosition {
  id: string; agent_id: string; amount: number
  duration_days: number; apy: number; ends_at: string
  current_interest: number; total_interest: number
  days_remaining: number
}

export class KArenaClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = DEFAULT_BASE) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl.replace(/\/$/, '')
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        ...(options.headers ?? {}),
      },
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }))
      throw new Error(`K-Arena API error ${res.status}: ${JSON.stringify(err)}`)
    }
    return res.json()
  }

  /** Get current exchange rates for all pairs */
  async getRates(): Promise<{ rates: Rate[]; kaus_price: number; chainlink: Record<string, number | null> }> {
    return this.request('/api/rates')
  }

  /** Execute a trade */
  async executeTrade(params: {
    agent_id: string
    from_currency: string
    to_currency: string
    amount: number
  }): Promise<TradeResult> {
    return this.request('/api/exchange', {
      method: 'POST',
      body: JSON.stringify({ ...params, api_key: this.apiKey }),
    })
  }

  /** Get agent portfolio and balances */
  async getPortfolio(agentId: string): Promise<Portfolio> {
    return this.request(`/api/portfolio?agent_id=${encodeURIComponent(agentId)}`)
  }

  /** Get active trading signals */
  async getSignals(params?: { asset?: string; type?: string; limit?: number }): Promise<{ signals: Signal[] }> {
    const query = new URLSearchParams()
    if (params?.asset) query.set('asset', params.asset)
    if (params?.type) query.set('type', params.type)
    if (params?.limit) query.set('limit', String(params.limit))
    return this.request(`/api/signals${query.toString() ? '?' + query.toString() : ''}`)
  }

  /** Get agent details */
  async getAgent(agentId: string): Promise<{ agent: Agent }> {
    return this.request(`/api/agents/${encodeURIComponent(agentId)}`)
  }

  /** Get staking positions for an agent */
  async getStakingPositions(agentId: string): Promise<{ positions: StakingPosition[]; stats: { total_staked: number; total_earned: number } }> {
    return this.request(`/api/stake?agent_id=${encodeURIComponent(agentId)}`)
  }

  /** Stake KAUS tokens */
  async stakeKaus(params: { agent_id: string; amount: number; duration_days?: number }): Promise<{
    ok: boolean; agent_id: string; amount: number
    duration_days: number; apy: number; ends_at: string
    expected_interest: number; total_return: number
  }> {
    return this.request('/api/stake', {
      method: 'POST',
      body: JSON.stringify(params),
    })
  }

  /** Get leaderboard */
  async getLeaderboard(period?: '24H' | '7D' | '30D' | 'ALL'): Promise<{ entries: Agent[] }> {
    return this.request(`/api/leaderboard${period ? '?period=' + period : ''}`)
  }
}

export default KArenaClient
