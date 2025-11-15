// app/dashboard/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Clock, User, ChevronRight, ChevronDown } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { useState } from "react";
import { HistoryProvider, useHistory } from "./context/historyContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { t } = useI18n();
    const pathname = usePathname();
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const { historyList } = useHistory();

    const navItems = [
        { name: t("chat.title"), href: "/dashboard", icon: <MessageSquare size={18} /> },
        { name: t("history.title"), href: "/dashboard/history", icon: <Clock size={18} /> },
        { name: t("profile.title"), href: "/dashboard/profile", icon: <User size={18} /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-lg">
                <div className="flex items-center justify-center h-16 border-b border-gray-700">
                    <span className="text-2xl font-bold tracking-wide">
                        WITS<span className="text-blue-400"> HUB</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    <Link
                        href={navItems[0].href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
                            pathname === navItems[0].href ? "bg-blue-500/20 text-blue-300" : "text-gray-300 hover:bg-gray-700 hover:text-white"
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
                        <div className="flex items-center gap-3">
                            {navItems[1].icon}
                            <span>{navItems[1].name}</span>
                        </div>
                        {historyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>

                    {historyExpanded && (
                        <ul className="ml-7 mt-2 space-y-1">
                            {historyList.length === 0 && <li className="text-gray-400 text-sm">尚無歷史對話</li>}
                            {historyList.map(h => (
                                <li key={h.id}>
                                    <Link
                                        href={`/dashboard/history/${h.id}`}
                                        className={`block px-3 py-1 rounded text-sm hover:bg-gray-700 hover:text-white ${
                                            pathname === `/dashboard/history/${h.id}` ? "bg-blue-500/20 text-blue-300" : ""
                                        }`}
                                    >
                                        {h.title.length > 20 ? h.title.slice(0, 20) + "…" : h.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Link
                        href={navItems[2].href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200 ${
                            pathname === navItems[2].href ? "bg-blue-500/20 text-blue-300" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                        }`}
                    >
                        {navItems[2].icon}
                        <span>{navItems[2].name}</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                    <p>WITS IT</p>
                    <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
                </div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <div className="bg-white shadow-sm rounded-2xl p-8 h-full border border-gray-200">
                    {children}
                </div>
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <HistoryProvider>
            <DashboardContent>{children}</DashboardContent>
        </HistoryProvider>
    );
}
