import { translate } from "@/lib/i18n";
import {BASE_API_URL} from "@/lib/config";

// 機器人回答 api：request
export interface ChatQuestionRequest {
    chatinput: string;
    empId: string;
    chatId: string;
    prompt: string;
}

/**
 * 機器人回答 api：Response
 * output：文本
 * img：若有圖片則會出現此欄位
 */

export interface RobotResponse {
    output: string;
    img?: string;
}

/**
 * 機器人回答 api：Response
 * digest_text_tw：新知（中文）
 * digest_text_en：新知（英文）
 * ai_questions_tw：問題（中文）
 * ai_questions_en：問題（英文）
 */
export interface AINewsResponse {
    digest_text_tw: digestText[];
    digest_text_en: digestText[];
    ai_questions_tw: string[];
    ai_questions_en: string[];
}

/**
 * digest_text 物件
 * text：新聞內容
 * url：網址
 */
export type digestText = {
    text: string;
    url: string;
};

class ApiService {
    /**
     * 對話標題
     * 根據聊天的問題，回覆適合的標題
     */
    async fetchChatTitle(question: string) {
        try {
            const response = await fetch(BASE_API_URL + "generate-chat-title", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) {
                throw new Error(`Failed with status ${response.status}`);
            }

            const data = await response.json();
            const output = typeof data?.output === "string" ? data.output.trim() : "";
            return { title: output || question, success: true };
        } catch (error) {
            console.error("generate-chat-title error:", error);
            return { title: question, success: false };
        }
    }

    /**
     * 機器人回覆
     * chatinput: 使用者的問題
     * empId: 員工編號
     * chatId: 聊天對話 id
     * prompt: 風格
     */
    async fetchRobotResponse(request: ChatQuestionRequest): Promise<RobotResponse> {
        try {
            const response = await fetch(BASE_API_URL + "wits_hub", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`Failed with status ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error("wits_hub error:", error);
            return {
                output: translate("common.busy"),
            };
        }
    }

    /**
     * 獲取 AI 新知（週報）
     */
    async fetchAINews(): Promise<AINewsResponse> {
        try {
            const response = await fetch(BASE_API_URL + "ai_digest", {
                method: "Get",
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!response.ok) {
                throw new Error(`Failed with status ${response.status}`);
            }

            return response.json();

        } catch (error) {
            console.error("wits_hub error:", error);
            return {digest_text_tw: [], digest_text_en: [], ai_questions_tw: [], ai_questions_en: []};
        }
    }
}

export const apiService = new ApiService()
