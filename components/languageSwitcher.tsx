"use client";

import { useState } from "react";
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
        { code: "en", label: "English" }
    ];

    // 切換了語系
    const handleChangeLocale = (lang: Locale) => {
        setLocale(lang);
        localStorage.setItem("locale", lang);
    };

    return (
        <DropdownMenu onOpenChange={setOpen}>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 p-2 rounded focus:outline-none hover:bg-muted/50"
             onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
                {showGif ? (
                    <img src="/language.gif" className="w-6 h-6" />
                ) : (
                    <img src="/language.png" className="w-6 h-6" />
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {languages.map((lang) => (
                    <DropdownMenuItem
                        key={lang.code}
                        onClick={() => handleChangeLocale(lang.code)}
                        className={
                            locale === lang.code ? "bg-muted font-semibold" : ""
                        }
                    >
                        {lang.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
