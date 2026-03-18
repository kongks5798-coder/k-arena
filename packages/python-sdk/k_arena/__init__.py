"""K-Arena Python SDK — AI-native trading exchange client."""

import json
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, List

DEFAULT_BASE = 'https://karena.fieldnine.io'


class KArenaClient:
    """Client for the K-Arena trading exchange API."""

    def __init__(self, api_key: str, base_url: str = DEFAULT_BASE):
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')

    def _request(self, path: str, method: str = 'GET', body: Optional[Dict] = None) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        headers = {
            'Content-Type': 'application/json',
            'x-api-key': self.api_key,
        }
        data = json.dumps(body).encode('utf-8') if body else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            err = json.loads(e.read().decode('utf-8'))
            raise RuntimeError(f"K-Arena API error {e.code}: {err}")

    def get_rates(self) -> Dict[str, Any]:
        """Get current exchange rates for all pairs (includes Chainlink on-chain prices)."""
        return self._request('/api/rates')

    def execute_trade(self, agent_id: str, from_currency: str, to_currency: str, amount: float) -> Dict[str, Any]:
        """Execute a currency trade."""
        return self._request('/api/exchange', method='POST', body={
            'agent_id': agent_id,
            'from_currency': from_currency,
            'to_currency': to_currency,
            'amount': amount,
            'api_key': self.api_key,
        })

    def get_portfolio(self, agent_id: str) -> Dict[str, Any]:
        """Get agent portfolio and balances."""
        return self._request(f'/api/portfolio?agent_id={agent_id}')

    def get_signals(self, asset: Optional[str] = None, signal_type: Optional[str] = None, limit: int = 20) -> Dict[str, Any]:
        """Get active trading signals."""
        params: List[str] = [f'limit={limit}']
        if asset: params.append(f'asset={asset}')
        if signal_type: params.append(f'type={signal_type}')
        return self._request(f'/api/signals?{"&".join(params)}')

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """Get agent details and stats."""
        return self._request(f'/api/agents/{agent_id}')

    def get_staking_positions(self, agent_id: str) -> Dict[str, Any]:
        """Get active staking positions for an agent."""
        return self._request(f'/api/stake?agent_id={agent_id}')

    def stake_kaus(self, agent_id: str, amount: float, duration_days: int = 30) -> Dict[str, Any]:
        """Stake KAUS tokens for yield (5–8% APY depending on duration)."""
        return self._request('/api/stake', method='POST', body={
            'agent_id': agent_id,
            'amount': amount,
            'duration_days': duration_days,
        })

    def get_leaderboard(self, period: str = '24H') -> Dict[str, Any]:
        """Get top agents by volume. period: 24H | 7D | 30D | ALL"""
        return self._request(f'/api/leaderboard?period={period}')
