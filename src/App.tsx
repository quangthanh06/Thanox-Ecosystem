/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';

// Layouts & Global Components
import { StorefrontLayout } from './components/storefront/StorefrontLayout';
import { AdminLayout } from './components/admin/AdminLayout';
import { NotFoundPage } from './components/NotFoundPage';

// Storefront Pages
import { StorefrontHome } from './components/storefront/StorefrontHome';
import { StorefrontProducts } from './components/storefront/StorefrontProducts';
import { StorefrontProductDetail } from './components/storefront/StorefrontProductDetail';
import { StorefrontCart } from './components/storefront/StorefrontCart';
import { StorefrontAccount } from './components/storefront/StorefrontAccount';
import { StorefrontOrders } from './components/storefront/StorefrontOrders';
import { StorefrontDepositQR } from './components/storefront/StorefrontDepositQR';
import { StorefrontTransactions } from './components/storefront/StorefrontTransactions';
import { StorefrontSupport } from './components/storefront/StorefrontSupport';
import { StorefrontAffiliate } from './components/storefront/StorefrontAffiliate';
import { StorefrontLogin } from './components/storefront/StorefrontLogin';
import { StorefrontRegister } from './components/storefront/StorefrontRegister';
import { StorefrontForgotPassword } from './components/storefront/StorefrontForgotPassword';
import { StorefrontAIAssistant } from './components/storefront/StorefrontAIAssistant';
import { GlobalVisualEffects } from './components/effects/GlobalVisualEffects';
import { ProtectedRoute } from './components/ProtectedRoute';

// Admin Views
import { DashboardView } from './components/DashboardView';
import { AnalyticsView } from './components/AnalyticsView';
import { ProductsView } from './components/ProductsView';
import { CategoriesView } from './components/CategoriesView';
import { OrdersView } from './components/OrdersView';
import { WalletView } from './components/WalletView';
import { TransactionsView } from './components/TransactionsView';
import { AffiliateView } from './components/AffiliateView';
import { UsersView } from './components/UsersView';
import { SupportView } from './components/SupportView';
import { SettingsView } from './components/SettingsView';

import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Immediate scroll reset on window and document elements
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Multi-frame fallback for delayed DOM reflows
    const t1 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 20);

    const t2 = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <StoreProvider>
        <Routes>
          {/* Storefront Experience (Root /) */}
          <Route path="/" element={<StorefrontLayout />}>
            <Route index element={<StorefrontHome />} />
            <Route path="products" element={<StorefrontProducts />} />
            <Route path="products/:idOrSlug" element={<StorefrontProductDetail />} />
            <Route path="categories/:slug" element={<StorefrontProducts />} />
            <Route path="cart" element={<StorefrontCart />} />
            <Route path="checkout" element={<StorefrontCart />} />
            
            {/* Auth Routes */}
            <Route path="login" element={<StorefrontLogin />} />
            <Route path="register" element={<StorefrontRegister />} />
            <Route path="forgot-password" element={<StorefrontForgotPassword />} />

            {/* Public/Hybrid Pages */}
            <Route path="support" element={<StorefrontSupport />} />
            <Route path="affiliate" element={<StorefrontAffiliate />} />

            {/* Account Routes */}
            <Route path="account" element={<StorefrontAccount />} />
            <Route path="account/orders" element={<StorefrontOrders />} />
            <Route path="account/orders/:id" element={<StorefrontOrders />} />
            <Route path="account/wallet" element={<StorefrontDepositQR />} />
            <Route path="account/wallet/deposit" element={<StorefrontDepositQR />} />
            <Route path="account/transactions" element={<StorefrontTransactions />} />
            <Route path="account/support" element={<StorefrontSupport />} />
            <Route path="account/affiliate" element={<StorefrontAffiliate />} />
          </Route>

          {/* Admin Experience (/qtri) - Protected for Admin role only */}
          <Route
            path="/qtri"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardView />} />
            <Route path="dashboard" element={<DashboardView />} />
            <Route path="analytics" element={<AnalyticsView />} />
            <Route path="products" element={<ProductsView />} />
            <Route path="categories" element={<CategoriesView />} />
            <Route path="orders" element={<OrdersView />} />
            <Route path="wallet" element={<WalletView />} />
            <Route path="transactions" element={<TransactionsView />} />
            <Route path="affiliate" element={<AffiliateView />} />
            <Route path="users" element={<UsersView />} />
            <Route path="support" element={<SupportView />} />
            <Route path="theme-settings" element={<SettingsView initialTab="banner" />} />
            <Route path="payment-settings" element={<SettingsView initialTab="payments" />} />
            <Route path="maintenance-settings" element={<SettingsView initialTab="maintenance" />} />
            <Route path="security-settings" element={<SettingsView initialTab="security" />} />
            <Route path="music-settings" element={<SettingsView initialTab="music" />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>

          {/* Alias /admin to /qtri */}
          <Route path="/admin" element={<Navigate to="/qtri" replace />} />
          <Route path="/admin/*" element={<Navigate to="/qtri" replace />} />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* 🤖 24/7 AI Smart Assistant Mascot Widget */}
        <StorefrontAIAssistant />

        {/* 🌸❄️✨ Global Visual Effects Layer (Snow, Sakura, Neon Particles, RGB Border, Glow Cursor) */}
        <GlobalVisualEffects />
      </StoreProvider>
    </BrowserRouter>
  );
}
