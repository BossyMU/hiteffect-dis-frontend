/** Calls an admin account makes. */
import type {
  AdminDashboard,
  AdminRound,
  DeadlineRunResult,
  NewProduct,
  NewRound,
  Order,
  Payment,
  PaymentDetail,
  PaymentStatus,
  Product,
  RoundDetail,
  StockMovement,
  Tier,
  TrackingStatus,
  User,
  UserStatus,
} from '@/types'
import { request } from './client'

const post = <T>(path: string, body: unknown = {}) => request<T>(path, { method: 'POST', body })
const patch = <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body })

export const adminApi = {
  dashboard: () => request<AdminDashboard>('/admin/dashboard'),
  runDeadlines: () => post<DeadlineRunResult>('/admin/run-deadlines'),

  shops: (status: UserStatus | 'all' = 'all') => request<User[]>('/admin/shops', { query: { status } }),
  updateShop: (id: string, body: { status?: UserStatus; tierId?: number | null; historyFactor?: number }) =>
    patch<User>(`/admin/shops/${id}`, body),

  tiers: () => request<Tier[]>('/admin/tiers'),
  createTier: (body: Pick<Tier, 'name' | 'weight' | 'maxPreorderQty' | 'sortOrder'>) =>
    post<Tier>('/admin/tiers', body),
  updateTier: (id: number, body: Partial<Pick<Tier, 'name' | 'weight' | 'maxPreorderQty' | 'sortOrder'>>) =>
    patch<Tier>(`/admin/tiers/${id}`, body),

  /** Products in use, or only the archived ones. */
  products: (archived = false) => request<Product[]>('/admin/products', { query: { archived } }),
  createProduct: (body: NewProduct) => post<Product>('/admin/products', body),
  updateProduct: (id: string, body: Partial<NewProduct>) => patch<Product>(`/admin/products/${id}`, body),
  /** Only for products never ordered or used in a round. */
  deleteProduct: (id: string) => request<void>(`/admin/products/${id}`, { method: 'DELETE' }),
  archiveProduct: (id: string) => post<Product>(`/admin/products/${id}/archive`),
  restoreProduct: (id: string) => post<Product>(`/admin/products/${id}/restore`),
  adjustStock: (id: string, qty: number, note: string) =>
    post<Product>(`/admin/products/${id}/stock`, { qty, note }),
  movements: (id: string) => request<StockMovement[]>(`/admin/products/${id}/movements`),

  rounds: () => request<AdminRound[]>('/admin/rounds'),
  round: (id: string) => request<RoundDetail>(`/admin/rounds/${id}`),
  createRound: (body: NewRound) => post<AdminRound>('/admin/rounds', body),
  updateRound: (id: string, body: Partial<NewRound>) => patch<AdminRound>(`/admin/rounds/${id}`, body),
  openRound: (id: string, note = '') => post<AdminRound>(`/admin/rounds/${id}/open`, { note }),
  allocate: (id: string, note = '') => post<RoundDetail>(`/admin/rounds/${id}/allocate`, { note }),
  publish: (id: string, note = '') => post<RoundDetail>(`/admin/rounds/${id}/publish`, { note }),
  closeOffers: (id: string, note = '') => post<RoundDetail>(`/admin/rounds/${id}/close-offers`, { note }),
  arrive: (
    id: string,
    body: { receivedQty: number; paymentDeadline: string; shipDate: string; note: string },
  ) => post<RoundDetail>(`/admin/rounds/${id}/arrive`, body),
  schedule: (
    id: string,
    body: { expectedArrival?: string | null; paymentDeadline?: string; shipDate?: string; note?: string },
  ) => patch<RoundDetail>(`/admin/rounds/${id}/schedule`, body),
  closeRound: (id: string, note = '') => post<RoundDetail>(`/admin/rounds/${id}/close`, { note }),
  cancelRound: (id: string, note = '') => post<RoundDetail>(`/admin/rounds/${id}/cancel`, { note }),
  adjustAllocation: (id: string, offeredQty: number, reason: string) =>
    patch<RoundDetail>(`/admin/allocations/${id}`, { offeredQty, reason }),

  orders: (query: { status?: string; type?: 'preorder' | 'regular' | 'all' } = {}) =>
    request<Order[]>('/admin/orders', { query }),
  order: (id: string) => request<Order>(`/admin/orders/${id}`),
  /** Sender name, address and phone for shipping labels. */
  labelSender: () => request<{ name: string; address: string; phone: string }>('/admin/label-sender'),
  /** Mark a paid order shipped (EMS, with its tracking number) or picked up (no tracking number). */
  shipOrder: (id: string, trackingNo: string) => post<Order>(`/admin/orders/${id}/ship`, { trackingNo }),
  /** Thailand Post: the next tracking number from our assigned range (only when set up). */
  assignTrackingNo: (id: string) => post<Order>(`/admin/orders/${id}/tracking-number`, {}),
  tracking: (id: string) => request<TrackingStatus>(`/admin/orders/${id}/tracking`),
  cancelOrder: (id: string, reason: string) => post<Order>(`/admin/orders/${id}/cancel`, { reason }),

  payments: (status: PaymentStatus | 'all' = 'pending') =>
    request<Payment[]>('/admin/payments', { query: { status } }),
  payment: (id: string) => request<PaymentDetail>(`/admin/payments/${id}`),
  confirmPayment: (id: string) => post<PaymentDetail>(`/admin/payments/${id}/confirm`),
  rejectPayment: (id: string, reason: string) =>
    post<PaymentDetail>(`/admin/payments/${id}/reject`, { reason }),
  /** Ask Xendit how an online payment went, and apply it. */
  checkPayment: (id: string) => post<PaymentDetail>(`/admin/payments/${id}/check`),
}
