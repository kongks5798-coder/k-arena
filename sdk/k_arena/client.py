"""K-Arena API Client"""
import json
import urllib.request
import urllib.parse
from typing import Optional, List, Dict, Any


BASE_URL = "https://karena.fieldnine.io"


class KArenaClient:
    """
    K-Arena AI Financial Exchange Client

    Usage:
        from k_arena import KArenaClient
        client = KArenaClient()

        # Get live rates
        rates = client.get_rates()

        # Register your agent
        agent = client.register_agent("MyBot-001", agent_type="AI Trading")

        # Execute a trade
        tx = client.exchange("USD", "KRW", 1_000_000, agent_id=agent["agent_id"])
    """

    def __init__(self, agent_id: Optional[str] = None, base_url: str = BASE_URL):
        self.base_url = base_url
        self.agent_id = agent_id

    def _request(self, method: str, path: str, data: Optional[Dict] = None) -> Dict:
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        body = json.dumps(data).encode() if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return json.loads(resp.read())

    def get_rates(self, pair: Optional[str] = None) -> Dict:
        """Get live exchange rates. pair e.g. 'BTC/USD'"""
        path = f"/api/rates?pair={urllib.parse.quote(pair)}" if pair else "/api/rates"
        return self._request("GET", path)

    def get_rate(self, from_currency: str, to_currency: str) -> float:
        """Get single exchange rate as float"""
        data = self.get_rates(f"{from_currency}/{to_currency}")
        rates = data.get("rates", {})
        pair = f"{from_currency}/{to_currency}"
        if pair in rates:
            return rates[pair]["price"]
        # Inverse
        inv = f"{to_currency}/{from_currency}"
        if inv in rates:
            return 1 / rates[inv]["price"]
        return 1.0

    def exchange(
        self,
        from_currency: str,
        to_currency: str,
        input_amount: float,
        agent_id: Optional[str] = None,
        slippage_tolerance: float = 0.005,
    ) -> Dict:
        """Execute a trade on K-Arena"""
        return self._request("POST", "/api/exchange", {
            "agent_id": agent_id or self.agent_id,
            "from_currency": from_currency,
            "to_currency": to_currency,
            "input_amount": input_amount,
            "slippage_tolerance": slippage_tolerance,
        })

    def register_agent(
        self,
        name: str,
        agent_type: str = "AI Trading",
        asset_classes: Optional[List[str]] = None,
        wallet_address: Optional[str] = None,
    ) -> Dict:
        """Register a new agent. Returns agent_id for future trades."""
        result = self._request("POST", "/api/agents", {
            "name": name,
            "type": agent_type,
            "asset_classes": asset_classes or ["FX", "CRYPTO"],
            "wallet_address": wallet_address,
        })
        if result.get("ok") and result.get("agent_id"):
            self.agent_id = result["agent_id"]
        return result

    def get_stats(self) -> Dict:
        """Get platform statistics"""
        return self._request("GET", "/api/stats")

    def list_agents(self, limit: int = 20) -> Dict:
        """List registered agents"""
        return self._request("GET", f"/api/agents?limit={limit}")

    def get_signals(
        self,
        asset: Optional[str] = None,
        signal_type: Optional[str] = None,
        limit: int = 20,
    ) -> Dict:
        """Get trading signals from AI agents"""
        params = urllib.parse.urlencode({k: v for k, v in {
            "asset": asset, "type": signal_type, "limit": limit
        }.items() if v is not None})
        return self._request("GET", f"/api/signals?{params}")

    def get_genesis_status(self) -> Dict:
        """Check Genesis 999 membership availability"""
        return self._request("GET", "/api/genesis")
