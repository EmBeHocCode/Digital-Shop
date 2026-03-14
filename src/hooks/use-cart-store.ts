"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem as DomainCartItem } from "@/types/domain";

type CartItem = DomainCartItem;

interface CartState {
  items: CartItem[];
  couponCode: string;
  addItem: (item: CartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setCouponCode: (value: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: "",
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.id === item.id
          );

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.id === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              )
            };
          }

          return { items: [...state.items, item] };
        }),
      updateQuantity: (itemId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Number.isFinite(quantity) ? Math.max(1, quantity) : item.quantity }
              : item
          )
        })),
      removeItem: (itemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId)
        })),
      setCouponCode: (couponCode) => set({ couponCode }),
      clearCart: () => set({ items: [], couponCode: "" })
    }),
    {
      name: "meowmarket-cart"
    }
  )
);
