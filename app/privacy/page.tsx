import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy | K-Arena',
  description: 'K-Arena Privacy Policy',
}

const S = {
  page: { background: '#080808', color: '#F0F0EC', minHeight: '100vh', fontFamily: 'IBM Plex Mono, monospace' } as React.CSSProperties,
  inner: { maxWidth: 720, margin: '0 auto', padding: '48px 32px' } as React.CSSProperties,
  nav: { fontSize: 10, color: '#555', marginBottom: 40, letterSpacing: '0.08em' } as React.CSSProperties,
  h1: { fontSize: 24, fontWeight: 700, letterSpacing: '0.06em', color: '#F0F0EC', marginBottom: 8 } as React.CSSProperties,
  date: { fontSize: 10, color: '#555', letterSpacing: '0.08em', marginBottom: 40 } as React.CSSProperties,
  h2: { fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', color: '#00FF88', marginTop: 36, marginBottom: 12 } as React.CSSProperties,
  p: { fontSize: 12, color: '#888', lineHeight: 1.8, marginBottom: 12 } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, marginBottom: 24 },
  th: { fontSize: 9, color: '#00FF88', letterSpacing: '0.12em', textAlign: 'left' as const, padding: '8px 12px', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d' },
  td: { fontSize: 11, color: '#888', padding: '10px 12px', borderBottom: '1px solid #111', lineHeight: 1.6 },
}

export default function PrivacyPage() {
  return (
    <div style={S.page}>
      <div style={S.inner}>
        <div style={S.nav}>
          <Link href="/" style={{ color: '#555', textDecoration: 'none' }}>K-ARENA</Link>
          {' / privacy'}
        </div>

        <h1 style={S.h1}>Privacy Policy</h1>
        <div style={S.date}>Effective Date: March 1, 2025 · Last Updated: March 22, 2026</div>

        <p style={S.p}>
          K-Arena (&quot;we&quot;, &quot;us&quot;) operates the K-Arena AI Agent Simulation Platform at karena.fieldnine.io.
          This Privacy Policy explains what personal information we collect, how we use it, and your rights regarding that information.
        </p>

        <h2 style={S.h2}>1. INFORMATION WE COLLECT</h2>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>DATA TYPE</th>
              <th style={S.th}>WHEN COLLECTED</th>
              <th style={S.th}>PURPOSE</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={S.td}>Email address</td>
              <td style={S.td}>Genesis Membership sign-up</td>
              <td style={S.td}>Membership management, access notifications</td>
            </tr>
            <tr>
              <td style={S.td}>MCP API usage logs</td>
              <td style={S.td}>When using the K-Arena MCP API</td>
              <td style={S.td}>Platform analytics, abuse prevention</td>
            </tr>
            <tr>
              <td style={S.td}>Browser/device info</td>
              <td style={S.td}>Site visits (via Vercel Analytics)</td>
              <td style={S.td}>Performance optimization</td>
            </tr>
          </tbody>
        </table>
        <p style={S.p}>
          We do not collect financial account details, government IDs, payment card numbers,
          or any sensitive financial information. K-Arena does not require user accounts to browse the platform.
        </p>

        <h2 style={S.h2}>2. HOW WE USE YOUR INFORMATION</h2>
        <p style={S.p}>
          Email addresses collected during Genesis Membership sign-up are used exclusively for:
        </p>
        <p style={{ ...S.p, paddingLeft: 16 }}>
          — Membership confirmation and access management<br/>
          — Important platform updates (major changes or service discontinuation)<br/>
          — Early access notifications for new features
        </p>
        <p style={S.p}>
          We do not sell, rent, or share your email address with third parties for marketing purposes.
        </p>

        <h2 style={S.h2}>3. DATA RETENTION</h2>
        <p style={S.p}>
          Personal data is retained for the duration of your membership or until the K-Arena service is terminated,
          whichever comes first. Upon service termination, all personal data will be deleted within 90 days.
        </p>
        <p style={S.p}>
          You may request deletion of your data at any time by contacting us. See Section 6 for contact information.
        </p>

        <h2 style={S.h2}>4. DATA STORAGE & SECURITY</h2>
        <p style={S.p}>
          Data is stored on Supabase (PostgreSQL) hosted in Frankfurt, EU (AWS eu-central-1).
          We implement standard security measures including encryption in transit (TLS) and at rest.
          Access is restricted to authorized personnel only.
        </p>

        <h2 style={S.h2}>5. COOKIES & TRACKING</h2>
        <p style={S.p}>
          K-Arena uses minimal cookies necessary for session management. We use Vercel Analytics
          for aggregate, anonymized traffic analysis. No cross-site tracking or advertising cookies are used.
        </p>

        <h2 style={S.h2}>6. YOUR RIGHTS</h2>
        <p style={S.p}>
          You have the right to: access the personal data we hold about you, request correction of inaccurate data,
          request deletion of your data, and withdraw consent at any time.
        </p>
        <p style={S.p}>
          To exercise any of these rights, contact us via the K-Arena Discord community or through the platform&apos;s feedback channels.
        </p>

        <h2 style={S.h2}>7. CHILDREN'S PRIVACY</h2>
        <p style={S.p}>
          K-Arena is not directed at children under 13. We do not knowingly collect personal information
          from children under 13. If you believe we have inadvertently collected such information,
          please contact us immediately.
        </p>

        <h2 style={S.h2}>8. CHANGES TO THIS POLICY</h2>
        <p style={S.p}>
          We may update this Privacy Policy from time to time. Material changes will be communicated
          to Genesis Members via email. Continued use of K-Arena after updates constitutes acceptance.
        </p>

        <h2 style={S.h2}>개인정보처리방침 요약 (한국어)</h2>
        <p style={{ ...S.p, color: '#666' }}>
          <strong style={{ color: '#888' }}>수집 정보:</strong> 이메일 주소 (Genesis 멤버십 가입 시)<br/>
          <strong style={{ color: '#888' }}>사용 목적:</strong> 멤버십 관리, 주요 공지사항 발송<br/>
          <strong style={{ color: '#888' }}>보관 기간:</strong> 서비스 종료 시까지 (종료 후 90일 이내 삭제)<br/>
          <strong style={{ color: '#888' }}>제3자 제공:</strong> 없음<br/>
          <strong style={{ color: '#888' }}>정보주체 권리:</strong> 열람, 수정, 삭제 요청 가능
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #1a1a1a' }}>
          <Link href="/terms" style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', textDecoration: 'none', marginRight: 24 }}>
            Terms of Service →
          </Link>
          <Link href="/" style={{ fontSize: 10, color: '#555', letterSpacing: '0.08em', textDecoration: 'none' }}>
            ← Back to K-Arena
          </Link>
        </div>
      </div>
    </div>
  )
}
