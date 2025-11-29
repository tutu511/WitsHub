// 此檔案在客戶端執行的
"use client";

// 引入 React 的 useState Hook，用來管理元件的本地狀態
import { useState } from "react";
// 引入 Next.js 的 useRouter（新的 app router 版本）以做程式化導向
import { useRouter } from "next/navigation";
// 發送按鈕的 icon
import { SendHorizontal, Sparkles, Ban } from "lucide-react";
// 用來操作歷史（新增/查詢）
import { useHistory } from "./context/historyContext";
// 引入類型（或介面）Message，用來定義訊息資料結構
import { Message } from "@/lib/chatHistory";
import { apiService } from "@/lib/api";
// 多語系
import { useI18n } from "@/components/i18n-provider";
// 語音轉文字
import VoiceTransformText from "@/components/voiceTransformText";

// 匯出預設元件：NewChatPage
export default function NewChatPage() {
    // 多語系，自動對應
    const { t } = useI18n();
    // input 狀態：儲存 textarea 輸入框的內容（預設為空字串）
    const [input, setInput] = useState("");
    // 註音打字的回車
    const [isComposing, setIsComposing] = useState(false);
    // 語音是否正在識別
    const [isListening, setIsListening] = useState(false);
    // 取得 router 實例，用於導頁（導航）
    const router = useRouter();
    // 從 history context 取得 addHistory 函式，用來新增歷史對話
    const { addHistory, renameHistory, clearTitleLoading } = useHistory();

    // 當使用者按下發送時執行的處理函式
    const handleSend = () => {
        // 先去除前後空白
        const trimmed = input.trim();
        // 如果輸入框內容為空，直接終止
        if (!trimmed) return;

        /**
         *  建立一個初始的 messages 陣列，符合 Message 型別（lib/chatHistory）
         *  user 的訊息：使用者輸入的內容
         *  robot（系統/機器人）的訊息：機器人回覆的信息
         */
        const messages: Message[] = [
            { role: "user", content: trimmed },
            { role: "robot", content: "" },
        ];

        // 先呼叫生成標題 API，完成後再更新到歷史紀錄（失敗時使用原問題當標題）
        const titlePromise = apiService.fetchChatTitle(trimmed);

        // 新增一筆歷史紀錄，並取得 chatId
        const chatId = addHistory(messages, { isTitlePending: true });

        titlePromise
            .then(({ title, success }) => {
                if (success) {
                    renameHistory(chatId, title);
                }
            })
            .catch((err) => console.error("rename title error:", err))
            .finally(() => clearTitleLoading(chatId));

        // 拿著剛剛新增的歷史紀錄，跳轉到對應的歷史對話頁面
        router.push(`/dashboard/history/${chatId}`);
    };

    return (
        <div className="flex h-full flex-col items-center justify-center text-white">
            {/*標題*/}
            <div className="text-center space-y-6 mb-8">
                <p className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs tracking-[0.4em] uppercase bg-white/5 border border-white/20 text-slate-200">
                    <Sparkles size={14} /> All in AI
                </p>
                <h2 className="text-4xl font-light">向 WitsHub 提問，讓多領域 AI 專家為你協作解答</h2>
            </div>

            <div className="w-full max-w-3xl">
                <div >
                    <div className="mt-2 flex gap-2">
                        {/* 語音轉文字按鈕 */}
                        <VoiceTransformText
                            onResult={
                                (voiceText) => {
                                    setInput((prev) => prev + voiceText)
                                }}
                            onListeningChange={
                                (isListening) => {
                                    // 語音是否正在識別中，若為 true ，發送按鈕事件需禁止
                                    setIsListening(isListening)
                                }
                            }
                        />
                        {/*輸入框*/}
                        <input
                            value={input}
                            onChange={e =>
                                // 使用者輸入時更新 state【e.target.value：輸入的文字內容】
                                setInput(e.target.value)
                            }
                            onCompositionStart={() => setIsComposing(true)}
                            onCompositionEnd={() => setIsComposing(false)}
                            onKeyDown={e => {
                                const composing =
                                    isComposing ||
                                    e.nativeEvent.isComposing ||
                                    e.keyCode === 229;
                                // 判斷是否按下 Enter  && 沒有按住 Shift【Shift+Enter 通常是換行】&& 注音輸入完畢
                                if (e.key === "Enter" && !composing && !e.shiftKey) {
                                    // 防止 textarea 預設換行行為
                                    e.preventDefault();
                                    // 直接執行送出功能
                                    handleSend();
                                }
                            }}
                            // 提示文字
                            placeholder={
                                isListening
                                    ? t("chat.placeholder.disabled")
                                    : t("chat.placeholder")
                            }
                            className="flex-1 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-colors"
                            disabled={isListening}
                        />
                        {/*發送按鈕*/}
                        <button
                            // 點擊時觸發發送事件
                            onClick={handleSend}
                            className="px-6 py-2 rounded-xl text-sm flex items-center justify-center border border-white/30 text-white transition bg-white/20 hover:bg-white/30 disabled:opacity-50"
                            // 輸入內容不能為空，語音不能正在識別中
                            disabled={!input.trim() || isListening}
                        >
                            { isListening
                                // 錄音中 → 顯示禁止 icon
                                ? <Ban size={20} />
                                // 平常 → 顯示發送 icon
                                : <SendHorizontal size={20} />
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
