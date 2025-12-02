"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { User, getUser } from "@/lib/user";
import { deleteHistoryByPerson } from "@/lib/chatHistory";
import { useHistory } from "@/app/dashboard/context/historyContext";
import { getReplyPreference, removeReplyPreference, saveReplyPreference } from "@/lib/preference";
import { useI18n } from "@/components/i18n-provider";

export default function ProfilePage() {
    const { t } = useI18n();
    const [userInfo, setUserInfo] = useState<User | null>(null);
    const [isClearing, setIsClearing] = useState(false);
    const [replyPreference, setReplyPreference] = useState("");
    const [isSavingPreference, setIsSavingPreference] = useState(false);
    const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
    const [preferenceDraft, setPreferenceDraft] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { refreshHistory } = useHistory();

    useEffect(() => {
        const stored = getUser();
        if (stored != null) {
            setUserInfo(stored);
            setReplyPreference(getReplyPreference(stored.username));
        }
    }, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const displayName = userInfo?.personName?.trim() || t("common.guest");
    const personId = userInfo?.username || "";
    const role = userInfo?.role || t("profile.role.unset");

    const handleOpenPreferenceModal = () => {
        if (!personId) return;
        setPreferenceDraft(replyPreference || "");
        setIsPreferenceModalOpen(true);
    };

    const handleClosePreferenceModal = () => {
        if (isSavingPreference) return;
        setIsPreferenceModalOpen(false);
    };

    const handleSavePreference = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!personId) return;
        const trimmed = preferenceDraft.trim();
        setIsSavingPreference(true);
        try {
            saveReplyPreference(personId, trimmed);
            setReplyPreference(trimmed);
            setIsPreferenceModalOpen(false);
        } finally {
            setIsSavingPreference(false);
        }
    };

    const handleDeletePreference = () => {
        if (!personId) return;
        setIsSavingPreference(true);
        try {
            removeReplyPreference(personId);
            setReplyPreference("");
            setPreferenceDraft("");
            setIsPreferenceModalOpen(false);
        } finally {
            setIsSavingPreference(false);
        }
    };

    const handleClearHistory = () => {
        if (!personId) return;
        setIsDeleteModalOpen(true);
    };

    const handleConfirmClearHistory = () => {
        if (!personId) return;
        setIsDeleteModalOpen(false);
        setIsClearing(true);
        try {
            deleteHistoryByPerson(personId);
            refreshHistory();
        } finally {
            setIsClearing(false);
        }
    };

    const handleCloseDeleteModal = () => {
        if (isClearing) return;
        setIsDeleteModalOpen(false);
    };

    return (
        <div className="px-4 py-10 flex justify-center">
            <div className="w-full max-w-4xl space-y-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden shadow-[0_20px_45px_rgba(59,130,246,0.45)] border border-white/10 bg-white/10">
                        <Image
                            src="/pic-1.png"
                            alt={displayName || t("common.userAvatarAlt")}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                            priority
                        />
                    </div>
                    <div>
                        <p className="text-3xl font-semibold mt-1">{displayName}</p>
                        <p className="text-sm text-slate-400 mt-1">{t("profile.welcome")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("profile.name.label")}</p>
                        <p className="text-xl font-semibold mt-2">{displayName}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("profile.id.label")}</p>
                        <p className="text-xl font-semibold mt-2">{personId || t("profile.id.notLoggedIn")}</p>
                    </div>
                    <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{t("profile.role.label")}</p>
                        <p className="text-xl font-semibold mt-2">{role}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-lg font-semibold">{t("profile.preference.title")}</p>
                            <p className="text-sm text-slate-300 mt-1">
                                {replyPreference
                                    ? `${t("profile.preference.currentPrefix")}${replyPreference}`
                                    : t("profile.preference.subtitle")}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleOpenPreferenceModal}
                            disabled={!personId || isSavingPreference}
                            className="px-4 py-2 rounded-xl bg-slate-50/10 border border-white/15 hover:bg-slate-50/15 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {isSavingPreference ? t("profile.preference.saving") : t("profile.preference.button")}
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-lg font-semibold">{t("profile.delete.title")}</p>
                            <p className="text-sm text-red-200/80 mt-1">{t("profile.delete.subtitle")}</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleClearHistory}
                            disabled={!personId || isClearing}
                            className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
                        >
                            {isClearing ? t("profile.delete.processing") : t("profile.delete.button")}
                        </button>
                    </div>
                </div>
            </div>

            {isClient && isPreferenceModalOpen &&
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
                        <form
                            onSubmit={handleSavePreference}
                            className="w-full max-w-lg rounded-2xl bg-slate-900/90 border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.45)] p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-white">{t("profile.preference.title")}</p>
                                    <p className="text-sm text-slate-300 mt-1">{t("profile.preference.subtitle")}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleClosePreferenceModal}
                                    className="text-slate-300 hover:text-white transition"
                                    aria-label="Close"
                                >
                                    ✕
                                </button>
                            </div>

                        <div className="space-y-3">
                                <textarea
                                    id="replyPreference"
                                    value={preferenceDraft}
                                    onChange={(e) => setPreferenceDraft(e.target.value)}
                                    placeholder={t("profile.preference.placeholder")}
                                    className="w-full min-h-[120px] rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-300/40"
                                />
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={handleDeletePreference}
                                    disabled={!personId || isSavingPreference || (!replyPreference && !preferenceDraft)}
                                    className="px-4 py-2 rounded-xl border border-red-400/40 text-red-200 hover:bg-red-500/10 transition disabled:opacity-60"
                                >
                                    {isSavingPreference ? t("profile.preference.deleting") : t("profile.preference.delete")}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSavingPreference}
                                    className="px-5 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/15 hover:border-white/30 transition disabled:opacity-60"
                                >
                                    {isSavingPreference ? t("profile.preference.saving") : t("profile.preference.save")}
                                </button>
                            </div>
                        </form>
                    </div>,
                    document.body
                )
            }

            {isClient && isDeleteModalOpen &&
                createPortal(
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4">
                        <div className="w-full max-w-md rounded-2xl bg-slate-900/90 border border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.45)] p-6 space-y-5">
                            <div className="space-y-2">
                                <p className="text-lg font-semibold text-white">{t("profile.delete.confirmTitle")}</p>
                                <p className="text-sm text-slate-300">{t("profile.delete.confirmDescription")}</p>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={handleCloseDeleteModal}
                                    disabled={isClearing}
                                    className="px-4 py-2 rounded-xl border border-white/15 text-slate-200 hover:bg-white/5 transition disabled:opacity-60"
                                >
                                    {t("profile.delete.cancel")}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmClearHistory}
                                    disabled={isClearing}
                                    className="px-5 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-semibold transition disabled:opacity-60"
                                >
                                    {isClearing ? t("profile.delete.processing") : t("profile.delete.button")}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div>
    );
}
