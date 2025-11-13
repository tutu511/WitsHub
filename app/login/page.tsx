"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 假登入邏輯，稍後可以改成調 API
    if (username === "admin" && password === "1234") {
      // 登入成功導向 dashboard
      router.push("/dashboard");
    } else {
      alert("帳號或密碼錯誤");
    }
  };

  return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4">登入頁面</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3 w-64">
          <input
              type="text"
              placeholder="帳號"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border p-2 rounded"
          />
          <input
              type="password"
              placeholder="密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border p-2 rounded"
          />
          <button
              type="submit"
              className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600"
          >
            登入
          </button>
        </form>
      </div>
  );
}
