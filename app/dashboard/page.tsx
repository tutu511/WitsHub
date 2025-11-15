"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal } from "lucide-react";
import { useHistory } from "./context/historyContext";
import { Message } from "@/lib/chatHistory";

export default function NewChatPage() {
    const [input, setInput] = useState("");
    const router = useRouter();
    const { addHistory } = useHistory();

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const messages: Message[] = [
            { role: "user", content: trimmed },
            { role: "assistant", content: "" },
        ];

        // 新增歷史並取得 chatId
        const chatId = addHistory(messages);

        // 跳轉到歷史對話頁面
        router.push(`/dashboard/history/${chatId}`);
    };

    return (
        <div className="flex flex-col h-full justify-center items-center w-full">
            {/* 標題 */}
            <h2 className="text-lg font-semibold mb-2 text-gray-700">問問我，我可不會咬人 😎</h2>

            <div className="relative w-full max-w-md mb-4">
    <textarea
        value={input}
        onChange={e => {
            setInput(e.target.value);
            // 自動調整高度
            const target = e.target;
            target.style.height = "auto"; // 重置高度
            const maxHeight = 6 * 24; // 6 行高度，假設行高 24px
            target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
        }}
        onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        }}
        placeholder="請輸入您的問題"
        rows={1}
        className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm resize-none
                 overflow-y-auto max-h-[144px] focus:outline-none focus:ring-2 focus:ring-blue-300
                 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent transition relative z-10"
        style={{ lineHeight: "24px" }}
    />

            </div>

            <button
                onClick={handleSend}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
            >
                <SendHorizontal size={20} />
                發送
            </button>
        </div>
    );
}
