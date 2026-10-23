/** Calls a shop account makes. */
import type {
  OnlineCheckout,
  Order,
  PaymentOptions,
  ShopDashboard,
  ShopProduct,
  ShopRound,
  SlipUpload,
} from '@/types'
import { request } from './client'

export const shopApi = {
  dashboard: () => request<ShopDashboard>('/shop/dashboard'),

  rounds: () => request<ShopRound[]>('/shop/rounds'),
  round: (id: string) => request<ShopRound>(`/shop/rounds/${id}`),
  setPreorder: (roundId: string, requestedQty: number) =>
    request<ShopRound>(`/shop/rounds/${roundId}/preorder`, { method: 'PUT', body: { requestedQty } }),
  withdrawPreorder: (roundId: string) =>
    request<ShopRound>(`/shop/rounds/${roundId}/preorder`, { method: 'DELETE' }),
  acceptOffer: (allocationId: string, qty: number, slip: SlipUpload) =>
    request<{ roundId: string; orderId: string }>(`/shop/allocations/${allocationId}/accept`, {
      method: 'POST',
      body: { qty, ...slip },
    }),
  /** Accept and pay the deposit online: returns Xendit's payment page. */
  acceptOfferOnline: (allocationId: string, qty: number) =>
    request<{ roundId: string; orderId: string; checkoutUrl: string }>(
      `/shop/allocations/${allocationId}/accept`,
      {
        method: 'POST',
        body: { qty, method: 'Xendit' },
      },
    ),
  declineOffer: (allocationId: string) =>
    request<void>(`/shop/allocations/${allocationId}/decline`, { method: 'POST' }),

  products: () => request<ShopProduct[]>('/shop/products'),
  product: (id: string) => request<ShopProduct>(`/shop/products/${id}`),

  orders: () => request<Order[]>('/shop/orders'),
  order: (id: string) => request<Order>(`/shop/orders/${id}`),
  placeOrder: (items: { productId: string; qty: number }[], note: string) =>
    request<Order>('/shop/orders', { method: 'POST', body: { items, note } }),
  cancelOrder: (id: string) => request<Order>(`/shop/orders/${id}/cancel`, { method: 'POST' }),
  pay: (orderId: string, slip: SlipUpload) =>
    request<Order>(`/shop/orders/${orderId}/payments`, { method: 'POST', body: slip }),
  /** Pay online: returns Xendit's payment page (the same page again if one is still open). */
  payOnline: (orderId: string) =>
    request<OnlineCheckout>(`/shop/orders/${orderId}/pay-online`, { method: 'POST' }),
  /** Back from Xendit's page: the backend checks the payment with Xendit and returns the order. */
  checkPayment: (paymentId: string) =>
    request<Order>(`/shop/payments/${paymentId}/check`, { method: 'POST' }),
  paymentOptions: () => request<PaymentOptions>('/payment-options'),
}
