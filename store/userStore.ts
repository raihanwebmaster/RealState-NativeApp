import { create } from "zustand";

interface UserStore {
    isAdmin: boolean;
    isAdminLoading: boolean;
    setIsAdmin: (isAdmin: boolean) => void;
    setIsAdminLoading: (isAdminLoading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    isAdmin: false,
    isAdminLoading: true,
    setIsAdmin: (isAdmin) => set({ isAdmin }),
    setIsAdminLoading: (isAdminLoading) => set({ isAdminLoading }),
}));
