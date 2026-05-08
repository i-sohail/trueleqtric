// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import AppShell from './components/common/AppShell'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Leads from './pages/Leads'
import Quotations from './pages/Quotations'
import SalesPO from './pages/SalesPO'
import Procurement from './pages/Procurement'
import Inventory from './pages/Inventory'
import Delivery from './pages/Delivery'
import AR from './pages/AR'
import AP from './pages/AP'
import Customers from './pages/Customers'
import Vendors from './pages/Vendors'
import Catalog from './pages/Catalog'
import PricingMaster from './pages/PricingMaster'
import BGLC from './pages/BGLC'
import Tenders from './pages/Tenders'
import Documents from './pages/Documents'
import PaymentSchedules from './pages/PaymentSchedules'
import ProdTracking from './pages/ProdTracking'
import Commissions from './pages/Commissions'
import VendorScores from './pages/VendorScores'
import CreditMonitor from './pages/CreditMonitor'
import CashFlow from './pages/CashFlow'
import DropdownLists from './pages/DropdownLists'
import SellerRecommendations from './pages/SellerRecommendations'
import Trash from './pages/Trash'
import AccessManagement from './pages/AccessManagement'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg0)', flexDirection:'column', gap:12 }}>
      <div style={{ width:40, height:40, border:'3px solid var(--border2)', borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <div style={{ color:'var(--text3)', fontSize:13, fontFamily:'var(--font-mono)' }}>Loading Trueleqtric…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><SidebarProvider><AppShell /></SidebarProvider></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="leads" element={<Leads />} />
        <Route path="quotations" element={<Quotations />} />
        <Route path="salespo" element={<SalesPO />} />
        <Route path="procurement" element={<Procurement />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="delivery" element={<Delivery />} />
        <Route path="ar" element={<AR />} />
        <Route path="ap" element={<AP />} />
        <Route path="customers" element={<Customers />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="pricing" element={<PricingMaster />} />
        <Route path="bglc" element={<BGLC />} />
        <Route path="tenders" element={<Tenders />} />
        <Route path="documents" element={<Documents />} />
        <Route path="payment-schedules" element={<PaymentSchedules />} />
        <Route path="prod-tracking" element={<ProdTracking />} />
        <Route path="commissions" element={<Commissions />} />
        <Route path="vendor-scores" element={<VendorScores />} />
        <Route path="credit-monitor" element={<CreditMonitor />} />
        <Route path="cash-flow" element={<CashFlow />} />
        <Route path="lists" element={<DropdownLists />} />
        <Route path="sellers" element={<SellerRecommendations />} />
        <Route path="trash" element={<Trash />} />
        <Route path="access" element={<AccessManagement />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
