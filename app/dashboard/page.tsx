// 此檔案在客戶端執行的
"use client";

// 引入 React 的 useState Hook，用來管理元件的本地狀態
import { useState } from "react";
// 引入 Next.js 的 useRouter（新的 app router 版本）以做程式化導向
import { useRouter } from "next/navigation";
// 發送按鈕的 icon
import { SendHorizontal } from "lucide-react";
// 用來操作歷史（新增/查詢）
import { useHistory } from "./context/historyContext";
// 引入類型（或介面）Message，用來定義訊息資料結構
import { Message } from "@/lib/chatHistory";
// 多語系
import { useI18n } from "@/components/i18n-provider";

// 匯出預設元件：NewChatPage
export default function NewChatPage() {
    // 多語系，自動對應
    const { t } = useI18n();
    // input 狀態：儲存 textarea 輸入框的內容（預設為空字串）
    const [input, setInput] = useState("");
    // 取得 router 實例，用於導頁（導航）
    const router = useRouter();
    // 從 history context 取得 addHistory 函式，用來新增歷史對話
    const { addHistory } = useHistory();

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

        // 新增一筆歷史紀錄，並取得 chatId
        const chatId = addHistory(messages);

        // 拿著剛剛新增的歷史紀錄，跳轉到對應的歷史對話頁面
        router.push(`/dashboard/history/${chatId}`);
    };

    return (
        <div className="flex flex-col h-full justify-center items-center w-full">
           {/*標題*/}
            <h2 className="text-lg font-semibold mb-2 text-gray-700">問問我，我可不會咬人 😎</h2>

            {/*輸入框*/}
            <div className="relative w-full max-w-md mb-4">
                <textarea
                    value={input}
                    onChange={e => {
                        // 使用者輸入時更新 state【e.target.value：輸入的文字內容】
                        setInput(e.target.value);
                        // 自動調整高度
                        const target = e.target;
                        // 設定文字區的高度：重置高度，讓 scrollHeight 量測正確
                        target.style.height = "auto";
                        // 簡單模擬：假設行高24px，設定6行高度
                        const maxHeight = 6 * 24;
                        // 將高度設成內容高度或最大高度中較小者【target.scrollHeight：自動高度量測】
                        target.style.height = `${Math.min(target.scrollHeight, maxHeight)}px`;
                    }}
                    onKeyDown={e => {
                        // 判斷是否按下 Enter 且沒有按住 Shift【Shift+Enter 通常是換行】
                        if (e.key === "Enter" && !e.shiftKey) {
                            // 防止 textarea 預設換行行為
                            e.preventDefault();
                            // 直接執行送出功能
                            handleSend();
                        }
                    }}
                    // 提示文字
                    placeholder={t("chat.placeholder")}
                    // 初始顯示為 1 行
                    rows={1}
                    /**
                     *  className 說明：
                     * - w-full, max-w-md: 寬度控制，視窗太大時會被 max-w-md 限制
                     * - border / rounded-xl: 邊框與圓角樣式
                     * - px-4 py-3: 內距（padding）
                     * - text-sm: 文字大小
                     * - resize-none: 禁止使用者拖曳改變大小（我們用程式控制高度）
                     * - overflow-y-auto / max-h-[144px]: 超過 max 高度時顯示滾動條（144px 約等於 6*24）
                     * - focus:ring-2 focus:ring-blue-300: focus 狀態的環狀效果（可存取性提示）
                     * - scrollbar-*: 自訂捲軸外觀（屬於 tailwind plugin）
                     * - transition: 平滑過渡（某些互動樣式會更順）
                     * - relative z-10: 確保在相對定位層級與其他元素的顯示次序
                     */
                    className="w-full border border-blue-300 rounded-xl px-4 py-3 text-sm resize-none
                      overflow-y-auto max-h-[144px] focus:outline-none focus:ring-2 focus:ring-blue-300
                      scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent transition relative z-10"
                    // 設定行高 line-height 為 24px
                    style={{ lineHeight: "24px" }}
                />
            </div>

            {/*發送按鈕*/}
            <button
                // 點擊時觸發發送事件
                onClick={handleSend}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition"
            >
                {/*發送 icon*/}
                <SendHorizontal size={20} />
                發送
            </button>
        </div>
    );
}
