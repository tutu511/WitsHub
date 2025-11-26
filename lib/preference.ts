import { PREFERENCE_STORAGE_KEY } from "@/lib/config";

export type ReplyPreferenceItem = {
    personId: string;
    replyPreference: string;
};

const readPreferenceList = (): ReplyPreferenceItem[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(PREFERENCE_STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored) as ReplyPreferenceItem[];
    } catch {
        return [];
    }
};

const writePreferenceList = (list: ReplyPreferenceItem[]) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(list));
};

export const getReplyPreference = (personId: string): string => {
    if (!personId) return "";
    const list = readPreferenceList();
    return list.find((item) => item.personId === personId)?.replyPreference || "";
};

export const saveReplyPreference = (personId: string, replyPreference: string) => {
    if (!personId) return;
    const list = readPreferenceList();
    const index = list.findIndex((item) => item.personId === personId);
    const nextItem: ReplyPreferenceItem = { personId, replyPreference };

    if (index >= 0) {
        list[index] = nextItem;
    } else {
        list.push(nextItem);
    }

    writePreferenceList(list);
};

export const removeReplyPreference = (personId: string) => {
    if (!personId) return;
    const list = readPreferenceList();
    const nextList = list.filter((item) => item.personId !== personId);
    writePreferenceList(nextList);
};
