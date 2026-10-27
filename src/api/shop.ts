/** Calls a shop account makes. */
import type {
  DeliveryMethod,
  OnlineCheckout,
  Order,
  PaymentOptions,
  ShippingQuote,
  ShopDashboard,
  ShopProduct,
  ShopRound,
  SlipUpload,
  TrackingStatus,
} from '@/types'
import { request } from './client'

export const shopApi = {
  dashboard: () => request<ShopDashboard>('/shop/dashboard'),

  rounds: () => request<ShopRound[]>('/shop/rounds'),
  round: (id: string) => request<ShopRound>(`/shop/rounds/${id}`),
  /** Save a request; `termsVersion` is the version of the pre-order terms the shop agreed to. */
  setPreorder: (roundId: string, requestedQty: number, termsVersion: string) =>
    request<ShopRound>(`/shop/rounds/${roundId}/preorder`, {
      method: 'PUT',
      body: { requestedQty, termsVersion },
    }),
  withdrawPreorder: (roundId: string) =>
    request<ShopRound>(`/shop/rounds/${roundId}/preorder`, { method: 'DELETE' }),
  acceptOffer: (allocationId: string, qty: number, slip: SlipUpload, deliveryMethod: DeliveryMethod) =>
    request<{ roundId: string; orderId: string }>(`/shop/allocations/${allocationId}/accept`, {
      method: 'POST',
      body: { qty, ...slip, deliveryMethod },
    }),
  /** Accept and pay the deposit online: returns Xendit's payment page. */
  acceptOfferOnline: (allocationId: string, qty: number, deliveryMethod: DeliveryMethod) =>
    request<{ roundId: string; orderId: string; checkoutUrl: string }>(
      `/shop/allocations/${allocationId}/accept`,
      {
        method: 'POST',
        body: { qty, method: 'Xendit', deliveryMethod },
      },
    ),
  declineOffer: (allocationId: string) =>
    request<void>(`/shop/allocations/${allocationId}/decline`, { method: 'POST' }),

  products: () => request<ShopProduct[]>('/shop/products'),
  product: (id: string) => request<ShopProduct>(`/shop/products/${id}`),

  orders: () => request<Order[]>('/shop/orders'),
  order: (id: string) => request<Order>(`/shop/orders/${id}`),
  /** EMS shipping for the cart; null for pick-up (no shipping). */
  shippingQuote: (items: { productId: string; qty: number }[], deliveryMethod: DeliveryMethod = 'ems') =>
    request<ShippingQuote | null>('/shop/shipping-quote', {
      method: 'POST',
      body: { items, deliveryMethod },
    }),
  placeOrder: (items: { productId: string; qty: number }[], note: string, deliveryMethod: DeliveryMethod) =>
    request<Order>('/shop/orders', { method: 'POST', body: { items, note, deliveryMethod } }),
  /** EMS or pick-up, on a pre-order before its stock arrives. */
  setDelivery: (orderId: string, deliveryMethod: DeliveryMethod) =>
    request<Order>(`/shop/orders/${orderId}/delivery`, { method: 'PATCH', body: { deliveryMethod } }),
  tracking: (orderId: string) => request<TrackingStatus>(`/shop/orders/${orderId}/tracking`),
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
