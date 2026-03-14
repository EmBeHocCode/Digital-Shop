"use client";

import { create } from "zustand";

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 5,
  setUnreadCount: (count) => set({ unreadCount: count }),
  markAllAsRead: () => set({ unreadCount: 0 })
}));
