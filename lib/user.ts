import {USER_STORAGE_KEY} from "@/lib/config";

/**
 * 用戶信息
 * username：帳號（工號）
 * password：密碼
 * email：郵箱
 * personName：姓名
 * role：角色
 */
export type User = {
    username: string,
    password: string,
    email: string,
    personName: string,
    role?: string;
};

// 導向登入頁
const redirectToLogin = () => {
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/login") return;
    window.location.replace("/login");
};

// 重用邏輯
const readStoredUser = (): User | null => {
    if (typeof window === "undefined") return null;

    const userStored = localStorage.getItem(USER_STORAGE_KEY);
    if (!userStored) {
        redirectToLogin();
        return null;
    }

    try {
        return JSON.parse(userStored) as User;
    } catch {
        redirectToLogin();
        return null;
    }
};

// 將登錄成功的用戶信息保存到 localstorage
export const saveUser = (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

// 從 localstorage 獲取用戶姓名
export const getPersonName = (): string  => {
    const user = readStoredUser();
    return user?.personName || "訪客";
}

// 從 localstorage 獲取用戶角色
export const getPersonRole = (): string => {
    const user = readStoredUser();
    return user?.role || "未設定";
};

// 從 localstorage 獲取用戶帳號（工號）
export const getPersonId = (): string  => {
    const user = readStoredUser();
    return user?.username || "";
}

// 從 localstorage 獲取用戶資訊
export const getUser = (): User | null => {
    return readStoredUser();
}

// 只清除登入使用者資訊
export const removeUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
}
