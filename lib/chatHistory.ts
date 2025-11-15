export type Message = {
    role: "user" | "assistant";
    content: string;
};

export type ChatHistory = {
    id: string;
    title: string;
    messages: Message[];
};

// 新增或更新歷史紀錄
export const saveHistory = (messages: Message[], chatId?: string): string => {
    const prev: ChatHistory[] = JSON.parse(localStorage.getItem("chat-history") || "[]");

    if (chatId) {
        // 更新同一筆歷史
        const idx = prev.findIndex(h => h.id === chatId);
        if (idx >= 0) {
            prev[idx].messages = messages;
            prev[idx].title = messages[0]?.content || "新對話";
            localStorage.setItem("chat-history", JSON.stringify(prev));
            return chatId;
        }
    }

    // 新對話
    const newId = Date.now().toString();
    const history: ChatHistory = {
        id: newId,
        title: messages[0]?.content || "新對話",
        messages,
    };
    localStorage.setItem("chat-history", JSON.stringify([history, ...prev]));
    return newId;
};

// 讀取所有歷史
export const getHistoryList = (): ChatHistory[] => {
    return JSON.parse(localStorage.getItem("chat-history") || "[]");
};

// 根據 chatId 讀取單個歷史
export const getChatById = (chatId: string): ChatHistory | null => {
    const list = getHistoryList();
    return list.find(h => h.id === chatId) || null;
};
