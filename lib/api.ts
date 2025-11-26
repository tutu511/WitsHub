export const fetchChatTitle = async (question: string) => {
    try {
        const response = await fetch("https://uat-n8n.wits.com/webhook/generate-chat-title", {
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
};
