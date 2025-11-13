"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getTranslation } from "@/lib/i18n";

// ✅ 匯出給外部引用的型別
export type Locale = "zh-TW" | "en";

interface I18nContextProps {
    t: (key: string) => string;
    locale: Locale;
    setLocale: (lang: Locale) => void;
}

const I18nContext = createContext<I18nContextProps>({
    t: (k) => k,
    locale: "zh-TW",
    setLocale: () => {},
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>("zh-TW");
    const [translations, setTranslations] = useState<Record<string, string>>({});

    // ✅ 初始化語系邏輯
    useEffect(() => {
        // 1️⃣ 優先從 localStorage 讀取使用者設定
        const saved = localStorage.getItem("locale") as Locale | null;
        if (saved) {
            setLocale(saved);
            setTranslations(getTranslation(saved));
            return;
        }

        // 2️⃣ 否則從瀏覽器自動偵測
        const browserLang = navigator.language.toLowerCase();

        let detected: Locale = "zh-TW";
        if (browserLang.startsWith("en")) detected = "en";
        else if (browserLang.startsWith("zh")) detected = "zh-TW";

        setLocale(detected);
        localStorage.setItem("locale", detected);
        setTranslations(getTranslation(detected));
    }, []);

    // ✅ 當語系改變時更新翻譯內容
    useEffect(() => {
        setTranslations(getTranslation(locale));
    }, [locale]);

    const t = (key: string) => translations[key] || key;

    return (
        <I18nContext.Provider value={{ t, locale, setLocale }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
