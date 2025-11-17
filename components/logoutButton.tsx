"use client";

import {Button} from "@/components/ui/button";
import {useState} from "react";

export function LogoutButton() {

    // 滑鼠 hover 狀態
    const [hover, setHover] = useState(false);

    return (
        <Button
            variant="ghost"
            className="inline-flex items-center gap-1 p-2 rounded hover:bg-muted/50"
            onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            {hover ? (
                <img src="/logout.gif" className="w-6 h-6" />
            ) : (
                <img src="/logout.png" className="w-6 h-6" />
            )}
        </Button>
    );
}
