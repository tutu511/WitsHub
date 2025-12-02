import { CHAT_API_URL } from "@/lib/config";
import { translate } from "@/lib/i18n";

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

class ApiService {
    /**
     * 對話標題
     * 根據聊天的問題，回覆適合的標題
     */
    async fetchChatTitle(question: string) {
        try {
            const response = await fetch(CHAT_API_URL + "generate-chat-title", {
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
            const response = await fetch(CHAT_API_URL + "wits_hub", {
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
}

export const apiService = new ApiService()
