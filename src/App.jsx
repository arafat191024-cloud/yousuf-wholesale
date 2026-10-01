import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Providers
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';

// Public Pages
import { Home } from './pages/Home';
import CategoryPage from './pages/CategoryPage';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Orders } from './pages/Orders';

// Components
import { CartDrawer } from './components/CartDrawer';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <CartProvider>
          {/* Global Cart Drawer */}
          <CartDrawer />

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/orders" element={<Orders />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Protected Admin Routes */}
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

            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Routes>
        </CartProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}