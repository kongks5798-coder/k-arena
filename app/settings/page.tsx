'use client'
import { Topbar } from '@/components/Topbar'
import { Sidebar } from '@/components/Sidebar'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen bg-black text-gray-100 overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-5">

          <div>
            <div className="text-[9px] text-gray-600 font-mono tracking-widest mb-1">// account</div>
            <h1 className="text-base font-bold font-mono text-white tracking-widest">SETTINGS</h1>
          </div>

          {/* Display */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Display</div>
            {[{ l: 'Theme', v: 'Dark' }, { l: 'Language', v: 'English' }, { l: 'Timezone', v: 'UTC+9 (KST)' }].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-gray-800/40 last:border-0 text-[11px] font-mono">
                <span className="text-gray-500">{r.l}</span>
                <span className="text-white bg-gray-800 px-2 py-0.5 rounded border border-gray-700">{r.v}</span>
              </div>
            ))}
          </div>

          {/* Regional */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Regional</div>
            {[{ l: 'Currency', v: 'USD ($)' }, { l: 'Number Format', v: '1,000,000' }, { l: 'Date Format', v: 'YYYY-MM-DD' }].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-gray-800/40 last:border-0 text-[11px] font-mono">
                <span className="text-gray-500">{r.l}</span>
                <span className="text-white">{r.v}</span>
              </div>
            ))}
          </div>

          {/* Trading */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">Trading</div>
            {[{ l: 'Default Order', v: 'Market' }, { l: 'Fee Display', v: 'Enabled' }, { l: 'Confirm Orders', v: 'Always' }].map(r => (
              <div key={r.l} className="flex justify-between py-2 border-b border-gray-800/40 last:border-0 text-[11px] font-mono">
                <span className="text-gray-500">{r.l}</span>
                <span className="text-white">{r.v}</span>
              </div>
            ))}
          </div>

          {/* API */}
          <div className="border border-gray-800 bg-gray-900/40 rounded p-4">
            <div className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mb-3">API Access</div>
            <div className="text-[10px] text-gray-400 font-mono mb-3">
              Manage your API keys for programmatic access to K-Arena.
            </div>
            <Link href="/api-dashboard"
              className="inline-block py-2 px-4 text-[10px] font-mono rounded border border-green-700/40 text-green-400 hover:bg-green-900/20 transition">
              Manage API Keys →
            </Link>
          </div>

          {/* Danger zone */}
          <div className="border border-red-900/30 bg-red-900/5 rounded p-4">
            <div className="text-[9px] text-red-400 font-mono uppercase tracking-widest mb-3">Danger Zone</div>
            <div className="flex gap-3">
              <button className="py-2 px-4 text-[10px] font-mono rounded border border-red-800/40 text-red-400 hover:bg-red-900/20 transition">
                Logout
              </button>
              <button className="py-2 px-4 text-[10px] font-mono rounded border border-red-900/20 text-red-900/60 hover:border-red-900/40 hover:text-red-800 transition">
                Delete Account
              </button>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
