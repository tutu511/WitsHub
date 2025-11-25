declare module 'react-speech-recognition' {
    export interface SpeechRecognitionOptions {
        continuous?: boolean;
        interimResults?: boolean;
        language?: string;
    }

    export interface RecognitionResult {
        transcript: string;
        confidence: number;
    }

    export function startListening(options?: SpeechRecognitionOptions): void;
    export function stopListening(): void;
    export function abortListening(): void;

    export function useSpeechRecognition(): {
        transcript: string;
        interimTranscript: string;
        finalTranscript: string;
        listening: boolean;
        browserSupportsSpeechRecognition: boolean;
        resetTranscript: () => void;
    };

    const _default: {
        startListening: typeof startListening;
        stopListening: typeof stopListening;
        abortListening: typeof abortListening;
    };

    export default _default;
}
