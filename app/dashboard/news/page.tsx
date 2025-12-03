"use client";

import { useEffect, useState } from "react";
import {apiService, digestText} from "@/lib/api";
// 語音轉文字
import VoiceTransformText from "@/components/voiceTransformText";
// icon
import {Ban, SendHorizontal, Link, Siren} from "lucide-react";
// 用來操作歷史（新增/查詢）
import {useHistory} from "@/app/dashboard/context/historyContext";
// 引入類型（或介面）Message，用來定義訊息資料結構
import { Message } from "@/lib/chatHistory";
import {useI18n} from "@/components/i18n-provider";
// 引入 Next.js 的 useRouter（新的 app router 版本）以做程式化導向
import { useRouter } from "next/navigation";

export default function NewsPage() {
    // 多語系，自動對應
    const { t, locale } = useI18n();
    // ai 新知內容(中英文)
    const [newsTW, setNewsTW] = useState<digestText[]>([]);
    const [newsEN, setNewsEN] = useState<digestText[]>([]);
    // ai 問題(中英文)
    const [questionsTW, setQuestionsTW] = useState<string[]>([]);
    const [questionsEN, setQuestionsEN] = useState<string[]>([]);
    // input 狀態：儲存 textarea 輸入框的內容（預設為空字串）
    const [input, setInput] = useState("");
    // 註音打字的回車
    const [isComposing, setIsComposing] = useState(false);
    // 語音是否正在識別
    const [isListening, setIsListening] = useState(false);
    // 加載中
    const [isLoading, setIsLoading] = useState(false);
    // 取得 router 實例，用於導頁（導航）
    const router = useRouter();
    // 從 history context 取得 addHistory 函式，用來新增歷史對話
    const { addHistory, renameHistory, clearTitleLoading } = useHistory();

    useEffect(() => {
        handleAINews();
    }, []);

    // 獲取 AI 新知（週報）
    async function handleAINews() {
        // 若已經開始了呼叫 api 了，就等呼叫完再 call
        if (isLoading) return
        // 加載開始
        setIsLoading(true);
        // 記錄開始時間
        const startTime = Date.now();
        // 呼叫 api
        const newsResponse = await apiService.fetchAINews();
        // 紀錄結束時間 - 開始時間
        const elapsed = Date.now() - startTime;
        if (newsResponse.digest_text_en.length > 0 && newsResponse.digest_text_tw.length > 0) {
            // 設置資料
            setNewsTW(newsResponse.digest_text_tw);
            setNewsEN(newsResponse.digest_text_en);
            setQuestionsTW(newsResponse.ai_questions_tw);
            setQuestionsEN(newsResponse.ai_questions_en);
            // 加載結束
            useMinimumLoading(elapsed)

        } else {
            // 加載結束
            useMinimumLoading(elapsed)
        }
    }

    function useMinimumLoading(elapsed: number) {
        if (elapsed > 400) {
            // 加載結束
            setIsLoading(false);
        } else {
            setTimeout(() => {
                setIsLoading(false);
            }, 400 - elapsed);
        }
    }

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
            { role: "user", content: trimmed, img: "" },
            { role: "robot", content: "", img: "" },
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
        <div className="flex flex-col text-white h-full">
            {/* --------- 可滾動主內容：只有這塊可滾動 --------- */}
            {/* 上方：新聞 + 公仔（唯一可滾動的區域） */}
            <div className="overflow-y-auto px-4 pt-5 flex gap-6 items-start max-h-[calc(100vh-310px)]">
                {/* 上方：新聞 */}
                <div className="flex-1 whitespace-pre-line text-base leading-relaxed">
                    <h2 className="text-2xl font-semibold text-white mb-8 text-center">
                        {t("news.subtitle")}
                    </h2>
                    {isLoading
                          ? <div className="w-full flex justify-center items-center h-24 ">
                            <span className="flex items-center gap-2 relative">
                                <span className="w-3 h-3 bg-white rounded-full animate-bounce"></span>
                                <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-3 h-3 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </span>
                          </div>
                          : (locale === "en" ? newsEN : newsTW).length > 0
                            ? (locale === "en" ? newsEN : newsTW).map((digestText, index) => (
                                <div key={index} className="mb-1">
                                    {/* 文字內容 */}
                                    <p className="line-clamp-2 leading-relaxed text-lg md:text-xl">
                                        {digestText.text}
                                    </p>

                                    {/* URL，灰色字體，可點擊打開新視窗 */}
                                    <div className="flex items-center gap-2 leading-relaxed mb-8 text-lg text-gray-400">
                                        <Link size={18} className="flex-shrink-0"/>
                                        <a
                                            href={digestText.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="line-clamp-1 text-gray-400 hover:underline"
                                        >
                                            {digestText.url}
                                        </a>
                                    </div>
                                </div>
                            ))
                            :
                            // 呼叫 api 失敗
                            <div
                                className="flex justify-center items-center gap-2 text-center text-gray-400 py-10 text-lg"
                                onClick={ handleAINews }
                            >
                                <Siren size={18} />
                                {t("common.refresh")}
                            </div>

                    }
                </div>

                {/* 公仔 */}
                <div className="w-60 shrink-0">
                    <img
                        src="/doll.png"
                        alt="ai bot"
                        className="w-full h-auto object-contain"
                    />
                </div>
            </div>

            {/* 底部的問題框 */}
            <div className="fixed left-0 right-0 bottom-[120px] px-10 flex justify-center pointer-events-none">
                <div className="w-full pointer-events-auto">
                    <div className="grid grid-cols-3 gap-4">
                        {!isLoading && (locale === "en" ? questionsEN : questionsTW).map((question, index) => (
                            <div
                                key={index}
                                onClick={() => setInput(question)}
                                className="p-4 border rounded-xl shadow-sm hover:shadow-md cursor-pointer transition overflow-hidden"
                                title={question}
                            >
                                <p className="font-semibold mb-1 line-clamp-2">{question}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            {/* 下方輸入框 + 送出按鈕 */}
            <div className="fixed bottom-0 left-0 right-0 w-full p-8 flex gap-2 mt-4">
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
    );
}
