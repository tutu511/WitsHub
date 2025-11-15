// app/dashboard/context/historyContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { ChatHistory, getHistoryList, saveHistory } from "@/lib/chatHistory";
import { Message } from "@/lib/chatHistory";

type HistoryContextType = {
    historyList: ChatHistory[];
    refreshHistory: () => void;
    addHistory: (messages: Message[]) => string; // 返回 chatId
};

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
    const [historyList, setHistoryList] = useState<ChatHistory[]>(getHistoryList());

    const refreshHistory = () => {
        setHistoryList(getHistoryList());
    };

    const addHistory = (messages: Message[]) => {
        const chatId = saveHistory(messages); // saveHistory 會生成新的 chatId 並存 localStorage
        refreshHistory();
        return chatId;
    };

    return (
        <HistoryContext.Provider value={{ historyList, refreshHistory, addHistory }}>
            {children}
        </HistoryContext.Provider>
    );
};

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) throw new Error("useHistory must be used within a HistoryProvider");
    return context;
};
