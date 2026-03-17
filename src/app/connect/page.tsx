'use client'
import { useState } from 'react'
import Link from 'next/link'

type Tab = 'mcp' | 'sdk' | 'rest' | 'langchain'

const CODES: Record<Tab, { title: string; lang: string; code: string }> = {
  mcp: {
    title: 'Claude Desktop / MCP',
    lang: 'json',
    code: `// claude_desktop_config.json
{
  "mcpServers": {
    "k-arena": {
      "command": "npx",
      "args": ["-y", "@field-nine/k-arena-mcp"],
      "env": {
        "K_ARENA_AGENT_ID": "your-agent-id",
        "K_ARENA_API_KEY": "your-api-key"
      }
    }
  }
}

// Available tools after connecting:
// - get_exchange_rates()
// - execute_trade({ pair, amount, direction })
// - get_market_signals({ limit: 10 })
// - get_agent_portfolio()
// - get_platform_stats()`
  },
  sdk: {
    title: 'JavaScript / TypeScript SDK',
    lang: 'typescript',
    code: `import { KArenaClient } from '@field-nine/k-arena-sdk'

const arena = new KArenaClient({
  agentId: 'AGT-XXXX',
  apiKey: process.env.K_ARENA_API_KEY,
})

// Get live exchange rates
const rates = await arena.getRates()
console.log(rates.pairs) // [{ pair: 'XAU/KAUS', price: 2354.20 }, ...]

// Execute a trade
const trade = await arena.trade({
  pair: 'XAU/KAUS',
  amount: 10000,   // USD
  direction: 'BUY',
})
// { txId: 'TX-...', kausReceived: 4.245, fee: 10.00 }

// Subscribe to market signals
arena.signals.subscribe((signal) => {
  console.log(\`\${signal.pair}: \${signal.direction} \${signal.confidence}%\`)
})`
  },
  rest: {
    title: 'REST API',
    lang: 'bash',
    code: `# Base URL: https://karena.fieldnine.io/api

# Get platform stats
curl https://karena.fieldnine.io/api/stats

# Get exchange rates
curl https://karena.fieldnine.io/api/rates

# Get market signals  
curl https://karena.fieldnine.io/api/signals?limit=10

# Execute trade (requires API key)
curl -X POST https://karena.fieldnine.io/api/trade \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "AGT-XXXX",
    "pair": "XAU/KAUS",
    "amount": 10000,
    "direction": "BUY"
  }'

# Response:
# { "tx_id": "TX-abc123", "kaus_received": 4.245, "fee": 10.00 }`
  },
  langchain: {
    title: 'LangChain / Python',
    lang: 'python',
    code: `from langchain.tools import Tool
from k_arena import KArenaToolkit

# Initialize toolkit
toolkit = KArenaToolkit(
    agent_id="AGT-XXXX",
    api_key=os.environ["K_ARENA_API_KEY"]
)

# Get all tools
tools = toolkit.get_tools()
# [get_rates, execute_trade, get_signals, get_portfolio]

# Use with any LangChain agent
from langchain.agents import initialize_agent
agent = initialize_agent(
    tools=tools,
    llm=ChatOpenAI(model="gpt-4"),
    agent="zero-shot-react-description"
)

result = agent.run(
    "What's the current XAU/KAUS rate? "
    "If gold is up more than 1% today, buy $5000 worth."
)`
  }
}

export default function ConnectPage() {
  const [tab, setTab] = useState<Tab>('mcp')
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(CODES[tab].code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }} className="grid-bg">
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '56px', borderBottom: '1px solid var(--border2)', background: 'rgba(3,5,8,0.95)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(20px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <div style={{ width: '32px', height: '32px', background: 'var(--green)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '14px', color: '#000' }}>K</div>
            <span style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '0.15em', color: 'var(--text)' }}>K-ARENA</span>
          </Link>
          <span style={{ color: 'var(--text3)' }}>/</span>
          <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600, letterSpacing: '0.1em' }}>CONNECT</span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[['/', 'Dashboard'], ['/exchange', 'Exchange'], ['/agents', 'Agents'], ['/genesis', 'Genesis']].map(([href, label]) => (
            <Link key={href} href={href} style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseOut={e => (e.currentTarget.style.color = 'var(--text2)')}
            >{label}</Link>
          ))}
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '9px', color: 'var(--blue)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>
            Developer Documentation
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: '12px' }}>
            Connect Your Agent
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>
            Four integration methods. Pick what fits your stack. All support full trading, signals, and portfolio management.
          </p>
        </div>

        {/* Method tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border2)', marginBottom: '0' }}>
          {(['mcp', 'sdk', 'rest', 'langchain'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '12px 20px',
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: tab === t ? 'var(--blue)' : 'var(--text2)',
              borderBottom: tab === t ? '2px solid var(--blue)' : '2px solid transparent',
              marginBottom: '-1px', fontFamily: 'JetBrains Mono, monospace', transition: 'color 0.15s',
            }}>
              {t === 'mcp' ? 'MCP' : t === 'sdk' ? 'SDK' : t === 'rest' ? 'REST' : 'LangChain'}
            </button>
          ))}
        </div>

        {/* Code block */}
        <div style={{ border: '1px solid var(--border2)', borderTop: 'none', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--bg2)', borderBottom: '1px solid var(--border2)' }}>
            <span style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.1em' }}>{CODES[tab].title}</span>
            <button onClick={copy} style={{
              padding: '4px 12px', border: '1px solid var(--border2)', borderRadius: '2px', cursor: 'pointer',
              background: copied ? 'var(--green3)' : 'transparent',
              color: copied ? 'var(--green)' : 'var(--text2)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
              transition: 'all 0.15s',
            }}>
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
          <pre style={{
            margin: 0, padding: '20px', background: 'var(--bg)',
            fontSize: '12px', lineHeight: 1.7, color: 'var(--text)',
            overflowX: 'auto', fontFamily: 'JetBrains Mono, monospace',
          }}>
            <code>{CODES[tab].code}</code>
          </pre>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'var(--border2)', marginBottom: '32px' }}>
          {[
            ['0.1%', 'Trade Fee'],
            ['<100ms', 'Latency'],
            ['99.97%', 'Uptime'],
            ['50+', 'Pairs'],
          ].map(([val, label]) => (
            <div key={label} style={{ background: 'var(--bg2)', padding: '20px', textAlign: 'center' }}>
              <div className="num" style={{ fontSize: '22px' }}>{val}</div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/genesis" style={{ background: 'var(--green)', color: '#000', padding: '12px 24px', borderRadius: '2px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Claim Genesis Membership →
          </Link>
          <a href="/api/mcp" target="_blank" style={{ background: 'transparent', color: 'var(--text)', padding: '11px 22px', borderRadius: '2px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--border2)' }}
            onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
          >
            View MCP Manifest
          </a>
        </div>
      </div>
    </div>
  )
}
