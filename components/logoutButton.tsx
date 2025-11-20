"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const USERNAME_STORAGE_KEY = "witsHubUsername";

export function LogoutButton() {
    const router = useRouter();
    const [hover, setHover] = useState(false);

    const handleLogout = useCallback(() => {
        // 只清除登入使用者資訊，保留 localStorage 內的對話紀錄
        localStorage.removeItem(USERNAME_STORAGE_KEY);
        router.push("/login");
    }, [router]);

    return (
        <Button
            type="button"
            variant="ghost"
            className="inline-flex items-center gap-1 p-2 rounded hover:bg-muted/50"
            onClick={handleLogout}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            {hover ? <img src="/logout.gif" className="w-6 h-6" /> : <img src="/logout.png" className="w-6 h-6" />}
        </Button>
    );
}
