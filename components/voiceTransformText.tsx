"use client";

import { useState } from "react";
// 對 Web Speech API（SpeechRecognition） 的「React 封裝」
import SpeechRecognition, {
    useSpeechRecognition
} from "react-speech-recognition";
// icons
import { Mic, X, Check } from "lucide-react";

interface VoiceTransformTextProps {
    // 父層接收語音結果
    onResult: (text: string) => void;
    // 回傳目前是否正在錄音（true/false）
    onListeningChange: (isListening: boolean) => void;
}

export default function VoiceTransformText({ onResult, onListeningChange }: VoiceTransformTextProps) {
    // 是否正在錄音（控制 UI）
    const [isRecording, setIsRecording] = useState(false);

    /**
     * react-speech-recognition 提供的 Hook
     * transcript        → 已輸出的最終文字（會累加）
     * interimTranscript → 語音中的即時暫存文字（每次講話都會更新）
     * resetTranscript   → 清空 transcript
     * listening         → 是否正在辨識中
     */
    const {
        transcript,
        interimTranscript,
        resetTranscript,
        listening,
    } = useSpeechRecognition();

    // 開始錄音
    const startRecording = async () => {
        // 通知父層：開始錄音
        onListeningChange(true);
        // UI 切換：開始錄音
        setIsRecording(true);
        // 錄音前將清空之前的暫存
        resetTranscript();
        /**
         * continuous：持續辨識（Chrome OK，Safari 會有限制）
         * language：語言，優先識別中文，若你用的是
         */
        await SpeechRecognition.startListening({
            continuous: true,
            language: "zh-TW",
        });
    };

    // 停止錄音並送出結果（按 ✔）
    const stopAndSend = async () => {
        // 結束錄音
        setIsRecording(false);
        // 停止 Web Speech
        await SpeechRecognition.stopListening();

        const finalText =
            interimTranscript.trim() || transcript.trim();

        if (finalText !== "") {
            // 回傳給父層
            onResult(finalText);
        }

        // 通知父層：結束錄音
        onListeningChange(false);

        // 清空暫存
        resetTranscript();
    };

    // 取消錄音（按 ✖）
    const cancelRecording = async () => {
        // UI：結束錄音
        setIsRecording(false);
        // 停止語音
        await SpeechRecognition.stopListening();
        // 通知父層：結束錄音
        onListeningChange(false);
        // 清空暫存
        resetTranscript();
    };

    return (
        <div className="flex items-center gap-3">

            {/* 未錄音 → 顯示麥克風 */}
            {!isRecording && (
                <button
                    onClick={startRecording}
                    className="p-2 rounded-full hover:bg-white/30"
                    aria-label="start voice input"
                >
                    <Mic size={24} />
                </button>
            )}

            {/* 錄音中 → 顯示叉叉 + 勾勾 */}
            {isRecording && (
                <div className="flex items-center gap-3">

                    {/* 取消 */}
                    <button
                        onClick={cancelRecording}
                        className="p-2 rounded-full hover:bg-white/30"
                        aria-label="cancel voice input"
                    >
                        <X size={24} />
                    </button>

                    {/* 完成（送出文字） */}
                    <button
                        onClick={stopAndSend}
                        className="p-2 rounded-full hover:bg-white/30"
                        aria-label="finish voice input"
                    >
                        <Check size={24} />
                    </button>
                </div>
            )}
        </div>
    );
}
