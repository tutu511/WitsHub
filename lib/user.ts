import {USER_STORAGE_KEY} from "@/lib/config";

/**
 * 用戶信息
 * username：帳號（工號）
 * password：密碼
 * email：郵箱
 * personName：姓名
 */
export type User = {
    username: string,
    password: string,
    email: string,
    personName: string;
};

// 將登錄成功的用戶信息保存到 localstorage
export const saveUser = (user: User) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

// 從 localstorage 獲取用戶姓名
export const getPersonName = (): string  => {
    const userStored = localStorage.getItem(USER_STORAGE_KEY);
    if (!userStored) return "訪客";

    const user: User = JSON.parse(userStored);
    return user?.personName || "訪客";
}

// 從 localstorage 獲取用戶帳號（工號）
export const getPersonId = (): string  => {
    const userStored = localStorage.getItem(USER_STORAGE_KEY);
    if (!userStored) return "";

    const user: User = JSON.parse(userStored);
    return user?.username || "";
}

// 從 localstorage 獲取用戶資訊
export const getUser = (): User | null => {
    const userStored = localStorage.getItem(USER_STORAGE_KEY);
    if (userStored != null) {
        return JSON.parse(userStored);
    } else {
        return null;
    }
}

// 只清除登入使用者資訊
export const removeUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
}