export type TranslationMap = Record<string, string>;
export type Locale = "zh-TW" | "en" | "ja";

// 繁中
import zhDashboard from "@/locales/zh-TW/dashboard.json";

// 英文
import enDashboard from "@/locales/en/dashboard.json";

// 日文
import jaDashboard from "@/locales/ja/dashboard.json";

const locales: Record<Locale, TranslationMap> = {
    "zh-TW": { ...zhDashboard },
    en: { ...enDashboard },
    ja: { ...jaDashboard },
};

export function getTranslation(locale: string): TranslationMap {
    return locales[(locale as Locale) || "zh-TW"] || locales["zh-TW"];
}

export function getStoredLocale(): Locale {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        const browserLang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "zh-tw";
        if (browserLang.startsWith("en")) return "en";
        if (browserLang.startsWith("ja")) return "ja";
        return "zh-TW";
    }
    const stored = localStorage.getItem("locale");
    if (stored === "en") return "en";
    if (stored === "ja") return "ja";
    return "zh-TW";
}

export function translate(key: string, locale?: Locale): string {
    const lang = locale || getStoredLocale();
    const dictionary = getTranslation(lang);
    return dictionary[key] || key;
}
