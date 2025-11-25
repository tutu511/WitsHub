// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import {getFirestore, collection, addDoc, doc, setDoc} from "firebase/firestore";
import {firebaseConfig, SHARE_HISTORY_KEY} from "./config";

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);

/**
 * 儲存聊天內容到 Firestore
 * （新增/更新）
 *
 * @param messages 聊天訊息，每筆格式為 "用戶：xxx" / "機器人：xxx"
 * @param title 聊天標題
 * @param creatorName 分享人名稱
 * @param chatId 對應 localStorage 的 chatId
 */
export const saveChatToFirestore = async (
    chatId: string,
    messages: string[],
    title: string,
    creatorName: string
) => {
    // 用 chatId 當 document ID
    const docRef = doc(db, SHARE_HISTORY_KEY, chatId);
    await setDoc(docRef, {
        id: chatId,
        message: messages,
        title: title,
        creator_name: creatorName,
    },
        // merge: true 表示若 document 已存在，只更新指定欄位
        { merge: true });
    return chatId;
};
