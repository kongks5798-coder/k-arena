"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/");
      } else {
        setError(data.message || "로그인 실패");
      }
    } catch {
      setError("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0e27] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-k-teal">K-Arena</Link>
          <p className="text-gray-400 mt-2">계정에 로그인하세요</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 bg-k-darker/50 border border-k-teal/30 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-k-teal transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-k-darker/50 border border-k-teal/30 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-k-teal transition-colors"
                required
              />
            </div>
            {error && <p className="text-k-danger text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-k-teal text-black font-black py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
          <p className="text-center text-gray-400 text-sm mt-5">
            계정이 없으신가요?{" "}
            <Link href="/register" className="text-k-teal hover:underline">회원가입</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
