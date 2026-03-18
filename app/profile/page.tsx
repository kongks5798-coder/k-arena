'use client'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          <div>
            <div className="text-[9px] text-gray-600 font-mono tracking-widest mb-1">// account</div>
            <h1 className="text-base font-bold font-mono text-white tracking-widest">PROFILE</h1>
          </div>

          {/* User card */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-12 h-12 rounded border border-green-700/40 bg-green-900/10 flex items-center justify-center">
                <span className="text-green-400 font-mono font-bold text-lg">K</span>
              </div>
              <div>
                <div className="text-sm font-bold font-mono text-white">K-Arena User</div>
                <div className="text-[10px] text-gray-500 font-mono">user@k-arena.gg</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[{ v: '42', l: 'Trades' }, { v: 'SILVER', l: 'Tier' }, { v: '$3.2K', l: 'Volume' }].map(s => (
                <div key={s.l} className="border border-gray-800 rounded p-3 text-center">
                  <div className="text-sm font-bold font-mono text-green-400">{s.v}</div>
                  <div className="text-[9px] text-gray-500 font-mono mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Account info */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Account Info</div>
            {[{ l: 'Email', v: 'user@k-arena.gg' }, { l: 'Joined', v: '2026-01-15' }, { l: 'Status', v: '✅ Verified' }].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-gray-800/40 last:border-0 text-[11px] font-mono">
                <span className="text-gray-500">{r.l}</span>
                <span className="text-white">{r.v}</span>
              </div>
            ))}
          </div>

          {/* Security */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Security</div>
            <div className="flex items-center justify-between py-2 border-b border-gray-800/40 text-[11px] font-mono">
              <div>
                <div className="text-white">2FA</div>
                <div className="text-[9px] text-gray-500">Two-factor authentication</div>
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-800 rounded">ENABLED</span>
            </div>
            <div className="flex items-center justify-between py-2 text-[11px] font-mono">
              <div>
                <div className="text-white">Password</div>
                <div className="text-[9px] text-gray-500">Last changed 30 days ago</div>
              </div>
              <button className="text-[9px] text-gray-400 border border-gray-700 px-2 py-0.5 rounded hover:border-gray-500 hover:text-white transition">Change</button>
            </div>
          </div>

          {/* Notification prefs */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Notifications</div>
            {[{ l: 'Trade executed', on: true }, { l: 'Price alerts', on: true }, { l: 'Marketing emails', on: false }].map(n => (
              <div key={n.l} className="flex items-center justify-between py-2 border-b border-gray-800/40 last:border-0 text-[11px] font-mono">
                <span className="text-white">{n.l}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded border ${n.on ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-800/50 text-gray-500 border-gray-700'}`}>
                  {n.on ? 'ON' : 'OFF'}
                </span>
              </div>
            ))}
          </div>

          {/* Quick nav */}
          <div className="flex gap-2">
            <Link href="/agents" className="flex-1 text-center py-2.5 text-[10px] font-mono rounded border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition">My Agents</Link>
            <Link href="/settings" className="flex-1 text-center py-2.5 text-[10px] font-mono rounded border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition">Settings</Link>
            <Link href="/api-dashboard" className="flex-1 text-center py-2.5 text-[10px] font-mono rounded border border-green-700/40 text-green-400 hover:bg-green-900/20 transition">API Keys</Link>
          </div>

        </main>
      </div>
    </div>
  )
}
