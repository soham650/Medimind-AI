import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  FileText, 
  Video, 
  MessageSquare, 
  FolderOpen,
  UserSquare2,
  BookOpen,
  CreditCard,
  Settings,
  LogOut,
  Bell,
  Search,
  AlertTriangle,
  Stethoscope,
  Store,
  ShieldCheck,
  Package,
  ShoppingBag,
  FilePlus2,
  CheckCircle2,
  Clock,
  Users,
  TrendingUp,
  MoreVertical,
  ChevronRight,
  Calendar,
  UserCheck,
  Layers,
  Lock,
  Zap
} from 'lucide-react';

// Context & Types
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserRoles } from './types/database';

// Guards & Protected Components
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';

// Public & Auth Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import PendingApproval from './pages/auth/PendingApproval';
import Unauthorized from './pages/auth/Unauthorized';

// Patient Portal Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import SymptomChecker from './pages/SymptomChecker';
import DoctorSearch from './pages/patient/DoctorSearch';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PharmacyStore from './pages/patient/PharmacyStore';
import ReportAnalyzer from './pages/ReportAnalyzer';
import DoctorRecommendation from './pages/DoctorRecommendation';
import Chatbot from './pages/Chatbot';
import HealthRecords from './pages/HealthRecords';
import PatientTwin from './pages/PatientTwin';
import TrialsExplorer from './pages/TrialsExplorer';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import LabDiagnostics from './pages/patient/LabDiagnostics';
import PatientOrders from './pages/patient/PatientOrders';
import PatientAppointments from './pages/patient/PatientAppointments';
import PatientProfile from './pages/patient/PatientProfile';
import PatientSettings from './pages/patient/PatientSettings';
import PatientNotifications from './pages/patient/PatientNotifications';

// Doctor Portal Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import ConsultationRoom from './pages/doctor/ConsultationRoom';
import PrescriptionGenerator from './pages/doctor/PrescriptionGenerator';
import AiInsights from './pages/doctor/AiInsights';
import DoctorHealthRecords from './pages/doctor/DoctorHealthRecords';
import DoctorAvailability from './pages/doctor/DoctorAvailability';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorAnalytics from './pages/doctor/DoctorAnalytics';
import DoctorNotifications from './pages/doctor/DoctorNotifications';

// Pharmacy Portal Pages
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import OrderProcessing from './pages/pharmacy/OrderProcessing';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import BatchManagement from './pages/pharmacy/BatchManagement';
import MedicineCatalog from './pages/pharmacy/MedicineCatalog';
import PharmacyVerification from './pages/pharmacy/PharmacyVerification';
import PharmacyAnalytics from './pages/pharmacy/PharmacyAnalytics';
import PharmacyProfile from './pages/pharmacy/PharmacyProfile';
import PharmacyNotifications from './pages/pharmacy/PharmacyNotifications';

// Admin Portal Pages (Admin is the highest administrative authority)
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DoctorApprovals from './pages/admin/DoctorApprovals';
import PharmacyApprovals from './pages/admin/PharmacyApprovals';
import AdminDoctorVerification from './pages/admin/DoctorVerification';
import AdminPharmacyVerification from './pages/admin/PharmacyVerification';
import PatientManagement from './pages/admin/PatientManagement';
import DoctorManagement from './pages/admin/DoctorManagement';
import PharmacyManagement from './pages/admin/PharmacyManagement';
import RoleManagement from './pages/admin/RoleManagement';
import AuditLogs from './pages/admin/AuditLogs';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import AIUsageMonitoring from './pages/admin/AIUsageMonitoring';
import SecurityMonitoring from './pages/admin/SecurityMonitoring';
import NotificationManagement from './pages/admin/NotificationManagement';
import SystemSettings from './pages/admin/SystemSettings';

export { useAuth };

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, role, approvalStatus, loading } = useAuth();

  if (loading && !user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8fafc',
        gap: '12px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: '#eff6ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0a4bb5'
        }}>
          <Activity className="animate-spin" size={28} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
            MediMind AI
          </h4>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Initializing clinical platform...
          </span>
        </div>
      </div>
    );
  }

  // Determine canonical home landing redirection based on authoritative database role
  const getDefaultHome = () => {
    if (!user) return <Navigate to="/login" replace />;
    if ((role === UserRoles.DOCTOR || role === UserRoles.PHARMACIST) && approvalStatus !== 'approved') {
      return <Navigate to="/pending-approval" replace />;
    }
    if (role === UserRoles.DOCTOR) return <Navigate to="/doctor/dashboard" replace />;
    if (role === UserRoles.PHARMACIST) return <Navigate to="/pharmacy/dashboard" replace />;
    if (role === UserRoles.ADMIN) return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/patient/dashboard" replace />;
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route */}
        <Route path="/" element={getDefaultHome()} />

        {/* Public & Auth Routes (auto-redirect to role dashboard if already authenticated) */}
        <Route path="/login" element={user ? getDefaultHome() : <Login />} />
        <Route path="/register" element={user ? getDefaultHome() : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Admin Approval Gate waiting screen */}
        <Route path="/pending-approval" element={user ? <PendingApproval /> : <Navigate to="/login" replace />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ========================================================================= */}
        {/* 1. PATIENT PORTAL ROUTES (Allowed for 'patient' role only)                  */}
        {/* ========================================================================= */}
        <Route path="/patient/*" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout>
              <Routes>
                <Route path="dashboard" element={<PatientDashboard />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="consultation/:appointmentId" element={<ConsultationRoom />} />
                <Route path="orders" element={<PatientOrders />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="settings" element={<PatientSettings />} />
                <Route path="notifications" element={<PatientNotifications />} />
                <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
              </Routes>
            </RoleBasedLayout>
          </RoleProtectedRoute>
        } />

        {/* Patient Feature Top-Level Aliases (Guarded for Patient role only) */}
        <Route path="/dashboard" element={<Navigate to="/patient/dashboard" replace />} />
        <Route path="/predict" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><SymptomChecker /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/symptom-checker" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><SymptomChecker /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/doctors" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><DoctorSearch /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/teleconsultations" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><DoctorSearch /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/consult" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><DoctorRecommendation /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/prescriptions" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><PatientPrescriptions /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/pharmacy" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><PharmacyStore /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/orders" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><PatientOrders /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/settings" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><PatientSettings /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/notifications" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><PatientNotifications /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/labs" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><LabDiagnostics /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/reports" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><ReportAnalyzer /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/chat" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><Chatbot /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/records" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><HealthRecords /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/twin" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><PatientTwin /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/trials" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><TrialsExplorer /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/billing" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT]}>
            <RoleBasedLayout><Billing /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/consultation/:appointmentId" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PATIENT, UserRoles.DOCTOR]}>
            <RoleBasedLayout><ConsultationRoom /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />

        {/* ========================================================================= */}
        {/* 2. DOCTOR PORTAL ROUTES (Allowed for 'doctor' role only)                    */}
        {/* ========================================================================= */}
        <Route path="/doctor/*" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.DOCTOR]}>
            <RoleBasedLayout>
              <Routes>
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="consultation" element={<ConsultationRoom />} />
                <Route path="consultation/:appointmentId" element={<ConsultationRoom />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="availability" element={<DoctorAvailability />} />
                <Route path="schedule" element={<DoctorAvailability />} />
                <Route path="profile" element={<DoctorProfile />} />
                <Route path="ai-insights" element={<AiInsights />} />
                <Route path="records" element={<DoctorHealthRecords />} />
                <Route path="patients/:patientId" element={<DoctorHealthRecords />} />
                <Route path="prescribe" element={<PrescriptionGenerator />} />
                <Route path="prescription" element={<PrescriptionGenerator />} />
                <Route path="analytics" element={<DoctorAnalytics />} />
                <Route path="notifications" element={<DoctorNotifications />} />
                <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
              </Routes>
            </RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/analytics" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.DOCTOR]}>
            <RoleBasedLayout><Analytics /></RoleBasedLayout>
          </RoleProtectedRoute>
        } />

        {/* ========================================================================= */}
        {/* 3. PHARMACY PORTAL ROUTES (Allowed for 'pharmacist' role only)              */}
        {/* ========================================================================= */}
        <Route path="/pharmacy/*" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.PHARMACIST]}>
            <RoleBasedLayout>
              <Routes>
                <Route path="dashboard" element={<PharmacyDashboard />} />
                <Route path="orders" element={<OrderProcessing />} />
                <Route path="orders/:id" element={<OrderProcessing />} />
                <Route path="inventory" element={<InventoryManagement />} />
                <Route path="inventory/batches" element={<BatchManagement />} />
                <Route path="batches" element={<BatchManagement />} />
                <Route path="medicines" element={<MedicineCatalog />} />
                <Route path="verification" element={<PharmacyVerification />} />
                <Route path="analytics" element={<PharmacyAnalytics />} />
                <Route path="profile" element={<PharmacyProfile />} />
                <Route path="notifications" element={<PharmacyNotifications />} />
                <Route path="*" element={<Navigate to="/pharmacy/dashboard" replace />} />
              </Routes>
            </RoleBasedLayout>
          </RoleProtectedRoute>
        } />

        {/* ========================================================================= */}
        {/* 4. ADMIN PORTAL ROUTES (Allowed for 'admin' role only)                      */}
        {/* ========================================================================= */}
        <Route path="/admin/*" element={
          <RoleProtectedRoute allowedRoles={[UserRoles.ADMIN]}>
            <RoleBasedLayout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="patients" element={<PatientManagement />} />
                <Route path="doctors" element={<DoctorManagement />} />
                <Route path="pharmacies" element={<PharmacyManagement />} />
                <Route path="doctor-verification" element={<AdminDoctorVerification />} />
                <Route path="doctor-approvals" element={<DoctorApprovals />} />
                <Route path="pharmacy-verification" element={<AdminPharmacyVerification />} />
                <Route path="pharmacy-approvals" element={<PharmacyApprovals />} />
                <Route path="roles" element={<RoleManagement />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="analytics" element={<PlatformAnalytics />} />
                <Route path="ai-usage" element={<AIUsageMonitoring />} />
                <Route path="security" element={<SecurityMonitoring />} />
                <Route path="notifications" element={<NotificationManagement />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="system-settings" element={<SystemSettings />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </RoleBasedLayout>
          </RoleProtectedRoute>
        } />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Fallback to Default Home */}
        <Route path="*" element={getDefaultHome()} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Dynamic Role-Based Layout
 * Adapts Sidebar and Navigation strictly according to the logged-in canonical role.
 * Cross-role switching is removed; security is enforced at both route and database levels.
 */
function RoleBasedLayout({ children }) {
  const { 
    user, 
    profile, 
    role, 
    logout, 
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // 1. Dynamic Menu Definition by Role (Only 4 Canonical Roles)
  const getMenuItems = () => {
    if (role === UserRoles.DOCTOR) {
      return [
        { name: 'Doctor Dashboard', path: '/doctor/dashboard', icon: Stethoscope },
        { name: 'Patient Queue', path: '/doctor/appointments', icon: Calendar },
        { name: 'Availability & Slots', path: '/doctor/availability', icon: Clock },
        { name: 'Doctor Profile', path: '/doctor/profile', icon: UserCheck },
        { name: 'Issue Digital Rx', path: '/doctor/prescribe', icon: FilePlus2 },
        { name: 'Patient EHR Vault', path: '/doctor/records', icon: FolderOpen },
        { name: 'AI Clinical Telemetry', path: '/doctor/ai-insights', icon: Activity },
        { name: 'Notifications', path: '/doctor/notifications', icon: Bell },
        { name: 'Practice Analytics', path: '/doctor/analytics', icon: TrendingUp }
      ];
    }
    if (role === UserRoles.PHARMACIST) {
      return [
        { name: 'Pharmacy Dashboard', path: '/pharmacy/dashboard', icon: Store },
        { name: 'Prescription Orders', path: '/pharmacy/orders', icon: ShoppingBag },
        { name: 'Drug Inventory', path: '/pharmacy/inventory', icon: Package },
        { name: 'Batch & Expiry', path: '/pharmacy/inventory/batches', icon: Layers },
        { name: 'Drug Catalog', path: '/pharmacy/medicines', icon: FileText },
        { name: 'Accreditation', path: '/pharmacy/verification', icon: ShieldCheck },
        { name: 'Notifications', path: '/pharmacy/notifications', icon: Bell },
        { name: 'Pharmacy Analytics', path: '/pharmacy/analytics', icon: TrendingUp },
        { name: 'Dispensary Profile', path: '/pharmacy/profile', icon: Settings }
      ];
    }
    if (role === UserRoles.ADMIN) {
      return [
        { name: 'Admin Overview', path: '/admin/dashboard', icon: ShieldCheck },
        { name: 'User Governance', path: '/admin/users', icon: Users },
        { name: 'Patient Directory', path: '/admin/patients', icon: UserCheck },
        { name: 'Doctor Directory', path: '/admin/doctors', icon: Stethoscope },
        { name: 'Pharmacy Directory', path: '/admin/pharmacies', icon: Store },
        { name: 'Doctor Verification', path: '/admin/doctor-verification', icon: ShieldCheck },
        { name: 'Pharmacy Verification', path: '/admin/pharmacy-verification', icon: CheckCircle2 },
        { name: 'Role Governance', path: '/admin/roles', icon: Lock },
        { name: 'Audit & Compliance', path: '/admin/audit-logs', icon: FileText },
        { name: 'Platform Analytics', path: '/admin/analytics', icon: TrendingUp },
        { name: 'AI Telemetry', path: '/admin/ai-usage', icon: Zap },
        { name: 'Security Defense', path: '/admin/security', icon: AlertTriangle },
        { name: 'Notifications', path: '/admin/notifications', icon: Bell },
        { name: 'System Settings', path: '/admin/settings', icon: Settings }
      ];
    }
    // Default: Patient Menu
    return [
      { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
      { name: 'Symptom Checker', path: '/predict', icon: Activity },
      { name: 'Consult Doctors', path: '/doctors', icon: Stethoscope },
      { name: 'My Appointments', path: '/patient/appointments', icon: Calendar },
      { name: 'Prescriptions & Rx', path: '/prescriptions', icon: FileText },
      { name: 'Pharmacy Store', path: '/pharmacy', icon: Store },
      { name: 'My Orders', path: '/patient/orders', icon: ShoppingBag },
      { name: 'Health Records', path: '/records', icon: FolderOpen },
      { name: 'Patient Twin', path: '/twin', icon: UserSquare2 },
      { name: 'Notifications', path: '/patient/notifications', icon: Bell },
      { name: 'My Profile', path: '/patient/profile', icon: UserSquare2 },
      { name: 'Settings', path: '/patient/settings', icon: Settings },
      { name: 'Clinical Chatbot', path: '/chat', icon: MessageSquare },
      { name: 'Report Analyzer', path: '/reports', icon: FileText },
      { name: 'Trials Explorer', path: '/trials', icon: BookOpen }
    ];
  };

  const menuItems = getMenuItems();

  const getRoleBadge = () => {
    if (role === UserRoles.DOCTOR) return { label: 'DOCTOR (APPROVED)', bg: '#dcfce7', text: '#166534' };
    if (role === UserRoles.PHARMACIST) return { label: 'PHARMACY (LICENSED)', bg: '#eff6ff', text: '#1d4ed8' };
    if (role === UserRoles.ADMIN) return { label: 'ADMINISTRATOR', bg: '#fef3c7', text: '#92400e' };
    return { label: 'PATIENT', bg: '#f1f5f9', text: '#334155' };
  };

  const badge = getRoleBadge();
  const hasDedicatedHeader = (role === UserRoles.DOCTOR && (
    location.pathname === '/doctor/dashboard' ||
    location.pathname === '/doctor/ai-insights' ||
    location.pathname === '/doctor/records' ||
    location.pathname.startsWith('/doctor/consultation')
  )) || (role === UserRoles.PATIENT && (
    location.pathname === '/predict' ||
    location.pathname === '/symptom-checker' ||
    location.pathname === '/prescriptions' ||
    location.pathname === '/labs' ||
    location.pathname === '/records'
  ));

  return (
    <div className="app-container">
      {/* Dynamic Sidebar */}
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        {role === UserRoles.DOCTOR ? (
          <>
            {/* Clinical Intel Suite Brand */}
            <div style={{ padding: '24px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#0a4bb5',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)'
              }}>
                <Activity size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.15 }}>
                  MediMind AI
                </h1>
                <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.08em', color: '#64748b' }}>
                  CLINICAL INTEL SUITE
                </span>
              </div>
            </div>

            {/* CLINICAL WORKFLOWS GROUP */}
            <div style={{ padding: '16px 20px 6px 20px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              CLINICAL WORKFLOWS
            </div>
            <ul className="sidebar-menu" style={{ padding: '0 12px', listStyle: 'none' }}>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/doctor/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        background: isActive ? '#0a4bb5' : 'transparent',
                        color: isActive ? '#ffffff' : '#475569',
                        fontWeight: isActive ? '700' : '500'
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontSize: '13px' }}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Doctor Footer */}
            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#0a4bb5',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: '13px'
                }}>
                  {(profile?.full_name || profile?.name || 'Dr').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {profile?.full_name || profile?.name || 'Doctor Account'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    {profile?.specialization || 'Attending Physician'}
                  </div>
                </div>
                <button 
                  onClick={logout} 
                  title="Sign Out"
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </>
        ) : role === UserRoles.PATIENT ? (
          <>
            {/* Patient Portal Brand */}
            <div style={{ padding: '24px 20px 16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#0a4bb5',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(10, 75, 181, 0.25)'
              }}>
                <Activity size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0, lineHeight: 1.15 }}>
                  MediMind AI
                </h1>
                <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.08em', color: '#64748b' }}>
                  PATIENT HEALTHCARE PORTAL
                </span>
              </div>
            </div>

            {/* Patient Workflow Navigation */}
            <ul className="sidebar-menu" style={{ padding: '10px 12px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path === '/patient/dashboard' && location.pathname === '/dashboard');
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        background: isActive ? '#0a4bb5' : 'transparent',
                        color: isActive ? '#ffffff' : '#475569',
                        fontWeight: isActive ? '700' : '500'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Icon size={17} />
                        <span style={{ fontSize: '12.5px' }}>{item.name}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Emergency SOS Box & Patient Footer */}
            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '9.5px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px' }}>
                  EMERGENCY SOS
                </span>
                <p style={{ fontSize: '11px', color: '#7f1d1d', margin: '6px 0 10px 0', lineHeight: '1.3' }}>
                  Need immediate medical help? Direct line to emergency responders.
                </p>
                <button 
                  onClick={() => alert('🚨 Connecting immediately to 108 Emergency Ambulance Dispatch...')}
                  style={{
                    width: '100%',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    fontSize: '11.5px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.2)'
                  }}
                >
                  <span>🚨</span> 108 Ambulance
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#0f766e',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px'
                }}>
                  {(profile?.full_name || profile?.name || user?.email || 'P').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {profile?.full_name || profile?.name || user?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Patient Account
                  </div>
                </div>
                <button 
                  onClick={logout} 
                  title="Sign Out"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Pharmacy & Admin Sidebars */}
            <div className="sidebar-brand" style={{ padding: '24px 20px 16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: role === UserRoles.ADMIN ? '#92400e' : '#0a4bb5',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {role === UserRoles.ADMIN ? <ShieldCheck size={22} /> : <Store size={22} />}
                </div>
                <div>
                  <h1 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>MediMind AI</h1>
                  <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.05em' }}>
                    {role ? role.toUpperCase() : 'USER'} WORKSPACE
                  </span>
                </div>
              </div>
            </div>

            <div className="sidebar-section-title" style={{ padding: '12px 20px 4px 20px', fontSize: '10px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
              Navigation
            </div>
            <ul className="sidebar-menu" style={{ padding: '0 12px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto' }}>
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && item.path !== '/pharmacy/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`sidebar-item ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        background: isActive ? (role === UserRoles.ADMIN ? '#92400e' : '#0a4bb5') : 'transparent',
                        color: isActive ? '#ffffff' : '#475569',
                        fontWeight: isActive ? '700' : '500'
                      }}
                    >
                      <Icon size={18} />
                      <span style={{ fontSize: '13px' }}>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '8px 10px', borderRadius: '8px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: role === UserRoles.ADMIN ? '#92400e' : '#0a4bb5',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '13px'
                }}>
                  {(profile?.pharmacy_name || profile?.full_name || profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h5 style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e293b', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {profile?.pharmacy_name || profile?.full_name || profile?.name || user?.email?.split('@')[0]}
                  </h5>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: badge.bg,
                    color: badge.text
                  }}>
                    {badge.label}
                  </span>
                </div>
                <button 
                  onClick={logout} 
                  title="Sign Out"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="main-content" style={{ padding: 0 }}>
        {!hasDedicatedHeader && (
          <header className="main-header">
            <div className="header-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder={`Search ${role || 'workspace'}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="header-actions" style={{ position: 'relative' }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '700',
                background: badge.bg,
                color: badge.text
              }}>
                <CheckCircle2 size={13} /> {badge.label}
              </span>

              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowNotifications(prev => !prev)}
                  title="Clinical Notifications"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Bell size={20} />
                  {unreadNotificationsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: '#dc2626',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: '800',
                      borderRadius: '50%',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 2px'
                    }}>
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '36px',
                    right: 0,
                    width: '360px',
                    maxHeight: '440px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '14px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bell size={16} color="#0a4bb5" />
                        <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: '#0f172a' }}>Clinical Alerts</h4>
                        {unreadNotificationsCount > 0 && (
                          <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '10.5px', fontWeight: '800', padding: '1px 6px', borderRadius: '4px' }}>
                            {unreadNotificationsCount} new
                          </span>
                        )}
                      </div>
                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsAsRead()}
                          style={{ border: 'none', background: 'none', color: '#0a4bb5', fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div style={{ overflowY: 'auto', maxHeight: '340px', padding: '8px 0' }}>
                      {(!notifications || notifications.length === 0) ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                          <CheckCircle2 size={28} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
                          <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '600' }}>No notifications</p>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Real-time sync active</span>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              if (!notif.is_read) markNotificationAsRead(notif.id);
                            }}
                            style={{
                              padding: '10px 16px',
                              borderBottom: '1px solid #f8fafc',
                              cursor: 'pointer',
                              background: notif.is_read ? '#ffffff' : '#f0f7ff',
                              display: 'flex',
                              gap: '10px',
                              alignItems: 'flex-start',
                              transition: 'background 0.15s'
                            }}
                          >
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: notif.is_read ? 'transparent' : '#0a4bb5',
                              marginTop: '5px',
                              flexShrink: 0
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: notif.is_read ? '600' : '750', color: '#0f172a' }}>
                                  {notif.title || 'System Alert'}
                                </h5>
                                <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px', flexShrink: 0 }}>
                                  {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p style={{ margin: '3px 0 0 0', fontSize: '11.5px', color: '#475569', lineHeight: '1.4' }}>
                                {notif.message || notif.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div style={{
                      padding: '8px 16px',
                      borderTop: '1px solid #f1f5f9',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      color: '#64748b'
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                        Live Sync Active
                      </span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link
                          to={
                            role === UserRoles.DOCTOR
                              ? '/doctor/notifications'
                              : role === UserRoles.PHARMACIST
                              ? '/pharmacy/notifications'
                              : role === UserRoles.ADMIN
                              ? '/admin/notifications'
                              : '/patient/notifications'
                          }
                          onClick={() => setShowNotifications(false)}
                          style={{ color: '#0a4bb5', fontSize: '11px', fontWeight: '700', textDecoration: 'none' }}
                        >
                          View All
                        </Link>
                        <button
                          onClick={() => setShowNotifications(false)}
                          style={{ border: 'none', background: 'none', color: '#64748b', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        <div style={{ flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
