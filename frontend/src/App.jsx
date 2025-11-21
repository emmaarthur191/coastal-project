import React, { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import './App.css'

// Import pages
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import Transfer from './pages/Transfer'
import MemberDashboard from './pages/MemberDashboard'
import OperationsManagerDashboard from './pages/OperationsManagerDashboard'
import CashierDashboard from './pages/CashierDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import MobileBankerDashboard from './pages/MobileBankerDashboard'

// Lazy loaded pages
const FraudAlerts = lazy(() => import('./pages/FraudAlerts'));
const FraudCases = lazy(() => import('./pages/FraudCases'));
const FraudRules = lazy(() => import('./pages/FraudRules'));

// Import components
import ProtectedMemberRoute from './components/ProtectedMemberRoute'

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
        </div>

        {/* Loading Content */}
        <div className="relative text-center animate-scale-in">
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mb-6 shadow-elevated animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {/* Loading Spinner */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Loading Banking Portal
          </h2>
          <p className="text-neutral-600 mb-6">
            Securing your connection...
          </p>

          {/* Loading Progress Dots */}
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-card">
            <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-neutral-700">256-bit Encrypted</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/accounts" element={
            <ProtectedRoute>
              <Accounts />
            </ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          } />
          <Route path="/transfer" element={
            <ProtectedRoute>
              <Transfer />
            </ProtectedRoute>
          } />
          <Route path="/member-dashboard" element={
            <ProtectedMemberRoute>
              <MemberDashboard />
            </ProtectedMemberRoute>
          } />
          <Route path="/operations-dashboard" element={
            <ProtectedRoute>
              <OperationsManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/cashier-dashboard" element={
            <ProtectedRoute>
              <CashierDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manager-dashboard" element={
            <ProtectedRoute>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/mobile-banker-dashboard" element={
            <ProtectedRoute>
              <MobileBankerDashboard />
            </ProtectedRoute>
          } />
          {/* Lazy loaded routes */}
          <Route path="/fraud/alerts" element={
            <ProtectedRoute>
              <Suspense fallback={<div>Loading...</div>}>
                <FraudAlerts />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/fraud/cases" element={
            <ProtectedRoute>
              <Suspense fallback={<div>Loading...</div>}>
                <FraudCases />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/fraud/rules" element={
            <ProtectedRoute>
              <Suspense fallback={<div>Loading...</div>}>
                <FraudRules />
              </Suspense>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App
