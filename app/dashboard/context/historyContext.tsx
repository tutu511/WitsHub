"use client";

/**
 * 從 React 匯入 createContext（建立 context）
 *   useContext（使用 context）、useState（狀態Hook）
 *   ReactNode（描述 children 可接受的型別）
 */
import { createContext, useContext, useState, ReactNode } from "react";
/**
 * 從 chatHistory 工具檔案匯入：
 *   ChatHistory（歷史紀錄的型別）
 *   getHistoryList（從 localStorage 取得全部歷史）
 *   saveHistory（將歷史寫回 localStorage，更新 or 新增）
 */
import { ChatHistory, getHistoryList, saveHistory, deleteHistory, renameHistoryTitle } from "@/lib/chatHistory";
// 引入類型（或介面）Message，用來定義訊息資料結構
import { Message } from "@/lib/chatHistory";

/**
 * historyList：目前所有的聊天歷史列表（陣列）
 * refreshHistory：重新從 localStorage 讀取資料並更新 UI
 * addHistory：新增一筆歷史，傳入 messages，回傳 chatId
 */
type HistoryContextType = {
    historyList: ChatHistory[];
    refreshHistory: () => void;
    addHistory: (messages: Message[], options?: { isTitlePending?: boolean }) => string;
    removeHistory: (historyId: string) => void;
    renameHistory: (historyId: string, title: string) => void;
    titleLoadingIds: string[];
    markTitleLoading: (historyId: string) => void;
    clearTitleLoading: (historyId: string) => void;
};

// 建立 Context，預設值為 undefined（若使用者忘記用 Provider 包起來會報錯）
const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

/**
 * 建立 Provider 元件，包覆整個應用中需要共用聊天歷史的部分
 * children 型別為 ReactNode（React 任何合法元素）
 */
export const HistoryProvider = ({ children }: { children: ReactNode }) => {
    // 宣告一個狀態 historyList，用來儲存所有歷史，初始值為 getHistoryList() 從 localStorage 取出的內容
    const [historyList, setHistoryList] = useState<ChatHistory[]>(getHistoryList());
    // 哪些對話正在生成標題
    const [titleLoadingIds, setTitleLoadingIds] = useState<string[]>([]);

    const markTitleLoading = (historyId: string) => {
        setTitleLoadingIds(prev => (prev.includes(historyId) ? prev : [...prev, historyId]));
    };

    const clearTitleLoading = (historyId: string) => {
        setTitleLoadingIds(prev => prev.filter(id => id !== historyId));
    };

    // 再次讀取 localStorage，並同步到 state，讓 UI 重新渲染
    const refreshHistory = () => {
        setHistoryList(getHistoryList());
    };

    /**
     * 新建一筆紀錄：呼叫 saveHistory 將 messages 寫入 localStorage
     *
     * 新對話 - 點擊發送 - 要新增一筆紀錄到 localStorage - 刷新歷史紀錄的列表 - 根據 chatId 跳轉到對應的對話頁面
     */
    const addHistory = (messages: Message[], options?: { isTitlePending?: boolean }) => {
        // saveHistory 會回傳新建立的 chatId，並存 localStorage
        const chatId = saveHistory(messages);
        // 新增完後重新同步 historyList 到 UI
        refreshHistory();
        if (options?.isTitlePending) {
            markTitleLoading(chatId);
        }
        return chatId;
    };


    const removeHistory = (historyId: string) => {
        deleteHistory(historyId);
        clearTitleLoading(historyId);
        refreshHistory();
    };

    const renameHistory = (historyId: string, title: string) => {
        renameHistoryTitle(historyId, title);
        clearTitleLoading(historyId);
        refreshHistory();
    };

    return (
        // 用 Provider 包住 children 讓子元件能取得 context 值
        <HistoryContext.Provider
            value={{
                historyList,
                refreshHistory,
                addHistory,
                removeHistory,
                renameHistory,
                titleLoadingIds,
                markTitleLoading,
                clearTitleLoading
            }}
        >
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = () => {
    // 透過 useContext 拿到目前的 Context 值
    const context = useContext(HistoryContext);
    // 如果 context 是 undefined，代表這個 hook 並沒有在 Provider 內使用，丟出錯誤提醒
    if (!context) throw new Error("useHistory must be used within a HistoryProvider");
    // 回傳 context（裡面有 historyList、refreshHistory、addHistory）
    return context;
};
