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
  Layers
} from 'lucide-react';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';

// Public & Auth Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
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

// Pharmacy Portal Pages
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import OrderProcessing from './pages/pharmacy/OrderProcessing';
import InventoryManagement from './pages/pharmacy/InventoryManagement';
import BatchManagement from './pages/pharmacy/BatchManagement';
import MedicineCatalog from './pages/pharmacy/MedicineCatalog';
import PharmacyVerification from './pages/pharmacy/PharmacyVerification';
import PharmacyAnalytics from './pages/pharmacy/PharmacyAnalytics';
import PharmacyProfile from './pages/pharmacy/PharmacyProfile';

// Super Admin Portal Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import DoctorApprovals from './pages/admin/DoctorApprovals';
import PharmacyApprovals from './pages/admin/PharmacyApprovals';
import AuditLogs from './pages/admin/AuditLogs';
import UserManagement from './pages/admin/UserManagement';
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
  const { user, profile, role, approvalStatus, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f8fafc',
        color: '#0a4bb5',
        fontSize: '20px',
        fontWeight: 'bold',
        gap: '12px'
      }}>
        <Activity className="animate-spin" size={24} />
        Loading MediMind Architecture Workspace...
      </div>
    );
  }

  // Determine home landing redirection for testing and logged in users
  const getDefaultHome = () => {
    if ((role === 'doctor' || role === 'pharmacy' || role === 'pharmacist') && approvalStatus !== 'approved') {
      return <Navigate to="/pending-approval" />;
    }
    if (role === 'doctor') return <Navigate to="/doctor/dashboard" />;
    if (role === 'pharmacy' || role === 'pharmacist') return <Navigate to="/pharmacy/dashboard" />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" />;
    return <Navigate to="/predict" />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={getDefaultHome()} />
        {/* Real Supabase Authentication Routes */}
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        
        {/* Admin Approval Gate waiting screen */}
        <Route path="/pending-approval" element={user ? <PendingApproval /> : <Navigate to="/login" />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Multi-Role Portal with Dynamic Layout */}
        <Route path="/*" element={
          <ApprovalGateGuard>
            <RoleBasedLayout>
              <Routes>
                {/* Patient Routes */}
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/predict" element={<SymptomChecker />} />
                <Route path="/symptom-checker" element={<SymptomChecker />} />
                <Route path="/doctors" element={<DoctorSearch />} />
                <Route path="/teleconsultations" element={<DoctorSearch />} />
                <Route path="/consult" element={<DoctorRecommendation />} />
                <Route path="/prescriptions" element={<PatientPrescriptions />} />
                <Route path="/pharmacy" element={<PharmacyStore />} />
                <Route path="/patient/orders" element={<PatientOrders />} />
                <Route path="/orders" element={<PatientOrders />} />
                <Route path="/patient/appointments" element={<PatientAppointments />} />
                <Route path="/patient/profile" element={<PatientProfile />} />
                <Route path="/patient/settings" element={<PatientSettings />} />
                <Route path="/settings" element={<PatientSettings />} />
                <Route path="/patient/notifications" element={<PatientNotifications />} />
                <Route path="/notifications" element={<PatientNotifications />} />
                <Route path="/labs" element={<LabDiagnostics />} />
                <Route path="/reports" element={<ReportAnalyzer />} />
                <Route path="/chat" element={<Chatbot />} />
                <Route path="/records" element={<HealthRecords />} />
                <Route path="/twin" element={<PatientTwin />} />
                <Route path="/trials" element={<TrialsExplorer />} />
                <Route path="/billing" element={<Billing />} />

                {/* Doctor Routes */}
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route path="/doctor/consultation" element={<ConsultationRoom />} />
                <Route path="/doctor/consultation/:appointmentId" element={<ConsultationRoom />} />
                <Route path="/doctor/appointments" element={<DoctorAppointments />} />
                <Route path="/doctor/availability" element={<DoctorAvailability />} />
                <Route path="/doctor/schedule" element={<DoctorAvailability />} />
                <Route path="/doctor/profile" element={<DoctorProfile />} />
                <Route path="/doctor/ai-insights" element={<AiInsights />} />
                <Route path="/doctor/records" element={<DoctorHealthRecords />} />
                <Route path="/doctor/patients/:patientId" element={<DoctorHealthRecords />} />
                <Route path="/doctor/prescribe" element={<PrescriptionGenerator />} />
                <Route path="/doctor/prescription" element={<PrescriptionGenerator />} />
                <Route path="/doctor/analytics" element={<DoctorAnalytics />} />
                <Route path="/analytics" element={<Analytics />} />

                {/* Pharmacy Routes */}
                <Route path="/pharmacy/dashboard" element={<PharmacyDashboard />} />
                <Route path="/pharmacy/orders" element={<OrderProcessing />} />
                <Route path="/pharmacy/orders/:id" element={<OrderProcessing />} />
                <Route path="/pharmacy/inventory" element={<InventoryManagement />} />
                <Route path="/pharmacy/inventory/batches" element={<BatchManagement />} />
                <Route path="/pharmacy/batches" element={<BatchManagement />} />
                <Route path="/pharmacy/medicines" element={<MedicineCatalog />} />
                <Route path="/pharmacy/verification" element={<PharmacyVerification />} />
                <Route path="/pharmacy/analytics" element={<PharmacyAnalytics />} />
                <Route path="/pharmacy/profile" element={<PharmacyProfile />} />

                {/* Super Admin Routes */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/doctor-approvals" element={<DoctorApprovals />} />
                <Route path="/admin/pharmacy-approvals" element={<PharmacyApprovals />} />
                <Route path="/admin/users" element={<UserManagement />} />
                <Route path="/admin/settings" element={<SystemSettings />} />
                <Route path="/admin/system-settings" element={<SystemSettings />} />
                <Route path="/admin/audit-logs" element={<AuditLogs />} />

                <Route path="*" element={getDefaultHome()} />
              </Routes>
            </RoleBasedLayout>
          </ApprovalGateGuard>
        } />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Mandatory Admin Approval Gate Guard:
 * If a Doctor or Pharmacy is NOT approved, they cannot access their clinical portal
 * and are redirected to /pending-approval.
 */
function ApprovalGateGuard({ children }) {
  const { user, role, approvalStatus } = useAuth();
  const location = useLocation();

  // In Testing Mode: bypass signup/login requirements
  if ((role === 'doctor' || role === 'pharmacy' || role === 'pharmacist') && approvalStatus !== 'approved') {
    if (location.pathname !== '/pending-approval') {
      return <Navigate to="/pending-approval" />;
    }
  }

  return children;
}

/**
 * Dynamic Role-Based Layout
 * Adapts Sidebar and Navigation according to the logged-in role (Patient, Doctor, Pharmacy, Admin)
 */
function RoleBasedLayout({ children }) {
  const { 
    user, 
    profile, 
    role, 
    logout, 
    switchRole,
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
  } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-sync role when visiting doctor or admin portal routes
  React.useEffect(() => {
    // Only match /doctor/... routes (e.g. /doctor/dashboard, /doctor/appointments)
    // NEVER match /doctors which is the patient teleconsultation & doctor search route!
    if ((location.pathname === '/doctor' || location.pathname.startsWith('/doctor/')) && role !== 'doctor') {
      switchRole('doctor');
    } else if ((location.pathname === '/admin' || location.pathname.startsWith('/admin/')) && role !== 'admin') {
      switchRole('admin');
    } else if (location.pathname.startsWith('/pharmacy/') && role !== 'pharmacy' && role !== 'pharmacist') {
      switchRole('pharmacist');
    } else if (
      (location.pathname === '/predict' ||
       location.pathname === '/symptom-checker' ||
       location.pathname === '/doctors' ||
       location.pathname === '/teleconsultations' ||
       location.pathname === '/dashboard' ||
       location.pathname === '/prescriptions' ||
       location.pathname === '/pharmacy' ||
       location.pathname === '/patient/orders' ||
       location.pathname === '/orders' ||
       location.pathname === '/patient/appointments' ||
       location.pathname === '/patient/profile' ||
       location.pathname === '/patient/settings' ||
       location.pathname === '/settings' ||
       location.pathname === '/patient/notifications' ||
       location.pathname === '/notifications' ||
       location.pathname === '/labs' ||
       location.pathname === '/reports' ||
       location.pathname === '/twin' ||
       location.pathname === '/records') && role !== 'patient'
    ) {
      switchRole('patient');
    }
  }, [location.pathname, role, switchRole]);

  // 1. Dynamic Menu Definition by Role
  const getMenuItems = () => {
    if (role === 'doctor') {
      return [
        { name: 'Doctor Dashboard', path: '/doctor/dashboard', icon: Stethoscope },
        { name: 'Patient Queue', path: '/doctor/appointments', icon: Calendar },
        { name: 'Availability & Slots', path: '/doctor/availability', icon: Clock },
        { name: 'Doctor Profile', path: '/doctor/profile', icon: UserCheck },
        { name: 'Issue Digital Rx', path: '/doctor/prescribe', icon: FilePlus2 },
        { name: 'Patient EHR Vault', path: '/doctor/records', icon: FolderOpen },
        { name: 'AI Clinical Telemetry', path: '/doctor/ai-insights', icon: Activity },
        { name: 'Practice Analytics', path: '/doctor/analytics', icon: TrendingUp }
      ];
    }
    if (role === 'pharmacy' || role === 'pharmacist') {
      return [
        { name: 'Pharmacy Dashboard', path: '/pharmacy/dashboard', icon: Store },
        { name: 'Prescription Orders', path: '/pharmacy/orders', icon: ShoppingBag },
        { name: 'Drug Inventory', path: '/pharmacy/inventory', icon: Package },
        { name: 'Batch & Expiry', path: '/pharmacy/inventory/batches', icon: Layers },
        { name: 'Drug Catalog', path: '/pharmacy/medicines', icon: FileText },
        { name: 'Accreditation', path: '/pharmacy/verification', icon: ShieldCheck },
        { name: 'Pharmacy Analytics', path: '/pharmacy/analytics', icon: TrendingUp },
        { name: 'Dispensary Profile', path: '/pharmacy/profile', icon: Settings }
      ];
    }
    if (role === 'admin') {
      return [
        { name: 'Admin Overview', path: '/admin/dashboard', icon: ShieldCheck },
        { name: 'User Governance', path: '/admin/users', icon: Users },
        { name: 'Doctor Approvals', path: '/admin/doctor-approvals', icon: Stethoscope },
        { name: 'Pharmacy Approvals', path: '/admin/pharmacy-approvals', icon: Store },
        { name: 'Audit & Compliance', path: '/admin/audit-logs', icon: FileText },
        { name: 'System Settings', path: '/admin/settings', icon: Settings }
      ];
    }
    // Default: Patient Menu
    return [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
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
    if (role === 'doctor') return { label: 'DOCTOR (APPROVED)', bg: '#dcfce7', text: '#166534' };
    if (role === 'pharmacy' || role === 'pharmacist') return { label: 'PHARMACY (LICENSED)', bg: '#eff6ff', text: '#1d4ed8' };
    if (role === 'admin') return { label: 'SUPER ADMIN', bg: '#fef3c7', text: '#92400e' };
    return { label: 'PATIENT', bg: '#f1f5f9', text: '#334155' };
  };

  const badge = getRoleBadge();
  const hasDedicatedHeader = (role === 'doctor' && (
    location.pathname === '/doctor/dashboard' ||
    location.pathname === '/doctor/ai-insights' ||
    location.pathname === '/doctor/records' ||
    location.pathname.startsWith('/doctor/consultation')
  )) || (role === 'patient' && (
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
        {role === 'doctor' ? (
          <>
            {/* Exact Clinical Intel Suite Brand from screenshot */}
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
              <li>
                <Link
                  to="/doctor/dashboard"
                  className={`sidebar-item ${location.pathname === '/doctor/dashboard' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/doctor/dashboard' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/doctor/dashboard' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/doctor/dashboard' ? '700' : '500'
                  }}
                >
                  <LayoutDashboard size={18} />
                  <span style={{ fontSize: '13px' }}>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/doctor/consultation"
                  className={`sidebar-item ${location.pathname.startsWith('/doctor/consultation') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname.startsWith('/doctor/consultation') ? '#0a4bb5' : 'transparent',
                    color: location.pathname.startsWith('/doctor/consultation') ? '#ffffff' : '#475569',
                    fontWeight: location.pathname.startsWith('/doctor/consultation') ? '700' : '500'
                  }}
                >
                  <MessageSquare size={18} />
                  <span style={{ fontSize: '13px' }}>Consultations & Telemed</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/doctor/appointments"
                  className={`sidebar-item ${location.pathname === '/doctor/appointments' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/doctor/appointments' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/doctor/appointments' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/doctor/appointments' ? '700' : '500'
                  }}
                >
                  <Users size={18} />
                  <span style={{ fontSize: '13px' }}>Ward Census</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className={`sidebar-item ${location.pathname === '/analytics' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/analytics' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/analytics' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/analytics' ? '700' : '500'
                  }}
                >
                  <TrendingUp size={18} />
                  <span style={{ fontSize: '13px' }}>Clinical Analytics</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/doctor/ai-insights"
                  className={`sidebar-item ${location.pathname === '/doctor/ai-insights' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/doctor/ai-insights' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/doctor/ai-insights' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/doctor/ai-insights' ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={18} />
                    <span style={{ fontSize: '13px' }}>AI Insights</span>
                  </div>
                  <span style={{
                    background: location.pathname === '/doctor/ai-insights' ? '#22c55e' : '#dcfce7',
                    color: location.pathname === '/doctor/ai-insights' ? '#ffffff' : '#166534',
                    fontSize: '9.5px',
                    fontWeight: '800',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    NEW
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/doctor/records"
                  className={`sidebar-item ${location.pathname === '/doctor/records' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/doctor/records' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/doctor/records' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/doctor/records' ? '700' : '500'
                  }}
                >
                  <FileText size={18} />
                  <span style={{ fontSize: '13px' }}>Health Records</span>
                </Link>
              </li>
            </ul>

            {/* Doctor Footer with Emergency Override and Doctor Profile */}
            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
              <button 
                onClick={() => alert('🚨 EMERGENCY OVERRIDE PROTOCOL ACTIVATED: Critical cardiac ward code override active.')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: '#b91c1c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: '800',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  marginBottom: '14px',
                  boxShadow: '0 2px 4px rgba(185, 28, 28, 0.2)'
                }}
              >
                <span>⚠</span> Emergency Override
              </button>

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
                  SC
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    Dr. Sarah Chen, MD
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap' }}>
                    Attending Cardiologist
                  </div>
                </div>
                <button 
                  onClick={() => { switchRole('patient'); }} 
                  title="Switch to Patient Portal"
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <MoreVertical size={16} />
                </button>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    to="/twin"
                    onClick={() => switchRole('patient')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', color: '#0a4bb5', fontWeight: '700' }}
                  >
                    <UserSquare2 size={13} />
                    <span>Patient Portal</span>
                  </Link>
                  <ChevronRight size={13} color="#0a4bb5" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    to="/admin/dashboard"
                    onClick={() => switchRole('admin')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', color: '#92400e', fontWeight: '700' }}
                  >
                    <ShieldCheck size={13} />
                    <span>Super Admin Portal</span>
                  </Link>
                  <ChevronRight size={13} color="#92400e" />
                </div>
              </div>
            </div>
          </>
        ) : role === 'patient' ? (
          <>
            {/* Exact Patient Portal Brand from screenshot */}
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
                <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.06em', color: '#64748b' }}>
                  PATIENT HEALTHCARE PORTAL
                </span>
              </div>
            </div>

            {/* Patient Workflow Navigation */}
            <ul className="sidebar-menu" style={{ padding: '10px 12px', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
              {/* 1. Dashboard */}
              <li>
                <Link
                  to="/dashboard"
                  className={`sidebar-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/dashboard' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/dashboard' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/dashboard' ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LayoutDashboard size={17} />
                    <span style={{ fontSize: '12.5px' }}>Dashboard</span>
                  </div>
                </Link>
              </li>

              {/* 2. Overview & Digital Twin */}
              <li>
                <Link
                  to="/twin"
                  className={`sidebar-item ${location.pathname === '/twin' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/twin' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/twin' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/twin' ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <UserSquare2 size={17} />
                    <span style={{ fontSize: '12.5px' }}>Digital Twin Avatar</span>
                  </div>
                  <span style={{ background: '#dcfce7', color: '#166534', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>
                    Live
                  </span>
                </Link>
              </li>

              {/* 3. AI Disease Predictor */}
              <li>
                <Link
                  to="/predict"
                  className={`sidebar-item ${(location.pathname === '/predict' || location.pathname === '/symptom-checker') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: (location.pathname === '/predict' || location.pathname === '/symptom-checker') ? '#0a4bb5' : 'transparent',
                    color: (location.pathname === '/predict' || location.pathname === '/symptom-checker') ? '#ffffff' : '#475569',
                    fontWeight: (location.pathname === '/predict' || location.pathname === '/symptom-checker') ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Activity size={17} />
                    <span style={{ fontSize: '12.5px' }}>AI Symptom Checker</span>
                  </div>
                  <span style={{
                    background: (location.pathname === '/predict' || location.pathname === '/symptom-checker') ? 'rgba(255,255,255,0.2)' : '#dbeafe',
                    color: (location.pathname === '/predict' || location.pathname === '/symptom-checker') ? '#ffffff' : '#1d4ed8',
                    fontSize: '9px',
                    fontWeight: '800',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    Dual AI
                  </span>
                </Link>
              </li>

              {/* 4. Tele-Consultations & Doctor Search */}
              <li>
                <Link
                  to="/teleconsultations"
                  className={`sidebar-item ${(location.pathname === '/teleconsultations' || location.pathname === '/doctors') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: (location.pathname === '/teleconsultations' || location.pathname === '/doctors') ? '#0a4bb5' : 'transparent',
                    color: (location.pathname === '/teleconsultations' || location.pathname === '/doctors') ? '#ffffff' : '#475569',
                    fontWeight: (location.pathname === '/teleconsultations' || location.pathname === '/doctors') ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Video size={17} />
                    <span style={{ fontSize: '12.5px' }}>Find Doctors & Video</span>
                  </div>
                  <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: '9px', fontWeight: '800', padding: '1px 5px', borderRadius: '4px' }}>
                    Video
                  </span>
                </Link>
              </li>

              {/* 5. My Appointments */}
              <li>
                <Link
                  to="/patient/appointments"
                  className={`sidebar-item ${location.pathname === '/patient/appointments' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/patient/appointments' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/patient/appointments' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/patient/appointments' ? '700' : '500'
                  }}
                >
                  <Calendar size={17} />
                  <span style={{ fontSize: '12.5px' }}>My Appointments</span>
                </Link>
              </li>

              {/* 6. Prescriptions & Rx */}
              <li>
                <Link
                  to="/prescriptions"
                  className={`sidebar-item ${location.pathname === '/prescriptions' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/prescriptions' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/prescriptions' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/prescriptions' ? '700' : '500'
                  }}
                >
                  <FileText size={17} />
                  <span style={{ fontSize: '12.5px' }}>Prescriptions & Rx</span>
                </Link>
              </li>

              {/* 7. Pharmacy Store */}
              <li>
                <Link
                  to="/pharmacy"
                  className={`sidebar-item ${location.pathname === '/pharmacy' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/pharmacy' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/pharmacy' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/pharmacy' ? '700' : '500'
                  }}
                >
                  <Store size={17} />
                  <span style={{ fontSize: '12.5px' }}>Order Medicines</span>
                </Link>
              </li>

              {/* 8. My Orders */}
              <li>
                <Link
                  to="/patient/orders"
                  className={`sidebar-item ${(location.pathname === '/patient/orders' || location.pathname === '/orders') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: (location.pathname === '/patient/orders' || location.pathname === '/orders') ? '#0a4bb5' : 'transparent',
                    color: (location.pathname === '/patient/orders' || location.pathname === '/orders') ? '#ffffff' : '#475569',
                    fontWeight: (location.pathname === '/patient/orders' || location.pathname === '/orders') ? '700' : '500'
                  }}
                >
                  <ShoppingBag size={17} />
                  <span style={{ fontSize: '12.5px' }}>My Orders</span>
                </Link>
              </li>

              {/* 9. Diagnostic Reports */}
              <li>
                <Link
                  to="/reports"
                  className={`sidebar-item ${location.pathname === '/reports' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/reports' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/reports' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/reports' ? '700' : '500'
                  }}
                >
                  <FileText size={17} />
                  <span style={{ fontSize: '12.5px' }}>Report Analyzer</span>
                </Link>
              </li>

              {/* 10. ABDM Records Vault */}
              <li>
                <Link
                  to="/records"
                  className={`sidebar-item ${location.pathname === '/records' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/records' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/records' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/records' ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FolderOpen size={17} />
                    <span style={{ fontSize: '12.5px' }}>ABDM Health Locker</span>
                  </div>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }}></span>
                </Link>
              </li>

              {/* 11. My Profile */}
              <li>
                <Link
                  to="/patient/profile"
                  className={`sidebar-item ${location.pathname === '/patient/profile' ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: location.pathname === '/patient/profile' ? '#0a4bb5' : 'transparent',
                    color: location.pathname === '/patient/profile' ? '#ffffff' : '#475569',
                    fontWeight: location.pathname === '/patient/profile' ? '700' : '500'
                  }}
                >
                  <UserSquare2 size={17} />
                  <span style={{ fontSize: '12.5px' }}>Patient Profile</span>
                </Link>
              </li>

              {/* 12. Notifications */}
              <li>
                <Link
                  to="/patient/notifications"
                  className={`sidebar-item ${(location.pathname === '/patient/notifications' || location.pathname === '/notifications') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: (location.pathname === '/patient/notifications' || location.pathname === '/notifications') ? '#0a4bb5' : 'transparent',
                    color: (location.pathname === '/patient/notifications' || location.pathname === '/notifications') ? '#ffffff' : '#475569',
                    fontWeight: (location.pathname === '/patient/notifications' || location.pathname === '/notifications') ? '700' : '500'
                  }}
                >
                  <Bell size={17} />
                  <span style={{ fontSize: '12.5px' }}>Notifications</span>
                </Link>
              </li>

              {/* 13. Settings */}
              <li>
                <Link
                  to="/patient/settings"
                  className={`sidebar-item ${(location.pathname === '/patient/settings' || location.pathname === '/settings') ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    background: (location.pathname === '/patient/settings' || location.pathname === '/settings') ? '#0a4bb5' : 'transparent',
                    color: (location.pathname === '/patient/settings' || location.pathname === '/settings') ? '#ffffff' : '#475569',
                    fontWeight: (location.pathname === '/patient/settings' || location.pathname === '/settings') ? '700' : '500'
                  }}
                >
                  <Settings size={17} />
                  <span style={{ fontSize: '12.5px' }}>Settings & Privacy</span>
                </Link>
              </li>
            </ul>

            {/* Emergency SOS Box from screenshot */}
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    to="/doctor/dashboard"
                    onClick={() => switchRole('doctor')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', color: '#0a4bb5', fontWeight: '700' }}
                  >
                    <Stethoscope size={14} />
                    <span>Doctor Portal</span>
                  </Link>
                  <ChevronRight size={14} color="#0a4bb5" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    to="/admin/dashboard"
                    onClick={() => switchRole('admin')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', color: '#92400e', fontWeight: '700' }}
                  >
                    <ShieldCheck size={14} />
                    <span>Super Admin Portal</span>
                  </Link>
                  <ChevronRight size={14} color="#92400e" />
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="sidebar-brand">
              <h1>MediMind AI</h1>
              <span>{role.toUpperCase()} WORKSPACE</span>
            </div>

            <div className="sidebar-section-title">Navigation</div>
            <ul className="sidebar-menu">
              {menuItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link to={item.path} className={`sidebar-item ${isActive ? 'active' : ''}`}>
                      <Icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="sidebar-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#0a4bb5',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {profile?.name || user?.email?.split('@')[0]}
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
                  title="Logout"
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                >
                  <LogOut size={16} />
                </button>
              </div>

              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#64748b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    to="/twin"
                    onClick={() => switchRole('patient')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', color: '#0a4bb5', fontWeight: '700' }}
                  >
                    <UserSquare2 size={13} />
                    <span>Patient Portal</span>
                  </Link>
                  <ChevronRight size={13} color="#0a4bb5" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Link 
                    to="/doctor/dashboard"
                    onClick={() => switchRole('doctor')}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', textDecoration: 'none', color: '#166534', fontWeight: '700' }}
                  >
                    <Stethoscope size={13} />
                    <span>Doctor Portal</span>
                  </Link>
                  <ChevronRight size={13} color="#166534" />
                </div>
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
                placeholder={`Search ${role} workspace...`}
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
                          to="/patient/notifications"
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
