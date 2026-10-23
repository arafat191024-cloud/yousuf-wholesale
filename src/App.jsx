import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';

import { Home } from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import { ProductDetails } from './pages/ProductDetails';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Orders } from './pages/Orders';
import { SearchPage } from './pages/SearchPage';
import { Checkout } from './pages/Checkout';
import { OffersPage } from './pages/OffersPage';
import { PolicyPage } from './pages/PolicyPage';

import { CartDrawer } from './components/CartDrawer';
import { AddedSheet } from './components/AddedSheet';
import { ScrollManager } from './components/ScrollManager';
import { SiteHeader } from './components/SiteHeader';
import { Footer } from './components/Footer';
import { FloatingFaqChat } from './components/FloatingFaqChat';
import { BottomNav } from './components/BottomNav';
import ProtectedRoute from './components/ProtectedRoute';

import AdminLogin from './pages/admin/AdminLogin';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';
import AdminPos from './pages/admin/AdminPos';
import AdminBanners from './pages/admin/AdminBanners';

function Shell({ children }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) return children;

  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <Footer />
      <BottomNav />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <ScrollManager />
            <CartDrawer />
            <AddedSheet />
            <FloatingFaqChat />
            <Shell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/category/:slug" element={<CategoryPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/offers" element={<OffersPage />} />
                <Route path="/terms" element={<PolicyPage kind="terms" />} />
                <Route path="/returns" element={<PolicyPage kind="returns" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/checkout" element={<Checkout />} />

                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute>
                      <AdminOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <ProtectedRoute>
                      <AdminProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/pos"
                  element={
                    <ProtectedRoute>
                      <AdminPos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/banners"
                  element={
                    <ProtectedRoute>
                      <AdminBanners />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Home />} />
              </Routes>
            </Shell>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
