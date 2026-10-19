import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Outlet } from 'react-router'
import type { ShopProduct } from '@/types'
import { useUser } from './AuthContext'

/**
 * One product in the cart. Name, price and image are a snapshot from when it was added, used for
 * the cart count and totals around the app; the cart page reloads products to check stock and prices.
 */
export interface CartLine {
  productId: string
  qty: number
  name: string
  sku: string
  price: number
  imageUrl: string
}

interface Cart {
  lines: CartLine[]
  /** Boxes in the cart. */
  count: number
  total: number
  qtyOf: (productId: string) => number
  /** Set a product's quantity; 0 removes it. */
  setQty: (product: ShopProduct, qty: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const CartContext = createContext<Cart | null>(null)

const storageKey = (userId: string) => `hed_cart_v2_${userId}`

function readCart(key: string): Record<string, CartLine> {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Most boxes a shop can order of a product right now. */
// eslint-disable-next-line react-refresh/only-export-components
export const orderLimit = (p: ShopProduct) => Math.max(0, Math.min(p.available, p.maxPerOrder ?? Infinity))

/**
 * The shop's cart for in-stock products, kept per account in this browser so it survives a reload.
 * Rendered as a layout route around the shop pages.
 */
export function CartProvider() {
  const user = useUser()
  const key = storageKey(user.id)
  const [items, setItems] = useState<Record<string, CartLine>>(() => readCart(key))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(items))
    } catch {
      // Storage blocked: the cart lasts until the page is closed.
    }
  }, [key, items])

  const setQty = useCallback((p: ShopProduct, qty: number) => {
    const n = Math.max(0, Math.min(orderLimit(p), Math.floor(qty)))
    setItems((prev) => {
      const next = { ...prev }
      if (n === 0) delete next[p.id]
      else
        next[p.id] = {
          productId: p.id,
          qty: n,
          name: p.name,
          sku: p.sku,
          price: p.price,
          imageUrl: p.imageUrl,
        }
      return next
    })
  }, [])

  const remove = useCallback(
    (productId: string) =>
      setItems((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      }),
    [],
  )

  const clear = useCallback(() => setItems({}), [])

  const value = useMemo<Cart>(() => {
    const lines = Object.values(items).filter((l) => l && l.qty > 0)
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      total: lines.reduce((s, l) => s + l.qty * l.price, 0),
      qtyOf: (id) => items[id]?.qty ?? 0,
      setQty,
      remove,
      clear,
    }
  }, [items, setQty, remove, clear])

  return (
    <CartContext.Provider value={value}>
      <Outlet />
    </CartContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used inside CartProvider')
  return cart
}
