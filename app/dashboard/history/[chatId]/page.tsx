"use client";

// 匯入 React 的基本 Hook
import { useState, useRef, useEffect } from "react";
// useParams 用來取得動態路由參數
import { useParams } from "next/navigation";
// 匯入圖示
import {SendHorizontal, Pause, Ban} from "lucide-react";
// 匯入 chatHistory 方法與型別
import { getChatById, saveHistory, Message } from "@/lib/chatHistory";
// 多語系
import { useI18n } from "@/components/i18n-provider";
import VoiceTransformText from "@/components/voiceTransformText";
// api：機器人回覆
import {apiService, RobotResponse} from "@/lib/api";
// api：向機器人提問
import { ChatQuestionRequest } from "@/lib/api";
// 獲取用戶 id（員工編號）
import {getPersonId} from "@/lib/user";
// 獲取風格
import { getReplyPreference } from "@/lib/preference";
import {ChatToolbar} from "@/components/chatToolbar";
import {CHAT_IMAGE_URL} from "@/lib/config";

// 定義 ChatPage 元件
export default function ChatPage() {
    // 多語系，自動對應
    const { t } = useI18n();
    // 取得動態路由參數 chatId，歷史紀錄中對應的 id
    const { chatId } = useParams();

    // 狀態：訊息列表
    const [messages, setMessages] = useState<Message[]>([]);
    // 狀態：輸入框文字
    const [input, setInput] = useState("");
    // 狀態：注音是否在拼寫中
    const [isComposing, setIsComposing] = useState(false);
    // 狀態：機器人是否正在「打字」
    const [isTyping, setIsTyping] = useState(false);
    // 用 useRef 追蹤最新值，不受 React state 異步更新的影響，狀態更新不夠即時
    const isThinkingRef = useRef(false);
    // 狀態：機器人是否正在「思考中」（等回覆中）
    const [isThinking, setIsThinking] = useState(false);

    /**
     * 打字機效果，用於保存 setInterval ID，以便停止打字時清除 interval
     *
     * useRef 是 React 的 Hook，用來儲存「可變的值」，不會觸發重新渲染
     * typingInterval.current 的型別是 NodeJS.Timeout | null：
     *   NodeJS.Timeout：Node.js 環境下 setInterval() 回傳的型別
     *   null：還沒設定 interval 時的初始值
     */
    const typingInterval = useRef<NodeJS.Timeout | null>(null);
    // ref：指向訊息列表容器，讓滾動侷限在該區域
    const messagesContainerRef = useRef<HTMLDivElement | null>(null);
    // 語音是否正在識別
    const [isListening, setIsListening] = useState(false);

    // 滾動到訊息最底部
    const scrollToBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
        });
    };

    // 設定最新值：機器人是否在思考
    const setThinking = (val: boolean) => {
        isThinkingRef.current = val;
        setIsThinking(val);
    };

    // 當 messages 每次更新時，執行 scrollToBottom 自動滾動到底部
    useEffect(() => { scrollToBottom(); }, [messages]);

    // 初始化：載入此 chatId 的歷史聊天紀錄, deps: chatId 改變重新載入
    useEffect(() => {
        // 若沒有 chatId，直接跳出
        if (!chatId || Array.isArray(chatId)) return;
        // 從 localStorage 取資料
        const chat = getChatById(chatId);
        // 沒資料就不用載入
        if (!chat) return;

        // 載入歷史訊息到畫面
        setMessages(chat.messages);

        // 取得最後一筆訊息
        const lastMsg = chat.messages[chat.messages.length - 1];
        // 若最後一筆是 robot 且 content 還是空字串 → 表示之前打字還沒完成 or 代表這是新創建的對話
        if (lastMsg?.role === "robot" && lastMsg.content === "") {
            // 找到 user 的訊息
            const userMsg = chat.messages[chat.messages.length - 2];
            if (userMsg) {
                // 計算機器人訊息的 index，append 在最後一筆，因此 index 是 newList.length - 1
                const botIndex = chat.messages.length - 1;
                // 開始機器人回覆的流程
                handleBotFlow(userMsg.content, botIndex, chatId);
            }
        }
    }, [chatId]);

    /**
     * 更新對話訊息內容【已開始思考後的情境，需要對已有的對話資訊進行操作】
     * 1. 機器人回覆模擬打字效果，打字結束後在顯示圖片，最後儲存最新的聊天記錄
     *    indexToUpdate: 需要更新的那筆 robot 資訊
     *    text：機器人回覆的全內容
     *    sliceIndex：需要截止到的位置（模擬打字效果）
     *    img：機器人回覆的圖片
     *    chatIdToSave：需要保存的 chatId
     *    isNeedType：是否需要打字輸出的效果
     *
     * 2. 用戶中途停止：
     *    若停止(不管是思考中 or 打字中)時，最後一筆 robot 訊息是空的
     *       → 補上提示訊息： 用戶已終止生成，請重新再次提出問題！！
     *    若停止（打字中）時，最後一筆 robot 訊息是有一半內容的
     *       → 目前打到一半的內容進行保存
     */
    function updateMessages(indexToUpdate: number, text: string, sliceIndex: number, img: string, chatIdToSave: string, isNeedType: boolean) {
        // 更新畫面上的 messages
        setMessages(prev => {
            // 複製 messages 陣列（避免直接修改）
            const newList = [...prev];
            // 找到要更新的那筆 robot 訊息
            const msg = newList[indexToUpdate];
            // 是否需要打字的效果
            if (isNeedType) {
                // 將內容更新成前 i 個字，模擬一個一個字出現的效果
                newList[indexToUpdate] = { ...msg, content: text.slice(0, sliceIndex), img: ""};

                // 當字全部輸出完後，儲存最新的聊天記錄
                if (sliceIndex === text.length) {
                    // 如果有圖片的話，要等文字都輸出後，再顯示在底部
                    if (img != "") {
                        newList[indexToUpdate] = { ...msg, content: text, img};
                    }
                    // 存入 localStorage
                    saveHistory(newList, chatIdToSave);
                }
            } else {
                // 用戶中途停止，要更新 robot 的回覆
                if (msg && msg.role === "robot") {
                    // 最後一筆 robot 訊息是空的,補上提示訊息
                    if (msg.content === "") {
                        newList[newList.length - 1] = {
                            ...msg,
                            content: text,
                            img: ""
                        };
                    }
                    // 存入 localStorage
                    saveHistory(newList, chatIdToSave);
                }
            }

            // 回傳新 messages
            return newList;
        });

    }

    /**
     * 打字機效果，模擬 robot 一個字一個字輸出
     * text: 機器人要輸出的完整文字
     * indexToUpdate: 要更新的訊息 index（通常是最後一筆 robot）
     * chatIdToSave: 要儲存的 chatId
     */
    const typeWriter = (text: string, img: string, indexToUpdate: number, chatIdToSave: string) => {
        // return Promise 在打字完成後可 await
        return new Promise<void>((resolve) => {
            // 先清除舊的 interval
            if (typingInterval.current != null) {
                clearInterval(typingInterval.current!);
                // 設為 null
                typingInterval.current = null;
            }
            // 目前（機器人回覆）輸出的文字位置 index
            let i = 0;
            // 啟動 interval，每 40ms 輸出一個字
            typingInterval.current = setInterval(() => {
                // 文字位置：每次增加 1
                i++;

                // 更新畫面上的 messages，需要機器人打字的效果
                updateMessages(indexToUpdate, text, i, img, chatIdToSave, true)

                // 若已輸出全部文字
                if (i >= text.length) {
                    // 清除 interval
                    if (typingInterval.current != null) {
                        clearInterval(typingInterval.current!);
                        // 設為 null
                        typingInterval.current = null;
                    }
                    // 結束 Promise
                    resolve();
                }
            }, 40);
        });
    };

    /**
     *  停止機器人回覆
     *  第一種：停止思考效果
     *  第二種：停止打字效果（使用者按停止按鈕 or 輸入完畢）
     */
    const stopThinkingOrTyping = () => {
        // 設定 robot 不再思考（不接受 api 回覆的內容）
        setThinking(false);

        // 停止計時器
        if (typingInterval.current != null) {
            clearInterval(typingInterval.current!);
            typingInterval.current = null;
        }
        // 設定 robot 不再打字
        setIsTyping(false);

        /**
         * 若停止(不管是思考中 or 打字中)時，最後一筆 robot 訊息是空的
         *   → 補上提示訊息： 用戶已終止生成，請重新再次提出問題！！
         *
         * 若停止（打字中）時，最後一筆 robot 訊息是有一半內容的
         *   → 目前打到一半的內容進行保存
         */
        // 若沒有 chatId，直接跳出
        if (!chatId || Array.isArray(chatId)) return
        // 計算機器人訊息的 index，終止的是最後一筆
        const botIndex = messages.length -1 ;
        updateMessages(botIndex, t("chat.stop"), 0, "", chatId, false)

    };

    /**
     * 封裝機器人回覆流程：【剛進入歷史紀錄對話框 & 用戶點擊送出】
     * 1. 呼叫 API
     * 2. 若是點擊暫停而已停止思考，那就直接終止
     * 3. 若是正常得到機器人回覆，那就停止思考
     * 4. 開始打字效果
     */
    async function handleBotFlow(
        userInput: string,
        botIndex: number,
        chatId: string
    ) {
        // 如果機器人已經在思考中了，就不允許重複呼叫 api
        if (isThinkingRef.current) return;

        // robot 開始思考，代表要打 api
        setThinking(true);
        // 呼叫 API
        const botReply = await handleRobotResponse(userInput, chatId);

        // 終止：若使用者中途按了停止，就不執行後面的打字
        if (!isThinkingRef.current) return;

        // 停止思考
        setThinking(false);
        // 開始打字
        setIsTyping(true);

        // 開始打字機效果
        await typeWriter(botReply.output, botReply.img || "", botIndex, chatId);
        // 打字結束
        setIsTyping(false);
    }

    // sendMessage：當 user 點擊送出或按下 Enter 時執行
    const sendMessage = () => {
        // 若輸入空白或正在打字則忽略
        if (!input.trim() || !chatId || isTyping || Array.isArray(chatId)) return;

        // 去除前後空白
        const userInput = input.trim();
        // 送出後，可清空輸入框
        setInput("");

        // 新增 user 訊息 + 空白 robot 訊息
        setMessages(prev => {
            // 新增 user 訊息
            const newList: Message[] = [
                ...prev,
                { role: "user", content: userInput, img: "" },
                { role: "robot", content: "", img: "" }
            ];
            // 計算機器人訊息的 index，append 在最後一筆，因此 index 是 newList.length - 1
            const botIndex = newList.length - 1;

            // 儲存聊天紀錄
            saveHistory(newList, chatId);

            // 開始機器人回覆的流程
            handleBotFlow(userInput, botIndex, chatId)

            // 更新畫面
            return newList;
        });
    };

    // 清除某一次的機器人回覆的紀錄
    function handleRemoveRobotResponse(removeIndex: number) {
        // 若沒有 chatId，直接跳出
        if (!chatId || Array.isArray(chatId)) return;

        // 清空對應 robot 訊息內容
        setMessages(prev => {
            const newList = [...prev];
            newList[removeIndex] = { ...newList[removeIndex], content: "", img: "" };
            saveHistory(newList, chatId);
            return newList;
        });
    }

    // api：機器人回覆
    async function handleRobotResponse(userInput: string, chatId: string): Promise<RobotResponse>{
        // 獲取當前登錄的用戶(從 localStorage 取得員工編號)
        const personId = getPersonId();

        /**
         * chatinput：使用者的問題
         * empId：從 localStorage 取得員工編號
         * chatId：對話 id 用來給 agent 存 memory
         * prompt：風格定義
         */
        const request: ChatQuestionRequest = {
            chatinput: userInput,
            empId: personId,
            chatId: chatId,
            prompt: getReplyPreference(personId),
        };
        const robotResponse = await apiService.fetchRobotResponse(request);
        if (robotResponse.output) {
            return robotResponse
        } else {
            return { output: t("chat.error"), img: ""}
        }
    }

    return (
        // 外層容器：垂直排列，填滿高度
        <div className="flex flex-col h-full">
            {/* 訊息列表區塊 */}
            <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl"
            >
                {/* 將 messages 每一筆渲染成聊天泡泡 */}
                {messages.map((m, i) => {
                    const isUser = m.role === "user";
                    return (
                        <div key={i} className={`flex items-start gap-3 ${isUser 
                            ? "flex-row-reverse" 
                            : ""}`}>
                            {/* 頭像區 */}
                            <div
                                className={`flex items-center justify-center rounded-full w-10 h-10 overflow-hidden ${
                                    isUser ? "border border-white/30 bg-white/10" : "border border-white/20 bg-white/10"
                                }`}
                            >
                                {isUser ? (
                                    <img src="/pic-1.png" alt={t("common.userAvatarAlt")} className="w-full h-full object-cover" />
                                ) : (
                                    <img src="/pic-wits.png" alt="WitsHub" className="w-full h-full object-cover" />
                                )}
                            </div>

                            {/* 外層：垂直排列「訊息泡泡 + 底部工具欄」 */}
                            <div className="group flex flex-col gap-1" style={{ maxWidth: "66%" }}>
                                {/* 訊息內容泡泡 */}
                                <div
                                    className={`rounded-xl text-sm whitespace-pre-line break-words ${
                                        isUser ? "p-3 bg-white/20 text-white shadow-sm" : "p-2 bg-transparent text-white"
                                    }`}
                                >
                                    {isUser ? (
                                        m.content
                                    ) : (
                                        <>
                                            {(isThinking && !m.content) ? (
                                                // 機器人訊息尚未產生 → 顯示 loading dots
                                                <span className="flex items-center gap-1 relative top-1">
                                                 <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-0"></span>
                                                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-200"></span>
                                                <span className="w-2 h-2 bg-white rounded-full animate-bounce delay-400"></span>
                                            </span>
                                            ) : (
                                                <>
                                                    {/* 先顯示文字 */}
                                                    <div>{m.content}</div>

                                                    {/* 若有圖片，顯示在下面 */}
                                                    {m.img && (
                                                        <img
                                                            src={ m.img.startsWith(CHAT_IMAGE_URL)
                                                                ? m.img
                                                                : `/robot-images/${m.img}`}
                                                            alt="robot response"
                                                            className="mt-3 max-w-full"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* 底部工具欄 */}
                                <ChatToolbar
                                    isUser={isUser}
                                    index={i}
                                    isLastUserMessage={isUser && i == (messages.length - 2)}
                                    isLastRobotMessage={!isUser && i == (messages.length - 1)}
                                    content={m.content}
                                    isDisableGenerate={isThinking || isTyping}
                                    onRegenerate={(removeIndex) => {
                                        handleRemoveRobotResponse(removeIndex);

                                        // 取得對應 user 訊息
                                        const userMsg = messages[removeIndex - 1];
                                        if (userMsg && chatId && !Array.isArray(chatId)) {
                                            handleBotFlow(userMsg.content, removeIndex, chatId);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* 下方輸入框 + 送出按鈕 */}
            <div className="mt-4 flex gap-2">
                {/* 語音轉文字按鈕 */}
                <VoiceTransformText
                    onResult={
                        (voiceText) => {
                            setInput((prev) => prev + voiceText)
                        }}
                    onListeningChange={
                        (isListening) => {
                            // 語音是否正在識別中，若為 true ，發送按鈕事件需禁止
                            setIsListening(isListening)
                        }
                    }
                />
                <input
                    // 輸入框的值
                    value={input}
                    // 更新 input state
                    onChange={e => setInput(e.target.value)}
                    onCompositionStart={() => setIsComposing(true)}
                    onCompositionEnd={() => setIsComposing(false)}
                    // 按 Enter 送出
                    onKeyDown={e => {
                        const composing =
                            isComposing ||
                            e.nativeEvent.isComposing ||
                            e.keyCode === 229;
                        if (e.key === "Enter" && !composing && !isTyping) {
                            sendMessage();
                        }
                    }}
                    // 提示文字
                    placeholder={
                        isListening
                            ? t("chat.placeholder.disabled")
                            : t("chat.placeholder")
                    }
                    className="flex-1 rounded-xl border border-white/30 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-colors"
                    disabled={isListening}
                />
                {/* 送出 / 停止按鈕 */}
                <button
                    onClick={isTyping || isThinking ? stopThinkingOrTyping : sendMessage}
                    className={`px-6 py-2 rounded-xl text-sm flex items-center justify-center border border-white/30 text-white transition ${
                        isTyping ? "bg-white/10 hover:bg-white/20" : "bg-white/20 hover:bg-white/30"
                    }`}
                    // 語音不能正在識別中
                    disabled={isListening}
                >
                    { isTyping || isThinking
                        ? (<Pause size={20} />)
                        : ( isListening
                            // 錄音中 → 顯示禁止 icon
                            ? <Ban size={20} />
                            // 平常 → 顯示發送 icon
                            : <SendHorizontal size={20} />)
                    }
                </button>
            </div>
        </div>
    );
}
