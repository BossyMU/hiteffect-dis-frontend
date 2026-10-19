import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AppLayout, GuestOnly, RequireAuth } from '@/components/layout'
import { AuthProvider } from '@/context/AuthContext'
import { CartProvider } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import PaymentsPage from '@/pages/admin/PaymentsPage'
import ProductsPage from '@/pages/admin/ProductsPage'
import RoundDetailPage from '@/pages/admin/RoundDetailPage'
import RoundsPage from '@/pages/admin/RoundsPage'
import ShopsPage from '@/pages/admin/ShopsPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import CartPage from '@/pages/shop/CartPage'
import MyPreordersPage from '@/pages/shop/MyPreordersPage'
import PreorderDetailPage from '@/pages/shop/PreorderDetailPage'
import PreordersPage from '@/pages/shop/PreordersPage'
import ProductDetailPage from '@/pages/shop/ProductDetailPage'
import ShopDashboardPage from '@/pages/shop/ShopDashboardPage'
import ShopOrderPage from '@/pages/shop/ShopOrderPage'
import ShopOrdersPage from '@/pages/shop/ShopOrdersPage'
import ShopProductsPage from '@/pages/shop/ProductsPage'
import { PATHS } from '@/routes/paths'

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Routes>
            <Route element={<GuestOnly />}>
              <Route path={PATHS.login} element={<LoginPage />} />
              <Route path={PATHS.register} element={<RegisterPage />} />
            </Route>

            <Route element={<RequireAuth roles={['shop', 'admin']} />}>
              <Route element={<AppLayout />}>
                <Route path={PATHS.profile} element={<ProfilePage />} />

                <Route element={<RequireAuth roles={['shop']} />}>
                  <Route element={<CartProvider />}>
                    <Route index element={<ShopDashboardPage />} />
                    <Route path={PATHS.products} element={<ShopProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path={PATHS.preorders} element={<PreordersPage />} />
                    <Route path="/preorders/:id" element={<PreorderDetailPage />} />
                    <Route path={PATHS.myPreorders} element={<MyPreordersPage />} />
                    <Route path={PATHS.cart} element={<CartPage />} />
                    <Route path={PATHS.stock} element={<Navigate to={PATHS.products} replace />} />
                    <Route path={PATHS.orders} element={<ShopOrdersPage />} />
                    <Route path="/orders/:id" element={<ShopOrderPage />} />
                  </Route>
                </Route>

                <Route element={<RequireAuth roles={['admin']} />}>
                  <Route path={PATHS.admin} element={<AdminDashboardPage />} />
                  <Route path={PATHS.adminRounds} element={<RoundsPage />} />
                  <Route path="/admin/rounds/:id" element={<RoundDetailPage />} />
                  <Route path={PATHS.adminPayments} element={<PaymentsPage />} />
                  <Route path={PATHS.adminOrders} element={<AdminOrdersPage />} />
                  <Route path={PATHS.adminProducts} element={<ProductsPage />} />
                  <Route path={PATHS.adminShops} element={<ShopsPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to={PATHS.home} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  )
}
