"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getStoredLocale, getTranslation, type Locale } from "@/lib/i18n";

// ✅ 匯出給外部引用的型別
export type { Locale };

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
    const [translations, setTranslations] = useState<Record<string, string>>(() => getTranslation("zh-TW"));

    // ✅ 初始化語系邏輯
    useEffect(() => {
        const detected = getStoredLocale();
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
