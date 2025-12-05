"use client";

import { useState } from "react";
import { Check } from "lucide-react";
// 下拉選單
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// 語系
import { useI18n, type Locale } from "@/components/i18n-provider";

export function LanguageSwitcher() {
    // 設置語系
    const { locale, setLocale } = useI18n();
    // 下拉選單是否開啟中
    const [open, setOpen] = useState(false);
    // 滑鼠 hover 狀態
    const [hover, setHover] = useState(false);
    // 判斷要顯示 png 還是 GIF
    const showGif = open || hover;

    // 定義下拉選單的選項
    const languages: { code: Locale; label: string }[] = [
        { code: "zh-TW", label: "中文" },
        { code: "en", label: "English" },
        { code: "ja", label: "日本語" }
    ];

    // 切換了語系
    const handleChangeLocale = (lang: Locale) => {
        setLocale(lang);
        localStorage.setItem("locale", lang);
    };

    return (
        <DropdownMenu onOpenChange={setOpen}>
            <DropdownMenuTrigger
                className="inline-flex items-center gap-1 p-2 rounded focus:outline-none"
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {showGif ? (
                    <img src="/language.gif" className="w-6 h-6" />
                ) : (
                    <img src="/language.png" className="w-6 h-6" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
                side="right"
                align="start"
                className="border-white/60 bg-white/85 text-slate-900 rounded-2xl shadow-2xl p-2 w-28 -translate-y-5"
            >
                {languages.map((lang) => {
                    const isActive = locale === lang.code;
                    return (
                        <DropdownMenuItem
                            key={lang.code}
                            onClick={() => handleChangeLocale(lang.code)}
                            className={`rounded-xl text-xs px-3 py-2 transition-colors hover:bg-slate-200 focus:bg-slate-200 hover:text-slate-900 focus:text-slate-900 ${
                                isActive ? "text-slate-900 font-semibold" : "text-slate-700"
                            }`}
                        >
                            <span>{lang.label}</span>
                            {isActive && <Check className="w-3.5 h-3.5 text-slate-600 ml-auto" />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
