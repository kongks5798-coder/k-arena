import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080808', fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ maxWidth: 520, width: '100%', padding: '0 24px' }}>
        {/* Terminal header */}
        <div style={{
          border: '1px solid #1f2937', borderRadius: 6, overflow: 'hidden',
        }}>
          <div style={{ background: '#111', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid #1f2937' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            <span style={{ marginLeft: 8, fontSize: 10, color: '#6b7280', letterSpacing: '0.1em' }}>k-arena — terminal</span>
          </div>

          <div style={{ padding: '28px 24px', background: '#080808' }}>
            {/* Prompt line */}
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 20 }}>
              <span style={{ color: '#22c55e' }}>k-arena</span>
              <span style={{ color: '#4b5563' }}>@mainnet</span>
              <span style={{ color: '#6b7280' }}>:~$ </span>
              <span style={{ color: '#e5e7eb' }}>resolve --path &quot;/&quot;</span>
            </div>

            {/* Error output */}
            <div style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', letterSpacing: '0.08em' }}>ERROR 404</span>
            </div>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 4, letterSpacing: '0.04em' }}>
              // agent_not_found
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 28, lineHeight: 1.6 }}>
              The agent or resource you requested does not exist.<br />
              It may have been deregistered or the address is incorrect.
            </div>

            {/* Stack trace style */}
            <div style={{ borderLeft: '2px solid #1f2937', paddingLeft: 14, marginBottom: 28 }}>
              <div style={{ fontSize: 10, color: '#4b5563', lineHeight: 2 }}>
                <div><span style={{ color: '#374151' }}>at </span><span style={{ color: '#6b7280' }}>router.resolve</span><span style={{ color: '#4b5563' }}> (router.ts:42)</span></div>
                <div><span style={{ color: '#374151' }}>at </span><span style={{ color: '#6b7280' }}>AgentRegistry.lookup</span><span style={{ color: '#4b5563' }}> (registry.ts:17)</span></div>
                <div><span style={{ color: '#374151' }}>at </span><span style={{ color: '#6b7280' }}>KArena.dispatch</span><span style={{ color: '#4b5563' }}> (arena.ts:99)</span></div>
              </div>
            </div>

            {/* Action */}
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 18px',
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22c55e',
              fontSize: 11, letterSpacing: '0.1em', fontFamily: 'IBM Plex Mono, monospace',
              textDecoration: 'none', borderRadius: 4,
              transition: 'all 0.15s',
            }}>
              <span>$</span>
              <span>cd ~</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
