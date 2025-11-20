"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const USERNAME_STORAGE_KEY = "witsHubUsername";

export default function ProfilePage() {
    const [username, setUsername] = useState<string>("");

    useEffect(() => {
        const stored = localStorage.getItem(USERNAME_STORAGE_KEY);
        setUsername(stored ?? "");
    }, []);

    const displayName = username.trim() || "訪客";

    return (
        <div className="px-4 py-14 flex justify-center">
            <div className="flex flex-col items-center gap-4 text-white">
                <div className="w-32 h-32 rounded-full overflow-hidden shadow-[0_20px_45px_rgba(59,130,246,0.45)] border border-white/10 bg-white/10">
                    <Image
                        src="/pic-1.png"
                        alt={displayName || "使用者頭貼"}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                        priority
                    />
                </div>
                <p className="text-2xl font-medium">{displayName}</p>
            </div>
        </div>
    );
}
