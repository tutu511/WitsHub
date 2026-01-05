"use client";

import { useEffect, useState } from "react";
import {apiService} from "@/lib/api";
// 語音轉文字
import VoiceTransformText from "@/components/voiceTransformText";
// icon
import {Ban, SendHorizontal, Calendar, CreditCard, Mail, Truck, Package, Search} from "lucide-react";
// 用來操作歷史（新增/查詢）
import {useHistory} from "@/app/dashboard/context/historyContext";
// 引入類型（或介面）Message，用來定義訊息資料結構
import { Message } from "@/lib/chatHistory";
import {useI18n} from "@/components/i18n-provider";
// 引入 Next.js 的 useRouter（新的 app router 版本）以做程式化導向
import { useRouter } from "next/navigation";

export default function HrSelfServicePage() {
    // 多語系，自動對應
    const { t, locale } = useI18n();
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
    const serviceList = [
        {
            id: "massage",
            icon: Calendar,
            title: "按摩預約",
            desc: "每週一 10:00 開放預約",
        },
        {
            id: "card",
            icon: CreditCard,
            title: "名片印製",
            desc: "最少 2 盒起訂",
        },
        {
            id: "mail",
            icon: Mail,
            title: "寄件申請",
            desc: "13:00 前當天寄出",
        },
        {
            id: "express",
            icon: Truck,
            title: "快遞申請",
            desc: "快速處理流程",
        },
        {
            id: "pickup",
            icon: Package,
            title: "取件申請",
            desc: "查詢與領取包裹",
        },
        {
            id: "query",
            icon: Search,
            title: "查詢管理",
            desc: "追蹤申請進度"
        }
    ];

    useEffect(() => {
    }, []);

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
        const chatId = addHistory(messages, { isTitlePending: true }, "hrSelfService");

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
            {/* ========== 頂部：固定標題 ========== */}
            <div className="flex-shrink-0 pt-5 pb-8">
                <h2 className="text-2xl font-semibold text-white text-center">
                    {t("hrSelfService.title")}
                </h2>
            </div>

            {/* ========== 中間：可滾動內容區 ========== */}
            <div className="flex-1 overflow-y-auto px-4">
                {/* 服務列表 */}
                {serviceList.map((service, index) => {
                    const Icon = service.icon;
                    return (
                        <div key={service.id}>
                            <div className="flex items-start gap-3 py-6">
                                <div className="flex-shrink-0 p-3 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <Icon size={22} className="text-white" />
                                </div>

                                <div className="flex-1 flex items-center justify-between gap-4">
                                    {/* 左側：標題 + 描述 */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white leading-tight">
                                            {service.title}
                                        </h3>
                                        <p className="text-sm text-white/50 mt-1">
                                            {service.desc}
                                        </p>
                                    </div>

                                    {/* 右側：數據卡片 */}
                                    {service.id === 'massage' && (
                                        <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                            <p className="text-xs text-blue-400/70 mb-0.5">下次預約</p>
                                            <p className="text-sm font-semibold text-blue-300">週三 14:00</p>
                                        </div>
                                    )}

                                    {service.id === 'card' && (
                                        <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                            <p className="text-xs text-orange-400/70 mb-0.5">待審批</p>
                                            <p className="text-sm font-semibold text-orange-300">1 件</p>
                                        </div>
                                    )}

                                    {service.id === 'mail' && (
                                        <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                                            <p className="text-xs text-green-400/70 mb-0.5">進行中</p>
                                            <p className="text-sm font-semibold text-green-300">3 筆申請</p>
                                        </div>
                                    )}

                                    {service.id === 'express' && (
                                        <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                                            <p className="text-xs text-green-400/70 mb-0.5">進行中</p>
                                            <p className="text-sm font-semibold text-green-300">2 筆申請</p>
                                        </div>
                                    )}

                                    {service.id === 'pickup' && (
                                        <div className="flex-shrink-0 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/30">
                                            <p className="text-xs text-pink-400/70 mb-0.5">待取件</p>
                                            <p className="text-sm font-semibold text-pink-300">2 個包裹</p>
                                        </div>
                                    )}

                                </div>
                            </div>

                            {/* 分割線（最後一個不顯示） */}
                            {index < serviceList.length - 1 && (
                                <div className="-mx-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* ========== 底部：固定輸入框 ========== */}
            {/* 下方輸入框 + 送出按鈕 */}
            <div className="flex-shrink-0 flex gap-2 pt-6">
            {/*<div className="fixed bottom-0 left-0 right-0 w-full p-8 flex gap-2 mt-4">*/}
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
