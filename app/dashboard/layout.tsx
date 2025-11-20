"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, Clock, ChevronRight, ChevronDown, MoreHorizontal } from "lucide-react";
import { JSX, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n-provider";
import { HistoryProvider, useHistory } from "./context/historyContext";
import { LanguageSwitcher } from "@/components/languageSwitcher";
import { LogoutButton } from "@/components/logoutButton";

const USERNAME_STORAGE_KEY = "witsHubUsername";

const GlassPanel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.45)] ${className}`}>
        {children}
    </div>
);

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { t } = useI18n();
    const pathname = usePathname();
    const router = useRouter();
    const [historyExpanded, setHistoryExpanded] = useState(true);
    const { historyList, removeHistory } = useHistory();
    const normalizePath = (p: string) => p.replace(/\/$/, "");

    const navItems: { name: string; href: string; icon: JSX.Element }[] = useMemo(
        () => [{ name: t("chat.title"), href: "/dashboard", icon: <MessageSquare size={18} /> }],
        [t]
    );

    const [mounted, setMounted] = useState(false);
    const [storedUsername, setStoredUsername] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const historyListRef = useRef<HTMLDivElement | null>(null);
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    useEffect(() => setMounted(true), []);
    useEffect(() => {
        const savedUsername = localStorage.getItem(USERNAME_STORAGE_KEY);
        setStoredUsername(savedUsername);

        const handleStorage = () => {
            setStoredUsername(localStorage.getItem(USERNAME_STORAGE_KEY));
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const closeMenu = useCallback(() => {
        setOpenMenuId(null);
        menuButtonRef.current = null;
        setMenuPosition(null);
    }, []);

    useEffect(() => {
        const handleClickAway = () => closeMenu();
        window.addEventListener("click", handleClickAway);
        return () => window.removeEventListener("click", handleClickAway);
    }, [closeMenu]);

    useEffect(() => {
        if (!openMenuId || !menuButtonRef.current) {
            return;
        }

        const updatePosition = () => {
            const target = menuButtonRef.current;
            if (!target) return;

            const rect = target.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 15,
                left: rect.right,
            });
        };

        updatePosition();
        window.addEventListener("resize", updatePosition);
        window.addEventListener("scroll", updatePosition);
        const historyListEl = historyListRef.current;
        historyListEl?.addEventListener("scroll", updatePosition);

        return () => {
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition);
            historyListEl?.removeEventListener("scroll", updatePosition);
        };
    }, [openMenuId]);

    const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>, historyId: string) => {
        event.preventDefault();
        event.stopPropagation();

        if (openMenuId === historyId) {
            closeMenu();
            return;
        }

        menuButtonRef.current = event.currentTarget;
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 15,
            left: rect.right,
        });
        setOpenMenuId(historyId);
    };

    const renderNavLink = (item: (typeof navItems)[number]) => {
        const active = normalizePath(pathname) === normalizePath(item.href);
        return (
            <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 border border-transparent ${
                    active
                        ? "bg-white/15 text-white shadow-[0_10px_40px_rgba(59,130,246,0.35)] border-white/30"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
            >
                <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
                <span className="tracking-wide">{item.name}</span>
            </Link>
        );
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#05070c] text-white">
            <div className="absolute inset-0 pointer-events-none">
                <div className="aurora aurora1" />
                <div className="aurora aurora2" />
                <div className="aurora aurora3" />
                <div className="aurora aurora4" />
                <div className="grid-pattern opacity-[0.15]" />
            </div>

            <div className="relative z-10 flex h-screen flex-col lg:flex-row">
                <aside className="w-full lg:w-80 flex-shrink-0 p-4 sm:p-6">
                    <GlassPanel className="flex h-full flex-col px-5 py-6 gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">WitsHub</p>
                            <p className="text-2xl font-light text-white mt-1">企業智庫</p>
                            <p className="text-sm text-slate-300 mt-2">All in AI. All in One.</p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <nav className="space-y-3">{navItems.map(renderNavLink)}</nav>

                            <div>
                                <button
                                    className="flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm text-slate-200 hover:bg-white/10 transition border border-transparent hover:border-white/5"
                                    onClick={() => setHistoryExpanded(prev => !prev)}
                                >
                                    <span className="flex items-center gap-3">
                                        <Clock size={16} className="text-slate-400" />
                                        {t("history.title")}
                                    </span>
                                    {historyExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>

                                {mounted && historyExpanded && (
                                <div
                                    ref={historyListRef}
                                    className="mt-3 max-h-[45vh] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                                >
                                        {historyList.length === 0 && (
                                            <p className="text-xs text-slate-400 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
                                                尚無歷史對話
                                            </p>
                                        )}
                                        {historyList.map(history => {
                                            const href = `/dashboard/history/${history.id}`;
                                            const active = normalizePath(pathname) === normalizePath(href);
                                            const isMenuOpen = openMenuId === history.id;
                                            return (
                                                <div key={history.id} className="relative group">
                                                    <Link
                                                        href={href}
                                                        className={`block px-4 py-3 pr-12 rounded-2xl text-xs border transition ${
                                                            active
                                                                ? "bg-white/15 border-white/40 text-white"
                                                                : "bg-transparent border-transparent text-slate-300 hover:text-white hover:border-white/30 hover:bg-white/10"
                                                        }`}
                                                    >
                                                        {history.title.length > 12 ? `${history.title.slice(0, 12)}…` : history.title}
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        aria-label="更多選項"
                                                        onClick={event => handleMenuToggle(event, history.id)}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 transition ${
                                                            active || isMenuOpen
                                                                ? "opacity-100 pointer-events-auto bg-white/15"
                                                                : "opacity-0 pointer-events-none bg-black/30 group-hover:opacity-100 group-hover:pointer-events-auto"
                                                        }`}
                                                    >
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    {isMenuOpen && mounted && menuPosition &&
                                                        createPortal(
                                                            <div
                                                                className="fixed z-50 w-20 rounded-lg border border-white/60 bg-white/95 text-slate-900 backdrop-blur-lg p-2 shadow-2xl transform -translate-x-full"
                                                                style={{ top: menuPosition.top, left: menuPosition.left }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                className="w-full text-center px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-200"
                                                                    onClick={event => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        closeMenu();
                                                                    }}
                                                                >
                                                                    分享
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                className="w-full text-center px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-100"
                                                                    onClick={event => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        removeHistory(history.id);
                                                                        const currentPath = normalizePath(pathname);
                                                                        const deletedPath = normalizePath(`/dashboard/history/${history.id}`);
                                                                        if (currentPath === deletedPath) {
                                                                            router.push("/dashboard");
                                                                        }
                                                                        closeMenu();
                                                                    }}
                                                                >
                                                                    刪除
                                                                </button>
                                                            </div>,
                                                            document.body
                                                        )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between px-2 pb-4">
                                <LanguageSwitcher />
                                <LogoutButton />
                            </div>
                            <Link
                                href="/dashboard/profile"
                                className="flex items-center justify-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-medium text-white bg-white/15 border border-white/30 hover:bg-white/20 transition"
                            >
                                <img src="/pic-1.png" alt="使用者頭像" className="w-8 h-8 rounded-full object-cover" />
                                <span>{storedUsername ?? "個人資料"}</span>
                            </Link>
                        </div>
                    </GlassPanel>
                </aside>

                <main className="flex-1 flex flex-col p-4 sm:p-10 gap-6 overflow-hidden">
                    <GlassPanel className="flex-1 p-4 sm:p-8 overflow-hidden">
                        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {children}
                        </div>
                    </GlassPanel>
                </main>
            </div>

            <style jsx>{`
                .aurora {
                    position: absolute;
                    width: 45%;
                    height: 45%;
                    filter: blur(120px);
                    opacity: 0.28;
                    animation: auroraMove 12s ease-in-out infinite alternate;
                    border-radius: 999px;
                }

                .aurora1 {
                    background: #4ea8ff;
                    top: -10%;
                    left: -20%;
                }
                .aurora2 {
                    background: #a855f7;
                    top: 35%;
                    right: -15%;
                    animation-delay: -4s;
                }
                .aurora3 {
                    background: #38bdf8;
                    bottom: -20%;
                    left: 5%;
                    animation-delay: -7s;
                }
                .aurora4 {
                    background: #6366f1;
                    bottom: 5%;
                    right: 10%;
                    animation-delay: -11s;
                }

                .grid-pattern {
                    width: 100%;
                    height: 100%;
                    background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.08) 1px, transparent 0);
                    background-size: 120px 120px;
                }

                @keyframes auroraMove {
                    0% {
                        transform: translate(0, 0) scale(1);
                    }
                    50% {
                        transform: translate(160px, -120px) scale(1.25);
                    }
                    100% {
                        transform: translate(-60px, 80px) scale(1);
                    }
                }
            `}</style>
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
