"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Clock, User } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";

export default function DashboardLayout(
    {
        children,
    }: {
        children: React.ReactNode;
    }) {
    // 使用多語函式
    const { t } = useI18n();
    const pathname = usePathname();

    const navItems = [
        { name: "對話頁", href: "/dashboard", icon: <MessageSquare size={18} /> },
        { name: "歷史紀錄", href: "/dashboard/history", icon: <Clock size={18} /> },
        { name: t("profile.title"), href: "/dashboard/profile", icon: <User size={18} /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* 左側導航欄 */}
            <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col shadow-lg">
                <div className="flex items-center justify-center h-16 border-b border-gray-700">
          <span className="text-2xl font-bold tracking-wide">
            WITS<span className="text-blue-400"> HUB</span>
          </span>
                </div>

                {/* 導航列表 */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        const baseClass =
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors duration-200";
                        const activeClass = isActive
                            ? "bg-blue-500/20 text-blue-300"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white";
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${baseClass} ${activeClass}`}
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* 底部版本資訊 */}
                <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
                    <p>WITS IT</p>
                    <p className="text-xs text-gray-500 mt-1">v1.0.0</p>
                </div>
            </aside>

            {/* 右側主要內容 */}
            <main className="flex-1 p-10 overflow-y-auto">
                <div className="bg-white shadow-sm rounded-2xl p-8 h-full border border-gray-200">
                    {children}
                </div>
            </main>
        </div>
    );
}
