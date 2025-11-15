"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { User, Bot, SendHorizontal, Pause } from "lucide-react";
import { getChatById, saveHistory, Message } from "@/lib/chatHistory";
import { useHistory } from "../../context/historyContext";

export default function ChatPage() {
    const { chatId } = useParams();
    const { refreshHistory } = useHistory();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const typingInterval = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // 滾動到底部
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(() => { scrollToBottom(); }, [messages]);

    // 打字機效果
    const typeWriter = (text: string, indexToUpdate: number, chatIdToSave: string) => {
        return new Promise<void>((resolve) => {
            let i = 0;
            typingInterval.current = setInterval(() => {
                i++;
                setMessages(prev => {
                    const newList = [...prev];
                    const msg = newList[indexToUpdate];
                    newList[indexToUpdate] = { ...msg, content: text.slice(0, i) };

                    // 每次更新最後一筆，等打完字才保存
                    if (i === text.length) {
                        saveHistory(newList, chatIdToSave);
                    }

                    return newList;
                });

                if (i >= text.length) {
                    if (typingInterval.current) clearInterval(typingInterval.current);
                    typingInterval.current = null;
                    setIsTyping(false);
                    refreshHistory();
                    resolve();
                }
            }, 40);
        });
    };

    // 停止打字
    const stopTyping = () => {
        if (typingInterval.current) clearInterval(typingInterval.current);
        typingInterval.current = null;
        setIsTyping(false);
    };

    // 初始化歷史訊息
    useEffect(() => {
        if (!chatId) return;
        const chat = getChatById(chatId);
        if (!chat) return;

        setMessages(chat.messages);

        // 如果最後一筆是空白 assistant → 立即回覆
        const lastMsg = chat.messages[chat.messages.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg.content === "") {
            const userMsg = chat.messages[chat.messages.length - 2];
            if (userMsg) {
                setIsTyping(true);
                const botReply = `你剛剛說的是 "${userMsg.content}"`;
                typeWriter(botReply, chat.messages.length - 1, chatId);
            }
        }
    }, [chatId]);

    // 發送訊息
    const sendMessage = () => {
        if (!input.trim() || !chatId || isTyping) return;

        const userInput = input.trim();
        setInput("");

        // 新增 user + 空白 assistant
        setMessages(prev => {
            const newList = [...prev, { role: "user", content: userInput }, { role: "assistant", content: "" }];
            saveHistory(newList, chatId);
            refreshHistory();

            // 打字機回覆
            setIsTyping(true);
            const botReply = `你剛剛說的是 "${userInput}"`;
            typeWriter(botReply, newList.length - 1, chatId);

            return newList;
        });
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6 p-4 bg-gray-100 rounded-xl">
                {messages.map((m, i) => {
                    const isUser = m.role === "user";
                    return (
                        <div key={i} className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                            <div className="p-2 bg-gray-300 rounded-full">
                                {isUser ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className={`p-3 rounded-xl shadow-sm text-sm whitespace-pre-line break-words ${isUser ? "bg-blue-500 text-white" : "bg-white text-gray-800"}`} style={{ maxWidth: "66%" }}>
                                {m.content}
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="mt-4 flex gap-2">
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !isTyping && sendMessage()}
                    placeholder="請輸入您的問題"
                    className="flex-1 border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:outline-none rounded-xl px-4 py-2 text-sm transition"
                />
                <button
                    onClick={isTyping ? stopTyping : sendMessage}
                    className={`px-4 py-2 rounded-xl text-sm flex items-center justify-center transition
                        ${isTyping ? "bg-red-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                >
                    {isTyping ? <Pause size={20} /> : <SendHorizontal size={20} />}
                </button>
            </div>
        </div>
    );
}
