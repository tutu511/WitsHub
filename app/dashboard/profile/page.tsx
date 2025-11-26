"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { User, getUser, getPersonRole } from "@/lib/user";
import { deleteHistoryByPerson } from "@/lib/chatHistory";
import { useHistory } from "@/app/dashboard/context/historyContext";
import { getReplyPreference, saveReplyPreference } from "@/lib/preference";

export default function ProfilePage() {
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [replyPreference, setReplyPreference] = useState("");
    const [isSavingPreference, setIsSavingPreference] = useState(false);
    const { refreshHistory } = useHistory();

    useEffect(() => {
        const stored = getUser();
        if (stored != null) {
            setUserInfo(stored);
            setReplyPreference(getReplyPreference(stored.username));
        }
    }, []);

    const displayName = userInfo?.personName?.trim() || "訪客";
    const personId = userInfo?.username || "";
    const role = getPersonRole();

    const handleCustomizeReplyPreference = () => {
        if (!personId) return;
        const promptValue = window.prompt(
            "希望 AI 用什麼風格與語氣回覆？",
            replyPreference || "範例：溫暖親切、條列式回覆重點"
        );
        if (promptValue === null) return;
        const trimmed = promptValue.trim();

        setIsSavingPreference(true);
        try {
            saveReplyPreference(personId, trimmed);
            setReplyPreference(trimmed);
        } finally {
            setIsSavingPreference(false);
        }
    };

    const handleClearHistory = () => {
        if (!personId) return;
        const confirmed = window.confirm("確定要刪除所有聊天記錄嗎？此動作無法復原。");
        if (!confirmed) return;

        setIsClearing(true);
        try {
            deleteHistoryByPerson(personId);
            refreshHistory();
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <div className="px-4 py-10 flex justify-center">
            <div className="w-full max-w-4xl space-y-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-[0_20px_45px_rgba(59,130,246,0.45)] border border-white/10 bg-white/10">
                        <Image
                            src="/pic-1.png"
                            alt={displayName || "使用者頭貼"}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                            priority
                        />
                    </div>
                    <div>
                        <p className="text-3xl font-semibold mt-1">{displayName}</p>
                        <p className="text-sm text-slate-400 mt-1">歡迎回來，這裡可以查看你的帳號資訊與管理聊天紀錄</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">姓名</p>
                        <p className="text-xl font-semibold mt-2">{displayName}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">員工編號</p>
                        <p className="text-xl font-semibold mt-2">{personId || "未登入"}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">角色</p>
                        <p className="text-xl font-semibold mt-2">{role}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-lg font-semibold">自訂風格與語氣</p>
                            <p className="text-sm text-slate-300 mt-1">
                                {replyPreference
                                    ? `目前設定：${replyPreference}`
                                    : "設定 AI 的回覆風格與語氣，讓對話更符合你的風格"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleCustomizeReplyPreference}
                            disabled={!personId || isSavingPreference}
                            className="px-4 py-2 rounded-xl bg-slate-50/10 border border-white/15 hover:bg-slate-50/15 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {isSavingPreference ? "儲存中..." : "自訂風格與語氣"}
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-lg font-semibold">刪除所有聊天內容</p>
                            <p className="text-sm text-red-200/80 mt-1">此動作無法復原</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearHistory}
                            disabled={!personId || isClearing}
                            className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {isClearing ? "刪除中..." : "全部刪除"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
