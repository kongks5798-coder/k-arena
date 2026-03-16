import Navbar from "@/src/components/Navbar";
import { Settings, Moon, Globe, Wallet, LogOut } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#0a0e27] text-white">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
          <Settings className="w-7 h-7 text-k-teal" />
          <span className="text-k-teal">설정</span>
        </h1>
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Moon className="w-5 h-5 text-k-teal" /> 화면</h2>
            {[{ l: "테마", v: "다크 모드" }, { l: "언어", v: "한국어" }, { l: "시간대", v: "UTC+9 (KST)" }].map(r => (
              <div key={r.l} className="flex justify-between items-center text-sm border-b border-k-teal/10 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-400">{r.l}</span>
                <span className="text-white font-medium bg-k-darker/50 border border-k-teal/20 px-3 py-1 rounded-lg">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Globe className="w-5 h-5 text-k-teal" /> 지역 설정</h2>
            {[{ l: "통화", v: "KRW (₩)" }, { l: "숫자 형식", v: "1,000,000" }, { l: "날짜 형식", v: "YYYY.MM.DD" }].map(r => (
              <div key={r.l} className="flex justify-between items-center text-sm border-b border-k-teal/10 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-400">{r.l}</span>
                <span className="text-white font-medium">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Wallet className="w-5 h-5 text-k-teal" /> 거래 설정</h2>
            {[{ l: "기본 거래 방식", v: "시장가" }, { l: "수수료 표시", v: "활성화됨" }, { l: "주문 확인", v: "항상 확인" }].map(r => (
              <div key={r.l} className="flex justify-between items-center text-sm border-b border-k-teal/10 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-400">{r.l}</span>
                <span className="text-white font-medium">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 className="font-bold text-lg text-k-danger flex items-center gap-2 mb-4"><LogOut className="w-5 h-5" /> 위험 영역</h2>
            <div className="space-y-3">
              <button className="w-full border border-k-danger/30 text-k-danger py-3 rounded-xl hover:bg-k-danger/10 active:scale-95 transition-all font-medium">
                로그아웃
              </button>
              <button className="w-full border border-red-900/30 text-red-900 py-3 rounded-xl hover:bg-red-900/10 active:scale-95 transition-all font-medium text-sm">
                계정 삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
