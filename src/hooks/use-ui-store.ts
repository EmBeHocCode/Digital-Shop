"use client";

import { create } from "zustand";

interface UiState {
  isMegaMenuOpen: boolean;
  toggleMegaMenu: () => void;
  closeMegaMenu: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMegaMenuOpen: false,
  toggleMegaMenu: () =>
    set((state) => ({ isMegaMenuOpen: !state.isMegaMenuOpen })),
  closeMegaMenu: () => set({ isMegaMenuOpen: false })
}));
