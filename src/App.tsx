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

export default function App() {
  return (
    <BrowserRouter>
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

            {/* Protected Account Routes */}
            <Route
              path="account"
              element={
                <ProtectedRoute>
                  <StorefrontAccount />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/orders"
              element={
                <ProtectedRoute>
                  <StorefrontOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/orders/:id"
              element={
                <ProtectedRoute>
                  <StorefrontOrders />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/wallet"
              element={
                <ProtectedRoute>
                  <StorefrontDepositQR />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/wallet/deposit"
              element={
                <ProtectedRoute>
                  <StorefrontDepositQR />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/transactions"
              element={
                <ProtectedRoute>
                  <StorefrontTransactions />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/support"
              element={
                <ProtectedRoute>
                  <StorefrontSupport />
                </ProtectedRoute>
              }
            />
            <Route
              path="account/affiliate"
              element={
                <ProtectedRoute>
                  <StorefrontAffiliate />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Admin Experience (/qtri) */}
          <Route path="/qtri" element={<AdminLayout />}>
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
            <Route path="settings" element={<SettingsView />} />
          </Route>

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  );
}
