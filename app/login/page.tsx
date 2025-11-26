"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, saveUser } from "@/lib/user";

// Demo 帳號密碼配置
const DEMO_ACCOUNTS : User[] = [
  { username: "TP2509034", password: "zaq12wsx", email:"CindyYang1@wits.com", personName: "王芸若"},
  { username: "abc", password: "123", email:"CindyYang2@wits.com", personName: "測試者1"},
  { username: "def", password: "456", email:"CindyYang3@wits.com", personName: "測試者2"},
  { username: "TP2412020", password: "zaq12wsx", email:"KelseyLin@wits.com", personName: "林采薇"}
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const account = DEMO_ACCOUNTS.find(
        (acc) => acc.username === username && acc.password === password
    );

    if (account) {
      // 將用戶信息保存到 localstorage
      saveUser(account);
      router.push("/dashboard");
    }
    else {
      setError("帳號或密碼錯誤");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* 🌫 柔光流動背景 */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="aurora aurora1" />
        <div className="aurora aurora2" />
        <div className="aurora aurora3" />
        <div className="aurora aurora4" />
      </div>

      {/* 中央登入框 */}
      <div className="relative z-10 w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.06)] p-10 space-y-8 ring-1 ring-white/10">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-light text-white tracking-wide">
              WitsHub
            </h1>
            <p className="text-slate-300 text-sm tracking-wide">
              All in AI. All in One.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-slate-200 text-sm">
                帳號
              </label>
              <input
                id="username"
                type="text"
                placeholder="請輸入帳號"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300/40"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-slate-200 text-sm">
                密碼
              </label>
              <input
                id="password"
                type="password"
                placeholder="請輸入密碼"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300/40"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-400/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 font-semibold rounded-xl text-white bg-white/10 border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.12)] hover:bg-white/15 hover:shadow-[0_0_25px_rgba(255,255,255,0.18)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? "登入中..." : "登入"}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
  .aurora {
    position: absolute;
    width: 55%;
    height: 55%;
    filter: blur(100px);      /* ⭐ blur 改小才能看到動態 */
    opacity: 0.35;            /* ⭐ 更明顯 */
    animation: auroraMove 8s ease-in-out infinite;
    border-radius: 50%;
    mix-blend-mode: screen;
  }

  /* 每個 Aurora 各自顏色 + 初始位置 */
  .aurora1 {
    background: #4ea8ff;
    top: -15%;
    left: -10%;
  }
  .aurora2 {
    background: #a855f7;
    top: 25%;
    right: -10%;
    animation-delay: -4s;
  }
  .aurora3 {
    background: #38bdf8;
    bottom: -15%;
    left: 30%;
    animation-delay: -8s;
  }
  .aurora4 {
    background: #6366f1;
    bottom: -10%;
    right: 15%;
    animation-delay: -12s;
  }

  @keyframes auroraMove {
    0% {
      transform: translate(0, 0) scale(1);
    }
    50% {
      transform: translate(120px, -180px) scale(1.4); /* ⭐ 真正會動 */
    }
    100% {
      transform: translate(0, 0) scale(1);
    }
  }
`}</style>
    </div>
  );
}
