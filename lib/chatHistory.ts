"use client";
/**
 * 對話信息
 * 訊息角色：只有 "user" 或 "robot"
 * 訊息內容：純文字
 */
export type Message = {
    role: "user" | "robot";
    content: string;
};

/**
 * 對話的歷史紀錄
 * id：對話紀錄的唯一 ID
 * title：對話的標題
 * messages：這筆對話的訊息陣列
 */
export type ChatHistory = {
    id: string;
    title: string;
    messages: Message[];
};

// 新增或更新歷史紀錄
export const saveHistory = (messages: Message[], chatId?: string): string => {
    /**
     * 從 localStorage 讀出 key 為 "chat-history" 的值並 parse 成陣列
     * 如果 localStorage 中沒有該 key，使用 "[]" 作為 fallback，確保 parse 後為空陣列
     * 最終把結果指定給 prev（當作目前已存在的歷史清單）
     *
     * 到時候要模擬多個用戶，可以考慮把 key 值，改成 chat-history-用戶的唯一id
     *
     * localStorage 的數據，可以從 Chrome → F12 → Application → LocalStorage 這裡看到
     */
    const prev: ChatHistory[] = JSON.parse(localStorage.getItem("chat-history") || "[]");

    // 如果有傳入 chatId，代表要更新既有的一筆歷史（而非新增）
    if (chatId) {
        // 更新同一筆歷史，在 prev 中找出 id 符合 chatId 的索引
        const idx = prev.findIndex(h => h.id === chatId);
        if (idx >= 0) {
            // 將該筆歷史的 messages 更新為傳入的 messages
            prev[idx].messages = messages;
            // 同步更新該筆的 title：取 messages 第一筆的 content（若不存在則用 "新對話"）
            prev[idx].title = messages[0]?.content || "新對話";
            // 把修改後的 prev（整個陣列）序列化回 localStorage，覆寫原來的資料
            localStorage.setItem("chat-history", JSON.stringify(prev));
            // 回傳同一個 chatId（表示更新完畢）
            return chatId;
        }
    }

    // 新對話：如果沒有 chatId（或找不到該 chatId），執行「新增」流程
    const newId = Date.now().toString();
    /**
     *  用 timestamp 當作新的 id（簡單且通常足夠唯一），轉為字串
     *  建立一筆新的 ChatHistory 物件，title 同樣取第一條訊息內容或預設文字
     */
    const history: ChatHistory = {
        id: newId,
        title: messages[0]?.content || "新對話",
        messages,
    };
    // 將新的 history 放在陣列開頭（代表最新），然後與 prev 合併成新的陣列，序列化後寫回 localStorage
    localStorage.setItem("chat-history", JSON.stringify([history, ...prev]));
    return newId;
};

// 讀取所有歷史
export const getHistoryList = (): ChatHistory[] => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
        // server side 或測試環境 fallback
        return [];
    }
    // 讀取 localStorage 並 parse，若不存在則回傳空陣列
    return JSON.parse(localStorage.getItem("chat-history") || "[]");
};

// 根據 chatId 讀取單個歷史
export const getChatById = (chatId: string | Array<string>): ChatHistory | null => {
    // 從整份歷史中找出 id 符合的項目，找不到回傳 null
    const list = getHistoryList();
    return list.find(h => h.id === chatId) || null;
};
