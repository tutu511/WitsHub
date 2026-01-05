"use client";

// 匯入 Next.js 提供的 Link 元件，用來做前端導航（client-side routing）
import Link from "next/link";
// 匯入 usePathname Hook，可以取得當前路由路徑（pathname）
import { usePathname, useRouter } from "next/navigation";
// icon
import { MessageSquare, Clock, ChevronRight, ChevronDown, MoreHorizontal, Newspaper, FilePenLine } from "lucide-react";
// 匯入 useState Hook，用來建立狀態（historyExpanded）
import { JSX, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
// 多語系
import { useI18n } from "@/components/i18n-provider";
// 匯入歷史紀錄的 context Provider 以及 Hook
import { HistoryProvider, useHistory } from "./context/historyContext";
// 語言選擇
import { LanguageSwitcher } from "@/components/languageSwitcher";
// 登出按鈕
import { LogoutButton } from "@/components/logoutButton";
import { ShareChatDialog } from "@/components/shareChatDialog";
import {getPersonName} from "@/lib/user";

// 粗略計算可視長度，CJK 算 2，其他算 1，讓英文可以顯示更多才截斷
const truncateTitle = (title: string, maxUnits = 22) => {
    let units = 0;
    let result = "";
    for (const ch of title) {
        const isCJK = /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch);
        const nextUnits = units + (isCJK ? 2 : 1);
        if (nextUnits > maxUnits) {
            return `${result}…`;
        }
        units = nextUnits;
        result += ch;
    }
    return result;
};

const GlassPanel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.45)] ${className}`}>
        {children}
    </div>
);

// 定義 DashboardContent 元件，接收 children 作為頁面內容
function DashboardContent({ children }: { children: React.ReactNode }) {
    // 使用 i18n hook 取得 t 函式，用來翻譯文字
    const { t } = useI18n();
    // 取得當前路由路徑
    const pathname = usePathname();
    // 取得 router 實例，用於導頁（導航）
    const router = useRouter();
    const [historyExpanded, setHistoryExpanded] = useState(true);
    // 刪除歷史紀錄
    const { historyList, removeHistory, renameHistory, titleLoadingIds } = useHistory();
    // 讓路徑比較更可靠：移除結尾斜線
    const normalizePath = (p: string) => p.replace(/\/$/, "");

    // 定義 Sidebar 導航項目陣列
    const navItems: { name: string; href: string; icon: JSX.Element }[] = useMemo(
        () => [{ name: t("chat.title"), href: "/dashboard", icon: <MessageSquare size={18} /> }],
        [t]
    );

    // 狀態：判斷組件是否已經在 client 端掛載完成，初始值為 false，代表尚未掛載
    const [mounted, setMounted] = useState(false);
    // 從 localStorage 讀出的使用者名稱
    const [storedUsername, setStoredUsername] = useState<string | null>(null);
    // 目前開啟的歷史項目的選單 id
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    // history list 的 DOM 參考，用來監聽 scroll
    const historyListRef = useRef<HTMLDivElement | null>(null);
    // 記住觸發 menu 的按鈕元素，用來定位
    const menuButtonRef = useRef<HTMLButtonElement | null>(null);
    // menu 的絕對定位
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    // 是否點擊了分享
    const [isOpenShare, setOpenShare] = useState(false);
    // 選擇的聊天 ID
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    // 進行 inline rename 的 chat id
    const [editingId, setEditingId] = useState<string | null>(null);
    // rename 中的暫存標題
    const [editingTitle, setEditingTitle] = useState("");
    // rename 輸入法組字狀態
    const [isRenameComposing, setIsRenameComposing] = useState(false);
    // rename input 的參考，用來自動 focus
    const renameInputRef = useRef<HTMLInputElement | null>(null);
    // 防止重複提交 rename
    const renameSubmittingRef = useRef(false);
    /**
     * useEffect 只會在 client 端執行一次（組件掛載後）
     * 這裡將 mounted 設為 true，表示 client 已經準備好
     * 之後可以安全地 render 依賴 window / client-only 的內容
     */
    useEffect(() => setMounted(true), []);
    // 只在初次掛載時執行
    useEffect(() => {
        // 從 localStorage 取得 username
        const savedUsername = getPersonName();
        // 設定到 state
        setStoredUsername(savedUsername);

        const handleStorage = () => {
            // 同步更新（跨 tab 的 storage 事件）
            setStoredUsername(getPersonName());
        };

        // 監聽 storage 事件
        window.addEventListener("storage", handleStorage);
        // 清除監聽
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    useEffect(() => {
        if (!editingId) return;
        const timer = setTimeout(() => {
            renameInputRef.current?.focus();
            renameInputRef.current?.select();
        }, 0);

        return () => clearTimeout(timer);
    }, [editingId]);

    // 針對歷史紀錄的列表，點擊更多（...）的選單
    const closeMenu = useCallback(() => {
        // 關閉 menu（把 open id 設為 null）
        setOpenMenuId(null);
        // 清除 menu 的按鈕參考
        menuButtonRef.current = null;
        // 清除 menu 的定位
        setMenuPosition(null);
    }, []);

    useEffect(() => {
        // 點擊其他地方就關閉 menu
        const handleClickAway = () => closeMenu();
        // 全域點擊監聽
        window.addEventListener("click", handleClickAway);
        // 清除監聽
        return () => window.removeEventListener("click", handleClickAway);
    }, [closeMenu]);

    // 當 openMenuId 改變時重新執行
    useEffect(() => {
        if (!openMenuId || !menuButtonRef.current) {
            // 若沒有開啟 menu 或沒有按鈕參考就不做定位更新
            return;
        }

        const updatePosition = () => {
            // 取得當前按鈕
            const target = menuButtonRef.current;
            if (!target) return;

            // 取得按鈕位置
            const rect = target.getBoundingClientRect();
            // 設置歷史紀錄列表顯示的位置，在按鈕下方 15px & 靠按鈕右邊對齊
            setMenuPosition({
                top: rect.bottom + 15,
                left: rect.right,
            });
        };

        // 先更新一次位置
        updatePosition();
        // 視窗改變時更新位置
        window.addEventListener("resize", updatePosition);
        // 捲動時更新位置
        window.addEventListener("scroll", updatePosition);
        // 取得 history list DOM
        const historyListEl = historyListRef.current;
        // history 區塊捲動時也更新位置
        historyListEl?.addEventListener("scroll", updatePosition);

        return () => {
            // 清除監聽
            window.removeEventListener("resize", updatePosition);
            window.removeEventListener("scroll", updatePosition);
            historyListEl?.removeEventListener("scroll", updatePosition);
        };
    }, [openMenuId]);

    const handleMenuToggle = (event: MouseEvent<HTMLButtonElement>, historyId: string) => {
        // 取消預設行為（避免 link 被觸發）
        event.preventDefault();
        // 阻止事件冒泡（避免觸發外層 click away）
        event.stopPropagation();

        if (openMenuId === historyId) {
            // 若同一個 id 就關閉 menu（切換行為）
            closeMenu();
            return;
        }

        // 記住按鈕元素作為定位參考
        menuButtonRef.current = event.currentTarget;
        // 取得按鈕位置
        const rect = event.currentTarget.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 15,
            left: rect.right,
        });
        // 開啟對應 id 的 menu
        setOpenMenuId(historyId);
    };

    const startRenaming = (historyId: string, title: string) => {
        closeMenu();
        setEditingId(historyId);
        setEditingTitle(title);
    };

    const cancelRenaming = () => {
        setEditingId(null);
        setEditingTitle("");
    };

    const commitRename = () => {
        if (!editingId || renameSubmittingRef.current) return;
        renameSubmittingRef.current = true;
        const nextTitle = editingTitle.trim() || t("chat.defaultTitle");
        renameHistory(editingId, nextTitle);
        setEditingId(null);
        setEditingTitle("");
        setTimeout(() => {
            renameSubmittingRef.current = false;
        }, 0);
    };

    const renderNavLink = (item: (typeof navItems)[number]) => {
        // 判斷此導航是否為 active
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
                {/* 主選單 icon */}
                <span className={active ? "text-white" : "text-slate-400"}>{item.icon}</span>
                {/* 主選單的名稱 */}
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

            {/* 主要 layout：側邊欄 + 主要內容 */}
            <div className="relative z-10 flex h-screen min-h-0 flex-col lg:flex-row">
                <aside className="w-full lg:w-80 flex-shrink-0 p-4 sm:p-7 min-h-0">
                    {/* 使用 GlassPanel 包裹內容 */}
                    <GlassPanel className="flex h-full min-h-0 flex-col overflow-hidden px-5 py-6 gap-6">
                        {/* 標題 */}
                        <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">WitsHub</p>
                            <p className="text-2xl font-light text-white mt-1">{t("sidebar.subtitle")}</p>
                            <p className="text-sm text-slate-300 mt-2">All in AI. All in One.</p>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
                            {/* 導航項目列表 */}
                            <nav className="space-y-3">{navItems.map(renderNavLink)}</nav>

                            <Link
                                href="/dashboard/news"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 border border-transparent ${
                                    normalizePath(pathname) === normalizePath("/dashboard/news")
                                        ? "bg-white/15 text-white shadow-[0_10px_40px_rgba(59,130,246,0.35)] border-white/30"
                                        : "text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                 <span className="flex items-center gap-3">
                                        {/* 新聞圖示 icon（代表 AI 新知） */}
                                     <Newspaper size={18} className="text-slate-400" />
                                     {t("news.title")}
                                    </span>
                            </Link>

                            <Link
                                href="/dashboard/hrSelfService"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-200 border border-transparent ${
                                    normalizePath(pathname) === normalizePath("/dashboard/hrSelfService")
                                        ? "bg-white/15 text-white shadow-[0_10px_40px_rgba(59,130,246,0.35)] border-white/30"
                                        : "text-slate-300 hover:text-white hover:bg-white/10"
                                }`}
                            >
                                 <span className="flex items-center gap-3">
                                        {/* 文件圖示 icon（代表 行政自助服務） */}
                                     <FilePenLine size={18} className="text-slate-400" />
                                     {t("hrSelfService.title")}
                                    </span>
                            </Link>

                            <div className="flex-1 min-h-0 flex flex-col">
                                <button
                                    className="flex w-full items-center justify-between px-4 py-3 rounded-2xl text-sm text-slate-200 hover:bg-white/10 transition border border-transparent hover:border-white/5"
                                    // 切換 history 展開
                                    onClick={() => setHistoryExpanded(prev => !prev)}
                                >
                                    <span className="flex items-center gap-3">
                                        {/* 時間圖示 icon（代表歷史紀錄） */}
                                        <Clock size={18} className="text-slate-400" />
                                        {t("history.title")}
                                    </span>
                                    {/* 展開或收合圖示 */}
                                    {historyExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>

                                {/*只有在 client 掛載完成且展開時才 render 列表*/}
                                {mounted && historyExpanded && (
                                    <div
                                        ref={historyListRef}
                                        className="mt-3 flex-1 min-h-0 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
                                    >
                                        {/*如果沒有歷史顯示提示*/}
                                        {historyList.length === 0 && (
                                            <p className="text-xs text-slate-400 px-3 py-2 rounded-2xl bg-white/5 border border-white/5">
                                                {t("history.empty")}
                                            </p>
                                        )}

                                        {/*map 歷史項目*/}
                                        {historyList.map(history => {
                                            // 每筆歷史的路徑
                                            const href = `/dashboard/history/${history.id}`;
                                            // 判斷是否 active
                                            const active = normalizePath(pathname) === normalizePath(href);
                                            // 判斷此筆是否打開 menu
                                            const isMenuOpen = openMenuId === history.id;
                                            const isEditing = editingId === history.id;
                                            const isTitleLoading = titleLoadingIds.includes(history.id);
                                            const itemClasses = `block px-4 py-3 pr-12 min-h-10 rounded-2xl text-xs transition flex items-center ${
                                                active
                                                    ? "bg-white/15 text-white"
                                                    : "bg-transparent text-slate-300 hover:text-white hover:bg-white/10"
                                            } ${isEditing ? "ring-1 ring-inset ring-white/40 bg-white/20 text-white" : ""}`;
                                            const titleContent = isTitleLoading ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="inline-block h-2.5 w-16 rounded-full bg-white/50 animate-pulse" />
                                                    <span className="inline-block h-2.5 w-10 rounded-full bg-white/30 animate-pulse" />
                                                </span>
                                            ) : (
                                                truncateTitle(history.title)
                                            );
                                            return (
                                                <div key={history.id} className="relative group">
                                                    {isEditing ? (
                                                                <div className={itemClasses}>
                                                                    <input
                                                                        ref={isEditing ? renameInputRef : null}
                                                                        value={editingTitle}
                                                                        onChange={event => setEditingTitle(event.target.value)}
                                                                        onCompositionStart={() => setIsRenameComposing(true)}
                                                                        onCompositionEnd={() => setIsRenameComposing(false)}
                                                                        onBlur={commitRename}
                                                                        onKeyDown={event => {
                                                                            const composing =
                                                                                isRenameComposing ||
                                                                                event.nativeEvent.isComposing ||
                                                                                event.keyCode === 229;
                                                                            if (event.key === "Enter" && !composing) {
                                                                                event.preventDefault();
                                                                                commitRename();
                                                                            }
                                                                            if (event.key === "Escape") {
                                                                                event.preventDefault();
                                                                        cancelRenaming();
                                                                    }
                                                                }}
                                                                className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/60 text-xs"
                                                                aria-label={t("history.rename.aria")}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <Link href={href} className={itemClasses} aria-busy={isTitleLoading}>
                                                            {/* 顯示標題，超過截斷 */}
                                                            {titleContent}
                                                        </Link>
                                                    )}
                                                    <button
                                                        type="button"
                                                        aria-label={t("history.more")}
                                                        // 點擊開啟該歷史的選單
                                                        onClick={event => handleMenuToggle(event, history.id)}
                                                        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/70 transition ${
                                                            active || isMenuOpen
                                                                ? "opacity-100 pointer-events-auto bg-white/15"
                                                                : "opacity-0 pointer-events-none bg-black/30 group-hover:opacity-100 group-hover:pointer-events-auto"
                                                        } ${isEditing ? "opacity-100 pointer-events-none bg-white/20" : ""}`}
                                                        disabled={isEditing}
                                                    >
                                                        {/* 三個點 icon */}
                                                        <MoreHorizontal size={16} />
                                                    </button>
                                                    {/*若選單開啟且已掛載且有定位資訊*/}
                                                    {isMenuOpen && mounted && menuPosition &&
                                                        createPortal(
                                                            <div
                                                                className="fixed z-50 w-26 rounded-lg border border-white/60 bg-white/85 text-slate-900 backdrop-blur-lg p-2 shadow-2xl transform -translate-x-full"
                                                                style={{ top: menuPosition.top, left: menuPosition.left }}
                                                            >
                                                                <button
                                                                    type="button"
                                                                className="w-full text-center px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-200"
                                                                    onClick={event => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        startRenaming(history.id, history.title);
                                                                    }}
                                                                >
                                                                    {t("history.rename")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                className="w-full text-center px-3 py-1.5 rounded-lg text-xs text-slate-700 hover:bg-slate-200"
                                                                    onClick={event => {
                                                                        // 阻止連結或其他預設行為
                                                                        event.preventDefault();
                                                                        // 避免冒泡導致 menu 被關閉
                                                                        event.stopPropagation();
                                                                        // 關閉 menu 歷史紀錄的紀錄
                                                                        closeMenu();
                                                                        // 設定要分享的對話 id
                                                                        setSelectedChatId(history.id);
                                                                        // 打開二維碼彈窗
                                                                        setOpenShare(true);
                                                                    }}
                                                                >
                                                                    {t("history.share")}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                className="w-full text-center px-3 py-1.5 rounded-lg text-xs text-red-600 hover:bg-red-100"
                                                                    onClick={event => {
                                                                        // 阻止連結或其他預設行為
                                                                        event.preventDefault();
                                                                        // 避免冒泡導致 menu 被關閉
                                                                        event.stopPropagation();
                                                                        // 呼叫 removeHistory 刪除該歷史紀錄
                                                                        if (editingId === history.id) {
                                                                            cancelRenaming();
                                                                        }
                                                                        removeHistory(history.id);
                                                                        // 目前路徑
                                                                        const currentPath = normalizePath(pathname);
                                                                        // 被刪除項的路徑
                                                                        const deletedPath = normalizePath(`/dashboard/history/${history.id}`);
                                                                        // 如果目前正在查看被刪除的歷史
                                                                        if (currentPath === deletedPath) {
                                                                            // 導回 dashboard 主頁
                                                                            router.push("/dashboard");
                                                                        }
                                                                        // 關閉選單
                                                                        closeMenu();
                                                                    }}
                                                                >
                                                                    {t("history.delete")}
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
                            {/*點擊進入個人資料頁*/}
                            <Link
                                href="/dashboard/profile"
                                className="flex items-center gap-3 px-4 py-3 w-full rounded-2xl text-sm font-medium text-white bg-white/15 hover:bg-white/20 transition"
                            >
                                <img src="/pic-1.png" alt={t("common.userAvatarAlt")} className="w-8 h-8 rounded-full object-cover" />
                                <span>{storedUsername ?? t("profile.title")}</span>
                            </Link>
                        </div>
                    </GlassPanel>
                </aside>

                {/* 主內容區 */}
                <main className="flex-1 min-h-0 flex flex-col p-4 sm:p-7 gap-6 overflow-hidden">
                    {/*是否要顯示分享的二維碼*/}
                    { isOpenShare && selectedChatId != null && (
                        <ShareChatDialog
                            chatId={ selectedChatId }
                            onClose={() => setOpenShare(false)}
                        />
                    )}
                    {/* 內容外殼 */}
                    <GlassPanel className="flex-1 min-h-0 p-4 sm:p-8 overflow-hidden">
                        {/* 真正的頁面內容由 children 傳入 */}
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

// DashboardLayout 元件，用 HistoryProvider 包裹整個 DashboardContent
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <HistoryProvider>
            <DashboardContent>{children}</DashboardContent>
        </HistoryProvider>
    );
}
