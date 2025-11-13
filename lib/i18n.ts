export type TranslationMap = Record<string, string>;

// 繁中
import zhDashboard from "@/locales/zh-TW/dashboard.json";

// 英文
import enDashboard from "@/locales/en/dashboard.json";


const locales: Record<string, TranslationMap> = {
    "zh-TW": { ...zhDashboard },
    en: { ...enDashboard }
};

export function getTranslation(locale: string): TranslationMap {
    return locales[locale] || locales["zh-TW"];
}
