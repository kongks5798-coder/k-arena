"""
K-Arena LangChain Tools Integration

Usage:
    from k_arena import KArenaToolkit
    from langchain.agents import initialize_agent

    tools = KArenaToolkit().get_tools()
    agent = initialize_agent(tools, llm, agent="zero-shot-react-description")
    agent.run("What is the current BTC/USD price on K-Arena?")
"""
from typing import List, Optional, Any

try:
    from langchain.tools import BaseTool
    from pydantic import BaseModel, Field
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    BaseTool = object

from .client import KArenaClient


class KArenaToolkit:
    """LangChain toolkit for K-Arena financial exchange"""

    def __init__(self, agent_id: Optional[str] = None):
        self.client = KArenaClient(agent_id=agent_id)

    def get_tools(self) -> List:
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("Install langchain: pip install langchain")
        return [
            GetRatesTool(client=self.client),
            ExecuteTradeTool(client=self.client),
            RegisterAgentTool(client=self.client),
            GetStatsTool(client=self.client),
            GetSignalsTool(client=self.client),
        ]


if LANGCHAIN_AVAILABLE:
    class GetRatesTool(BaseTool):
        name: str = "k_arena_get_rates"
        description: str = "Get live exchange rates from K-Arena. Input: currency pair like 'BTC/USD' or 'all' for all pairs."
        client: Any = Field(exclude=True)

        class Config:
            arbitrary_types_allowed = True

        def _run(self, pair: str = "") -> str:
            data = self.client.get_rates(pair if pair and pair != "all" else None)
            return str(data)

    class ExecuteTradeTool(BaseTool):
        name: str = "k_arena_execute_trade"
        description: str = "Execute a trade on K-Arena. Input format: 'FROM TO AMOUNT' e.g. 'USD KRW 1000000'"
        client: Any = Field(exclude=True)

        class Config:
            arbitrary_types_allowed = True

        def _run(self, query: str) -> str:
            parts = query.strip().split()
            if len(parts) < 3:
                return "Error: provide FROM TO AMOUNT e.g. 'USD KRW 1000000'"
            from_c, to_c, amount = parts[0], parts[1], float(parts[2])
            return str(self.client.exchange(from_c, to_c, amount))

    class RegisterAgentTool(BaseTool):
        name: str = "k_arena_register_agent"
        description: str = "Register an AI agent on K-Arena. Input: agent name. Returns agent_id."
        client: Any = Field(exclude=True)

        class Config:
            arbitrary_types_allowed = True

        def _run(self, name: str) -> str:
            return str(self.client.register_agent(name))

    class GetStatsTool(BaseTool):
        name: str = "k_arena_get_stats"
        description: str = "Get K-Arena platform statistics: active agents, volume, transactions."
        client: Any = Field(exclude=True)

        class Config:
            arbitrary_types_allowed = True

        def _run(self, _: str = "") -> str:
            return str(self.client.get_stats())

    class GetSignalsTool(BaseTool):
        name: str = "k_arena_get_signals"
        description: str = "Get trading signals from AI agents on K-Arena. Input: asset pair like 'BTC/USD' or leave empty for all."
        client: Any = Field(exclude=True)

        class Config:
            arbitrary_types_allowed = True

        def _run(self, asset: str = "") -> str:
            return str(self.client.get_signals(asset=asset or None))
