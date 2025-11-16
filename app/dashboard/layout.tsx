"use client";

// 匯入 Next.js 提供的 Link 元件，用來做前端導航（client-side routing）
import Link from "next/link";
// 匯入 usePathname Hook，可以取得當前路由路徑（pathname）
import { usePathname } from "next/navigation";
// 匯入 Lucide React 的圖示元件，用來顯示 icon
import { MessageSquare, Clock, User, ChevronRight, ChevronDown } from "lucide-react";
// 多語系
import { useI18n } from "@/components/i18n-provider";
// 匯入 useState Hook，用來建立狀態（historyExpanded）
import {JSX, useEffect, useState} from "react";
// 匯入歷史紀錄的 context Provider 以及 Hook
import { HistoryProvider, useHistory } from "./context/historyContext";

// 定義 DashboardContent 元件，接收 children 作為頁面內容
function DashboardContent({ children }: { children: React.ReactNode }) {
    // 使用 i18n hook 取得 t 函式，用來翻譯文字
    const { t } = useI18n();
    // 取得當前路由路徑
    const pathname = usePathname();
    // 狀態：歷史對話列表是否展開，默認先展開
    const [historyExpanded, setHistoryExpanded] = useState(true);
    // 從 HistoryContext 取得 historyList（所有歷史對話）
    const { historyList } = useHistory();

    // 讓路徑比較更可靠：移除結尾斜線
    const normalizePath = (p: string) => p.replace(/\/$/, "");
    // 判斷 navItem 是否為當前路由
    const isNavItemActive = (href: string) => normalizePath(pathname) === normalizePath(href);

    // 定義 Sidebar 導航項目陣列
    const navItems: { name: string; href: string; icon: JSX.Element }[] = [
        { name: t("chat.title"), href: "/dashboard", icon: <MessageSquare size={18} /> },
        { name: t("history.title"), href: "/dashboard/history", icon: <Clock size={18} /> },
        { name: t("profile.title"), href: "/dashboard/profile", icon: <User size={18} /> },
    ];

    // 狀態：判斷組件是否已經在 client 端掛載完成，初始值為 false，代表尚未掛載
    const [mounted, setMounted] = useState(false);

    /**
     * useEffect 只會在 client 端執行一次（組件掛載後）
     * 這裡將 mounted 設為 true，表示 client 已經準備好
     * 之後可以安全地 render 依賴 window / client-only 的內容
     */
    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar 左側菜單欄：容器：固定寬度 64，漸層背景，白字，垂直排列 */}
            <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-lg">
                {/* Sidebar 標題區：高度 16，底線邊框 */}
                <div className="flex items-center justify-center h-16 border-b border-gray-700">
                    {/* Logo 或標題 */}
                    <span className="text-2xl font-bold tracking-wide">
                        WITS<span className="text-blue-400"> HUB</span>
                    </span>
                </div>

                {/* Sidebar 導航區：自動撐滿剩餘空間，padding，間距，允許滾動 */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {/* 導航：聊天室頁面連結，當前路由高亮 */}
                    <Link
                        href={navItems[0].href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
                            isNavItemActive(navItems[0].href) 
                                ? "bg-blue-500/20 text-blue-300" 
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                    >
                        {navItems[0].icon}
                        <span>{navItems[0].name}</span>
                    </Link>

                    {/* 歷史紀錄 */}
                    <div
                        className="flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                    >
                        {/* 歷史對話展開/收合按鈕，點擊切換 historyExpanded 狀態 */}
                        <div className="flex items-center gap-3">
                            {navItems[1].icon}
                            <span>{navItems[1].name}</span>
                        </div>
                        {/*展開：箭頭向下、收起：箭頭向右*/}
                        {historyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {/* 歷史對話列表：展開時顯示，無歷史顯示提示，有歷史則列出每筆對話 */}
                    {mounted && historyExpanded && (
                        <ul className="ml-7 mt-2 space-y-1">
                            {historyList.length === 0 && <li className="text-gray-400 text-sm">尚無歷史對話</li>}
                            {historyList.map(h => (
                                <li key={h.id}>
                                    <Link
                                        href={`/dashboard/history/${h.id}`}
                                        className={`block px-3 py-1 rounded text-sm hover:bg-gray-700 hover:text-white ${
                                            normalizePath(pathname) === `/dashboard/history/${h.id}` 
                                                ? "bg-blue-500/20 text-blue-300" 
                                                : ""
                                        }`}
                                    >
                                        {h.title.length > 20 ? h.title.slice(0, 20) + "…" : h.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* 導航：個人資料頁面連結，當前路由高亮 */}
                    <Link
                        href={navItems[2].href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
                            isNavItemActive(navItems[2].href) 
                                ? "bg-blue-500/20 text-blue-300" 
                                : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                    >
                        {navItems[2].icon}
                        <span>{navItems[2].name}</span>
                    </Link>
                </nav>

                {/* Sidebar 底部資訊區：版本或公司名稱 */}
                <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                    <p>WITS IT</p>
                    <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
                </div>
            </aside>

            {/* 主要內容區：flex-1 自動撐滿，padding，允許滾動 */}
            <main className="flex-1 p-10 overflow-y-auto">
                {/* 內容卡片容器：白底、圓角、陰影、padding */}
                <div className="bg-white shadow-sm rounded-2xl p-8 h-full border border-gray-200">
                    {children}
                </div>
            </main>
        </div>
    );
}

// DashboardLayout 元件，用 HistoryProvider 包裹整個 DashboardContent
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <HistoryProvider>
            <DashboardContent>{children}</DashboardContent>
        </HistoryProvider>
    );
}
