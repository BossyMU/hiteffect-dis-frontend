/**
 * Domain types. Field names match hiteffect-dis-backend's responses, so API data is used as it is.
 * Dates are ISO strings: 'YYYY-MM-DD' for dates, full ISO timestamps for moments.
 */

// ─── Accounts ───────────────────────────────────────────────────────────────

export type Role = 'admin' | 'shop'
export type UserStatus = 'pending' | 'approved' | 'suspended'

export interface User {
  id: string
  email: string
  role: Role
  status: UserStatus
  shopName: string
  contactName: string
  phone: string
  address: string
  tierId: number | null
  tierName: string | null
  historyFactor: number
  expiredOffers: number
  legalName: string
  taxId: string
  branchCode: string
  taxAddress: string
  lastLoginAt: string | null
  createdAt: string
}

export interface Tier {
  id: number
  name: string
  weight: number
  maxPreorderQty: number | null
  sortOrder: number
  shopCount: number
}

export interface AppNotification {
  id: number
  type: string
  subject: string
  body: string
  link: string
  createdAt: string
  readAt: string | null
}

// ─── Products ───────────────────────────────────────────────────────────────

export interface TierPrice {
  tierId: number
  price: number
}

export interface Product {
  id: string
  sku: string
  name: string
  game: string
  setCode: string
  /** Booster Box, Decks, Box Set, Bundle, … */
  category: string
  description: string
  imageUrl: string
  boxesPerCase: number | null
  releaseDate: string | null
  basePrice: number
  stockOnHand: number
  stockReserved: number
  available: number
  maxPerOrder: number | null
  isListed: boolean
  createdAt: string
  tierPrices: TierPrice[]
}

export type NewProduct = Omit<Product, 'id' | 'stockOnHand' | 'stockReserved' | 'available' | 'createdAt'>

/** A product as a shop sees it: its own tier price and what is available now. */
export interface ShopProduct {
  id: string
  sku: string
  name: string
  game: string
  setCode: string
  category: string
  description: string
  imageUrl: string
  boxesPerCase: number | null
  releaseDate: string | null
  maxPerOrder: number | null
  available: number
  price: number
  /** The product's current pre-order round, or null. Shops see it on the Pre-orders tab. */
  activeRound: { id: string; status: RoundStatus; requestDeadline: string | null } | null
}

export interface StockMovement {
  id: number
  type: 'receive' | 'reserve' | 'release' | 'ship' | 'adjust'
  qty: number
  refType: string | null
  refId: string | null
  note: string
  createdAt: string
  createdBy: string | null
}

// ─── Rounds ─────────────────────────────────────────────────────────────────

export type RoundStatus =
  'draft' | 'open' | 'allocating' | 'offering' | 'confirmed' | 'balance_due' | 'closed' | 'cancelled'

export type AllocationStatus = 'draft' | 'not_offered' | 'offered' | 'accepted' | 'declined' | 'expired'

export interface Round {
  id: string
  productId: string
  productName: string
  productSku: string
  productImageUrl: string
  title: string
  totalSupply: number
  receivedQty: number | null
  depositPct: number
  status: RoundStatus
  requestDeadline: string | null
  offerWindowHours: number
  offerDeadline: string | null
  expectedArrival: string | null
  arrivedAt: string | null
  paymentDeadline: string | null
  shipDate: string | null
  note: string
  createdAt: string
}

export interface RoundStats {
  preorderCount: number
  requestedTotal: number
  offeredTotal: number
  acceptedTotal: number
  pendingDeposits: number
  openOrders: number
}

export interface AdminRound extends Round {
  stats: RoundStats
}

export interface RoundPreorder {
  id: string
  userId: string
  shopName: string
  tierName: string | null
  requestedQty: number
  status: 'submitted' | 'withdrawn'
  createdAt: string
  updatedAt: string
}

export interface RoundAllocation {
  id: string
  userId: string
  shopName: string
  tierName: string | null
  requestedQty: number
  weight: number
  offeredQty: number
  acceptedQty: number | null
  unitPrice: number
  status: AllocationStatus
  offerExpiresAt: string | null
  respondedAt: string | null
  orderId: string | null
  orderNo: string | null
  orderStatus: OrderStatus | null
}

export interface RoundHistoryEntry {
  id: number
  fromStatus: RoundStatus | null
  toStatus: RoundStatus
  note: string
  changedAt: string
  changedBy: string
}

export interface AllocationAdjustment {
  id: number
  allocationId: string
  shopName: string
  type: 'increase' | 'decrease' | 'transfer' | 'supply_shortfall' | 'deadline_extension'
  delta: number
  reason: string
  createdAt: string
  adminEmail: string
}

export interface RoundDetail extends AdminRound {
  preorders: RoundPreorder[]
  allocations: RoundAllocation[]
  history: RoundHistoryEntry[]
  adjustments: AllocationAdjustment[]
}

export interface NewRound {
  productId: string
  title: string
  totalSupply: number
  depositPct: number
  requestDeadline: string
  offerWindowHours: number
  expectedArrival: string | null
  note: string
}

/** A round as a shop sees it, with its own request, offer and order. */
export interface ShopRound extends Round {
  productGame: string
  productSetCode: string
  productCategory: string
  productDescription: string
  productBoxesPerCase: number | null
  productReleaseDate: string | null
  unitPrice: number
  maxPreorderQty: number | null
  myPreorder: { requestedQty: number; status: 'submitted' | 'withdrawn'; updatedAt: string } | null
  myAllocation: {
    id: string
    offeredQty: number
    acceptedQty: number | null
    unitPrice: number
    status: AllocationStatus
    offerExpiresAt: string | null
  } | null
  myOrderId: string | null
  /** The shop's order from this round (its latest one that isn't cancelled), with what is paid and due. */
  myOrder: {
    id: string
    orderNo: string
    status: OrderStatus
    subtotal: number
    depositAmount: number
    paidAmount: number
    amountDue: number
    paymentDueAt: string | null
    trackingNo: string | null
    shippedAt: string | null
    cancelReason: string | null
    /** A slip is being checked, or an online payment is in progress. */
    paymentPending: boolean
    /** When we last confirmed a payment (the deposit, or the balance). */
    paymentConfirmedAt: string | null
  } | null
}

// ─── Orders and payments ────────────────────────────────────────────────────

export type OrderType = 'preorder' | 'regular'

export type OrderStatus =
  'awaiting_deposit' | 'awaiting_stock' | 'pending_payment' | 'paid' | 'shipped' | 'cancelled'

export type PaymentKind = 'deposit' | 'balance' | 'full'
/** Ways to pay by transfer slip, checked by an admin. */
export type SlipMethod = 'PromptPay' | 'Bank Transfer'
/** 'Xendit': paid online on Xendit's page, confirmed by Xendit. */
export type PaymentMethod = SlipMethod | 'Xendit'
export type PaymentStatus = 'pending' | 'confirmed' | 'rejected'

export interface OrderItem {
  productId: string
  productName: string
  sku: string
  qty: number
  unitPrice: number
}

export interface OrderPayment {
  id: string
  kind: PaymentKind
  amount: number
  method: PaymentMethod
  reference: string
  status: PaymentStatus
  submittedAt: string
  reviewedAt: string | null
  rejectReason: string
  /** Xendit's payment page, while an online payment is open. */
  checkoutUrl: string | null
  checkoutExpiresAt: string | null
}

export interface Order {
  id: string
  orderNo: string
  userId: string
  shopName: string
  type: OrderType
  roundId: string | null
  roundTitle: string | null
  allocationId: string | null
  status: OrderStatus
  subtotal: number
  depositAmount: number
  paidAmount: number
  refundDue: number
  amountDue: number
  paymentDueAt: string | null
  shipAddress: string
  note: string
  cancelReason: string
  trackingNo: string
  shippedAt: string | null
  shipDate: string | null
  createdAt: string
  items: OrderItem[]
  payments: OrderPayment[]
}

export interface Payment {
  id: string
  orderId: string
  orderNo: string
  orderType: OrderType
  orderStatus: OrderStatus
  roundTitle: string | null
  userId: string
  shopName: string
  kind: PaymentKind
  amount: number
  method: PaymentMethod
  reference: string
  status: PaymentStatus
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  rejectReason: string
  /** Online payments: Xendit's page stops taking payments after this. */
  checkoutExpiresAt: string | null
}

export interface PaymentDetail extends Payment {
  slipImage: string
  orderSubtotal: number
  orderPaidAmount: number
}

/** What a shop sends with a deposit, balance or full payment. */
export interface SlipUpload {
  method: SlipMethod
  reference: string
  slipImage: string
}

/** Whether shops can pay online (Xendit is set up on the backend). */
export interface PaymentOptions {
  onlinePayment: boolean
}

/** An online payment that was started: send the shop to `checkoutUrl`. */
export interface OnlineCheckout {
  paymentId: string
  checkoutUrl: string
}

// ─── Dashboards ─────────────────────────────────────────────────────────────

export interface AdminDashboard {
  pendingShops: number
  activeShops: number
  pendingPayments: number
  pendingPaymentTotal: number
  ordersToShip: number
  ordersAwaitingPayment: number
  refundsDue: number
  received30d: number
  roundsByStatus: Partial<Record<RoundStatus, number>>
}

export interface ShopDashboard {
  offersToAnswer: number
  openRoundsNotRequested: number
  ordersToPay: number
  amountToPay: number
  ordersInProgress: number
}

export interface DeadlineRunResult {
  allocated: number
  offersClosed: number
  ordersCancelled: number
  ranAt: string
}
