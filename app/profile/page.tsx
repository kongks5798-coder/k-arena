import Navbar from "@/src/components/Navbar";
import { User, Mail, Shield, Bell } from "lucide-react";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#0a0e27] text-white">
      <Navbar />
      <div className="pt-24 pb-20 px-4 max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-8">
          <span className="text-k-teal">프로필</span>
        </h1>
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-k-teal/20 border-2 border-k-teal/40 flex items-center justify-center">
                <User className="w-8 h-8 text-k-teal" />
              </div>
              <div>
                <p className="font-bold text-xl">K-Arena User</p>
                <p className="text-gray-400 text-sm">user@k-arena.gg</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[{ v: "42", l: "거래 횟수" }, { v: "Silver", l: "등급" }, { v: "₩3.2M", l: "누적 거래" }].map(s => (
                <div key={s.l} className="bg-k-darker/50 rounded-lg p-3 border border-k-teal/10">
                  <p className="text-k-teal font-black text-lg">{s.v}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card space-y-4">
            <h2 className="font-bold text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-k-teal" /> 계정 정보</h2>
            {[{ l: "이메일", v: "user@k-arena.gg" }, { l: "가입일", v: "2026.01.15" }, { l: "인증 상태", v: "✅ 인증 완료" }].map(r => (
              <div key={r.l} className="flex justify-between text-sm border-b border-k-teal/10 pb-3 last:border-0 last:pb-0">
                <span className="text-gray-400">{r.l}</span>
                <span className="text-white font-medium">{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2"><Shield className="w-5 h-5 text-k-teal" /> 보안</h2>
            <div className="flex justify-between items-center">
              <div><p className="font-medium">2단계 인증 (2FA)</p><p className="text-gray-400 text-xs mt-0.5">계정 보안 강화</p></div>
              <span className="text-xs bg-k-teal/20 text-k-teal px-3 py-1 rounded-full font-medium">활성화됨</span>
            </div>
            <div className="flex justify-between items-center">
              <div><p className="font-medium">비밀번호 변경</p><p className="text-gray-400 text-xs mt-0.5">마지막 변경: 30일 전</p></div>
              <button className="text-xs border border-k-teal/30 text-k-teal px-3 py-1 rounded-full hover:bg-k-teal/10 transition-colors">변경</button>
            </div>
          </div>
          <div className="card space-y-3">
            <h2 className="font-bold text-lg flex items-center gap-2"><Bell className="w-5 h-5 text-k-teal" /> 알림 설정</h2>
            {[{ l: "거래 체결 알림", on: true }, { l: "가격 알림", on: true }, { l: "마케팅 이메일", on: false }].map(n => (
              <div key={n.l} className="flex justify-between items-center">
                <p className="text-sm">{n.l}</p>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${n.on ? "bg-k-success/20 text-k-success" : "bg-gray-700 text-gray-400"}`}>
                  {n.on ? "켜짐" : "꺼짐"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
