"use client";

// 關閉彈窗的 icon
import { X } from "lucide-react";
// 匯入 React 的基本 Hook
import {useEffect, useState} from "react";
// 根據 chatId 獲取歷史紀錄
import { getChatById } from "@/lib/chatHistory";
// 新增/更新到 Firestore 的 db
import { saveChatToFirestore } from "@/lib/firebase";
/**
 * qrcode 二維碼
 * 二維碼掃到是網址（https://tutu511.github.io/WitsHub/share/chat.html）
 *
 */
import QRCode from "react-qr-code";
import {getPersonName} from "@/lib/user";

// 傳入聊天的 id
type ShareChatDialogProps = {
    chatId: string;
    onClose: () => void;
};

export function ShareChatDialog({ chatId, onClose }: ShareChatDialogProps) {
    // 儲存要生成 QR 的 URL
    const [shareUrl, setShareUrl] = useState("");
    // 獲取當前登錄的用戶(從 localStorage 取得 username)
    const personId = getPersonName();

    // 處理分享聊天的事件
    const handleShare = async () => {
        if (!chatId || Array.isArray(chatId)) return;

        // 根據 chatId 獲取歷史紀錄
        const chat = getChatById(chatId);
        if (!chat) return;

        // 將 messages 格式化成純文字陣列
        const messagesText = chat.messages.map(m =>
            `${m.role === "user" ? "user" : "robot"}：${m.content}`
        );

        // 儲存到 Firestore
        await saveChatToFirestore(chatId, messagesText, chat.title, personId || "訪客");

        // 生成分享 URL，這裡用 GitHub Pages 頁面
        setShareUrl(`https://tutu511.github.io/WitsHub/share/chat.html?id=${chatId}`);
    };

    useEffect(() => {
        handleShare();
    },[])

    return (
        <>
            {/* QR Code Modal */}
            {shareUrl && <div className="fixed inset-0 bg-black/20 grid place-items-center z-50">
                <div className="relative bg-white rounded-xl p-10 flex flex-col items-center space-y-4 w-[300px]">
                    <button
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                        onClick={onClose} >
                        <X size={20} />
                    </button>
                    <QRCode value={shareUrl} size={200} />
                </div>
            </div>
            }
        </>
    );
}

