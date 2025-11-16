"use client";

// 匯入 React 的基本 Hook
import { useState, useRef, useEffect } from "react";
// useParams 用來取得動態路由參數
import { useParams } from "next/navigation";
// 匯入圖示
import { User, Bot, SendHorizontal, Pause } from "lucide-react";
// 匯入 chatHistory 方法與型別
import { getChatById, saveHistory, Message } from "@/lib/chatHistory";
// 匯入自訂的歷史紀錄 context
import { useHistory } from "../../context/historyContext";
// 多語系
import { useI18n } from "@/components/i18n-provider";

// 定義 ChatPage 元件
export default function ChatPage() {
    // 多語系，自動對應
    const { t } = useI18n();
    // 取得動態路由參數 chatId，歷史紀錄中對應的 id
    const { chatId } = useParams();
    // 取得刷新歷史列表的方法
    const { refreshHistory } = useHistory();

    // 狀態：訊息列表
    const [messages, setMessages] = useState<Message[]>([]);
    // 狀態：輸入框文字
    const [input, setInput] = useState("");
    // 狀態：機器人是否正在「打字」
    const [isTyping, setIsTyping] = useState(false);

    /**
     * 打字機效果，用於保存 setInterval ID，以便停止打字時清除 interval
     *
     * useRef 是 React 的 Hook，用來儲存「可變的值」，不會觸發重新渲染
     * typingInterval.current 的型別是 NodeJS.Timeout | null：
     *   NodeJS.Timeout：Node.js 環境下 setInterval() 回傳的型別
     *   null：還沒設定 interval 時的初始值
     */
    const typingInterval = useRef<NodeJS.Timeout | null>(null);
    // ref：指向訊息列表最底部的 <div>，用來實現自動滾動到底部
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    // 滾動到訊息最底部
    const scrollToBottom = () => {
        if ("scrollIntoView" in messagesEndRef.current) {
            // 執行原生 DOM API 滾動，使用平滑滾動動畫
            messagesEndRef.current.scrollIntoView({
                behavior: "smooth"
            } as ScrollIntoViewOptions)
        }
    };

    // 當 messages 每次更新時，執行 scrollToBottom 自動滾動到底部
    useEffect(() => { scrollToBottom(); }, [messages]);

    /**
     * 打字機效果，模擬 robot 一個字一個字輸出
     * text: 機器人要輸出的完整文字
     * indexToUpdate: 要更新的訊息 index（通常是最後一筆 robot）
     * chatIdToSave: 要儲存的 chatId
     */
    const typeWriter = (text: string, indexToUpdate: number, chatIdToSave: string) => {
        // return Promise 在打字完成後可 await
        return new Promise<void>((resolve) => {
            // 先清除舊的 interval
            if (typingInterval.current != null) {
                clearInterval(typingInterval.current!);
                // 設為 null
                typingInterval.current = null;
            }
            // 目前（機器人回覆）輸出的文字位置 index
            let i = 0;
            // 啟動 interval，每 40ms 輸出一個字
            typingInterval.current = setInterval(() => {
                // 文字位置：每次增加 1
                i++;

                // 更新畫面上的 messages
                setMessages(prev => {
                    // 複製 messages 陣列（避免直接修改）
                    const newList = [...prev];
                    // 找到要更新的那筆 robot 訊息
                    const msg = newList[indexToUpdate];
                    // 將內容更新成前 i 個字，模擬一個一個字出現的效果
                    newList[indexToUpdate] = { ...msg, content: text.slice(0, i) };

                    // 當字全部輸出完後，儲存最新的聊天記錄
                    if (i === text.length) {
                        // 存入 localStorage
                        saveHistory(newList, chatIdToSave);
                    }

                    // 回傳新 messages
                    return newList;
                });

                // 若已輸出全部文字
                if (i >= text.length) {
                    // 清除 interval
                    if (typingInterval.current != null) {
                        clearInterval(typingInterval.current!);
                        // 設為 null
                        typingInterval.current = null;
                    }
                    // 結束 Promise
                    resolve();
                }
            }, 40);
        });
    };

    // 停止打字效果（使用者按停止按鈕 or 輸入完畢）
    const stopTyping = () => {
        // 停止計時器
        if (typingInterval.current != null) {
            clearInterval(typingInterval.current!);
            typingInterval.current = null;
        }
        // 設定 robot 不再打字
        setIsTyping(false);
    };

    // 初始化：載入此 chatId 的歷史聊天紀錄, deps: chatId 改變重新載入
    useEffect(() => {
        // 若沒有 chatId，直接跳出
        if (!chatId) return;
        // 從 localStorage 取資料
        const chat = getChatById(chatId);
        // 沒資料就不用載入
        if (!chat) return;

        // 載入歷史訊息到畫面
        setMessages(chat.messages);

        // 取得最後一筆訊息
        const lastMsg = chat.messages[chat.messages.length - 1];
        // 若最後一筆是 robot 且 content 還是空字串 → 表示之前打字還沒完成 or 代表這是新創建的對話
        if (lastMsg?.role === "robot" && lastMsg.content === "") {
            // 找到 user 的訊息
            const userMsg = chat.messages[chat.messages.length - 2];
            if (userMsg) {
                // robot 開始打字，代表要開始回覆了
                setIsTyping(true);
                // 機器人回覆的接口：要輸出的文字（先簡單模擬，之後要改成傳接 api）
                const botReply = `你剛剛說的是 "${userMsg.content}"`;
                // 開始打字
                if (!Array.isArray(chatId)) {
                    typeWriter(botReply, chat.messages.length - 1, chatId).then(() => {
                        // 設定為「停止打字」
                        setIsTyping(false);
                    });
                }
            }
        }
    }, [chatId]);

    // sendMessage：當 user 點擊送出或按下 Enter 時執行
    const sendMessage = () => {
        // 若輸入空白或正在打字則忽略
        if (!input.trim() || !chatId || isTyping) return;

        // 去除前後空白
        const userInput = input.trim();
        // 送出後，可清空輸入框
        setInput("");

        // 新增 user 訊息 + 空白 robot 訊息
        setMessages(prev => {
            // 新增 user 訊息
            const newList: Message[] = [
                ...prev,
                { role: "user", content: userInput },
                { role: "robot", content: "" }
            ];
            // 儲存聊天紀錄
            if (!Array.isArray(chatId)) {
                saveHistory(newList, chatId);
            }

            // 啟動打字效果，正在打字
            setIsTyping(true);
            // 要輸出的機器人文字
            const botReply = `你剛剛說的是 "${userInput}"`;
            // 開始打字機效果
            if (!Array.isArray(chatId)) {
                typeWriter(botReply, newList.length - 1, chatId).then(() => {
                    // 設定為「停止打字」
                    setIsTyping(false);
                })

            }


            // 更新畫面
            return newList;
        });
    };

    return (
        // 外層容器：垂直排列，填滿高度
        <div className="flex flex-col h-full">
            {/* 訊息列表區塊 */}
            <div className="flex-1 overflow-y-auto space-y-6 p-4 bg-gray-100 rounded-xl">
                {/* 將 messages 每一筆渲染成聊天泡泡 */}
                {messages.map((m, i) => {
                    const isUser = m.role === "user";
                    return (
                        <div key={i} className={`flex items-start gap-3 ${isUser 
                            ? "flex-row-reverse" 
                            : ""}`}>
                            {/* 頭像區 */}
                            <div className="p-2 bg-gray-300 rounded-full">
                                {isUser ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            {/* 訊息內容泡泡 */}
                            <div className={`p-3 rounded-xl shadow-sm text-sm whitespace-pre-line break-words ${isUser 
                                ? "bg-blue-500 text-white" 
                                : "bg-white text-gray-800"}`
                            } style={{ maxWidth: "66%" }}>
                                {m.content}
                            </div>
                        </div>
                    );
                })}
                {/* 最底部的 ref，用於自動滾動 */}
                <div ref={messagesEndRef} />
            </div>

            {/* 下方輸入框 + 送出按鈕 */}
            <div className="mt-4 flex gap-2">
                <input
                    // 輸入框的值
                    value={input}
                    // 更新 input state
                    onChange={e => setInput(e.target.value)}
                    // 按 Enter 送出
                    onKeyDown={e => e.key === "Enter" && !isTyping && sendMessage()}
                    // 提示文字
                    placeholder={t("chat.placeholder")}
                    className="flex-1 border border-blue-300 focus:ring-2 focus:ring-blue-300 focus:outline-none rounded-xl px-4 py-2 text-sm transition"
                />
                {/* 送出 / 停止按鈕 */}
                <button
                    onClick={isTyping ? stopTyping : sendMessage}
                    className={`px-4 py-2 rounded-xl text-sm flex items-center justify-center transition
                        ${isTyping 
                        ? "bg-red-500 text-white" 
                        : "bg-blue-500 text-white hover:bg-blue-600"}`}
                >
                    {isTyping
                        ? <Pause size={20} />
                        : <SendHorizontal size={20} />}
                </button>
            </div>
        </div>
    );
}
