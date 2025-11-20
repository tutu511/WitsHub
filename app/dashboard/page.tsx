// 此檔案在客戶端執行的
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SendHorizontal, Sparkles } from "lucide-react";
import { useHistory } from "./context/historyContext";
import { Message } from "@/lib/chatHistory";
import { useI18n } from "@/components/i18n-provider";

export default function NewChatPage() {
    const { t } = useI18n();
    const [input, setInput] = useState("");
    const [isComposing, setIsComposing] = useState(false);
    const router = useRouter();
    const { addHistory } = useHistory();

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const messages: Message[] = [
            { role: "user", content: trimmed },
            { role: "robot", content: "" },
        ];

        const chatId = addHistory(messages);
        router.push(`/dashboard/history/${chatId}`);
    };

    return (
        <div className="flex h-full flex-col items-center justify-center text-white">
            <div className="text-center space-y-6 mb-8">
                <p className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs tracking-[0.4em] uppercase bg-white/5 border border-white/20 text-slate-200">
                    <Sparkles size={14} /> All in AI
                </p>
                <h2 className="text-4xl font-light">向 WitsHub 提問，讓多領域 AI 專家為你協作解答</h2>
            </div>

            <div className="w-full max-w-3xl">
                <div >
                    <div className="mt-2 flex gap-2">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            onKeyDown={e => {
                                const composing =
                                    isComposing ||
                                    e.nativeEvent.isComposing ||
                                    e.keyCode === 229;
                                if (e.key === "Enter" && !composing) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder={t("chat.placeholder")}
                            className="flex-1 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-colors"
                        />
                        <button
                            onClick={handleSend}
                            className="px-6 py-2 rounded-xl text-sm flex items-center justify-center border border-white/30 text-white transition bg-white/20 hover:bg-white/30 disabled:opacity-50"
                            disabled={!input.trim()}
                        >
                            <SendHorizontal size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
