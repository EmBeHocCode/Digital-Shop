"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { CartItem, CartProduct, CompletedOrder } from "@/features/cart/types"

interface CartStoreState {
  items: CartItem[]
  lastOrder: CompletedOrder | null
  isHydrated: boolean
  addItem: (product: CartProduct) => void
  upsertItem: (product: CartProduct, quantity: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  completeOrder: (order: CompletedOrder) => void
  markHydrated: (value: boolean) => void
}

function syncConfiguredQuantity(item: CartItem, quantity: number): CartItem {
  if (!item.configuration) {
    return {
      ...item,
      quantity,
    }
  }

  return {
    ...item,
    quantity,
    configuration: {
      ...item.configuration,
      selection: {
        ...item.configuration.selection,
        quantity,
      },
    },
  }
}

export const useCartStore = create<CartStoreState>()(
  persist(
    (set) => ({
      items: [],
      lastOrder: null,
      isHydrated: false,
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id)

          if (existingItem) {
            if (existingItem.configuration?.allowQuantityAdjustment === false) {
              return {
                items: state.items.map((item) =>
                  item.id === product.id ? syncConfiguredQuantity({ ...item, ...product }, item.quantity) : item
                ),
              }
            }

            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? syncConfiguredQuantity({ ...item, ...product }, item.quantity + 1)
                  : item
              ),
            }
          }

          return {
            items: [...state.items, syncConfiguredQuantity({ ...product, quantity: 1 }, 1)],
          }
        }),
      upsertItem: (product, quantity) =>
        set((state) => {
          const normalizedQuantity =
            product.configuration?.allowQuantityAdjustment === false ? 1 : Math.max(1, quantity)
          const nextItem = syncConfiguredQuantity(
            {
              ...product,
              quantity: normalizedQuantity,
            },
            normalizedQuantity
          )

          return {
            items: [
              ...state.items.filter((item) => item.id !== product.id),
              nextItem,
            ],
          }
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return {
              items: state.items.filter((item) => item.id !== productId),
            }
          }

          return {
            items: state.items.map((item) =>
              item.id === productId ? syncConfiguredQuantity(item, quantity) : item
            ),
          }
        }),
      clearCart: () => set({ items: [] }),
      completeOrder: (order) =>
        set({
          lastOrder: order,
          items: [],
        }),
      markHydrated: (value) => set({ isHydrated: value }),
    }),
    {
      name: "digital-shop-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        lastOrder: state.lastOrder,
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated(true)
      },
    }
  )
)
