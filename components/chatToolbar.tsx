// 對話訊息底部的工具欄
"use client";

// 關閉彈窗的 icon
import { Copy, RefreshCw, RefreshCwOff, SquareCheckBig } from "lucide-react";
// 狀態
import { useState } from "react";

interface ChatToolbarProps {
    isUser: boolean;
    index: number;
    isLastUserMessage: boolean;
    isLastRobotMessage: boolean;
    content: string;
    isDisableGenerate: boolean;
    onRegenerate: (index: number) => void;
}

/**
 *
 * isUser：是否是用戶
 * index：目前是第幾個資訊
 * isLastUserMessage：是否是最後一個用戶的資訊
 * onRegenerate：再次生成的事件
 *
 * 狀態：
 *   永遠顯示：機器人的回覆 + 使用者最後一個問題
 *   hover 顯示：使用者的問題（除了最後一筆例外顯示）
 */
export function ChatToolbar({isUser, index, isLastUserMessage, isLastRobotMessage, content, isDisableGenerate, onRegenerate}: ChatToolbarProps) {
    // 是否複製成功
    const [isCopySuccess, setIsCopySuccess] = useState(false);
    // 永遠顯示的條件
    const shouldAlwaysShow = !isUser || isLastUserMessage;

    // group-hover: 不是自己 hover，而是父層 hover 才會觸發
    const visibilityClass = shouldAlwaysShow
        ? "opacity-100"
        : "opacity-0 group-hover:opacity-100";

    // 處理複製事件
    function handleCopy() {
        // 把文字寫入系統剪貼簿
        navigator.clipboard.writeText(content)
            .then(r => {
                // 切換一下複製 icon -> 複製成功（打勾）
                setIsCopySuccess(true);
                // 1.2 秒後自動恢復成複製 icon
                setTimeout(() => {
                    setIsCopySuccess(false);
                }, 1200);
            }
        )
    }

    return (
        <div
            className={`flex gap-4 mt-0.5 transition-opacity duration-150 ${visibilityClass} ${
                isUser ? "justify-end mr-2" : "justify-start ml-3"
            }`}
        >
            {/* 複製 */}
            <button
                onClick={ handleCopy }
                className="flex items-center gap-1 text-white/70 hover:text-white text-xs"
                title="複製"
            >
                {isCopySuccess
                    ? <SquareCheckBig size={15} className="transition-opacity duration-200" />
                    : <Copy size={15} className="transition-opacity duration-200" /> }
            </button>

            {!isUser && isLastRobotMessage &&
                // 機器人訊息 → 重新生成
                <button
                    onClick={() => onRegenerate(index)}
                    className="flex items-center gap-1 text-white/70 hover:text-white text-xs"
                    title="重新生成"
                    disabled={isDisableGenerate}
                >
                    { isDisableGenerate ?  <RefreshCwOff size={15} /> : <RefreshCw size={15} /> }
                </button>
            }
        </div>
    );
}
