export const PATHS = {
  login: '/login',
  register: '/register',
  profile: '/profile',

  // Shops
  home: '/',
  products: '/products',
  product: (id: string) => `/products/${id}`,
  preorders: '/preorders',
  preorder: (roundId: string) => `/preorders/${roundId}`,
  myPreorders: '/my-preorders',
  cart: '/cart',
  /** Old address of the products page; redirects to `products`. */
  stock: '/stock',
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,

  // Admins
  admin: '/admin',
  adminRounds: '/admin/rounds',
  adminRound: (id: string) => `/admin/rounds/${id}`,
  adminPayments: '/admin/payments',
  adminOrders: '/admin/orders',
  /** Printable Thailand Post label for one order (opens without the app's menus). */
  adminOrderLabel: (id: string) => `/admin/orders/${id}/label`,
  adminProducts: '/admin/products',
  /** The catalog as shops see it. */
  adminPreview: '/admin/preview',
  adminPreviewProduct: (id: string) => `/admin/preview/${id}`,
  adminShops: '/admin/shops',
} as const
