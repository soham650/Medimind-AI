import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/auth.service';
import { notificationService } from '../services/notification.service';
import { UserRoles } from '../types/database';

const AuthContext = createContext(null);

// Testing mode defaults for instant Patient module verification
const TEST_PATIENT_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'rahul.sharma@abdm',
  user_metadata: { full_name: 'Rahul Sharma', role: 'patient' }
};

const TEST_PATIENT_PROFILE = {
  id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Rahul Sharma',
  role: 'patient',
  email: 'rahul.sharma@abdm',
  phone: '+91 98765 43210',
  abha_id: '91-2345-6789-0123'
};

const TEST_DOCTOR_USER = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'dr.sarah.chen@medimind.ai',
  user_metadata: { full_name: 'Dr. Sarah Chen, MD', role: 'doctor' }
};

const TEST_DOCTOR_PROFILE = {
  id: '00000000-0000-0000-0000-000000000002',
  full_name: 'Dr. Sarah Chen, MD',
  role: 'doctor',
  email: 'dr.sarah.chen@medimind.ai',
  specialty: 'Attending Cardiologist',
  verification_status: 'approved',
  approval_status: 'approved'
};

const TEST_ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000003',
  email: 'admin@medimind.ai',
  user_metadata: { full_name: 'Platform Super Admin', role: 'admin' }
};

const TEST_ADMIN_PROFILE = {
  id: '00000000-0000-0000-0000-000000000003',
  full_name: 'Platform Super Admin',
  role: 'admin',
  email: 'admin@medimind.ai',
  verification_status: 'approved',
  approval_status: 'approved'
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(TEST_PATIENT_USER);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(TEST_PATIENT_PROFILE);
  const [role, setRole] = useState(UserRoles.PATIENT);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUserData = useCallback(async (userId) => {
    try {
      const userRole = await authService.getUserRole(userId);
      const userProfile = await authService.getUserProfile(userId, userRole);
      const userNotes = await notificationService.getNotifications(userId);

      setRole(userRole);
      setProfile(userProfile);
      setNotifications(userNotes);
    } catch (err) {
      console.error('Error hydrating user context:', err);
      // Keep patient testing fallback
      setUser(TEST_PATIENT_USER);
      setProfile(TEST_PATIENT_PROFILE);
      setRole(UserRoles.PATIENT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        // Testing mode enabled: Bypass sign up and default to Patient module
        setUser(TEST_PATIENT_USER);
        setProfile(TEST_PATIENT_PROFILE);
        setRole(UserRoles.PATIENT);
        setLoading(false);
      }
    });

    // 2. Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        // Testing mode enabled: Bypass sign up and default to Patient module
        setUser(TEST_PATIENT_USER);
        setProfile(TEST_PATIENT_PROFILE);
        setRole(UserRoles.PATIENT);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  // Real-time notification listener
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = notificationService.subscribe(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });
    return () => unsubscribe();
  }, [user?.id]);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    setUser(result.user);
    setSession(result.session);
    setRole(result.role);
    setProfile(result.profile);
    return result;
  };

  const register = async (email, password, metadata) => {
    const data = await authService.signup(email, password, {
      fullName: metadata.full_name || metadata.name,
      phone: metadata.phone || metadata.mobile,
      abhaId: metadata.abha_id
    });
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setProfile(null);
    setUser(null);
    setSession(null);
    setRole(UserRoles.PATIENT);
    setNotifications([]);
  };

  const switchRole = (newRole) => {
    if (newRole === UserRoles.DOCTOR || newRole === 'doctor') {
      setUser(TEST_DOCTOR_USER);
      setProfile(TEST_DOCTOR_PROFILE);
      setRole(UserRoles.DOCTOR);
    } else if (newRole === UserRoles.ADMIN || newRole === 'admin') {
      setUser(TEST_ADMIN_USER);
      setProfile(TEST_ADMIN_PROFILE);
      setRole(UserRoles.ADMIN);
    } else {
      setUser(TEST_PATIENT_USER);
      setProfile(TEST_PATIENT_PROFILE);
      setRole(UserRoles.PATIENT);
    }
  };

  const approvalStatus = profile?.verification_status || profile?.approval_status || 
    ((role === UserRoles.DOCTOR || role === UserRoles.PHARMACIST) ? 'pending' : 'approved');

  const isApproved = (role === UserRoles.PATIENT || role === UserRoles.ADMIN || role === UserRoles.SUPER_ADMIN) || approvalStatus === 'approved';

  const unreadNotificationsCount = notifications.filter(n => !n.is_read).length;

  const value = {
    user,
    session,
    profile,
    role,
    approvalStatus,
    isApproved,
    notifications,
    unreadNotificationsCount,
    loading,
    login,
    register,
    logout,
    switchRole,
    refreshProfile: () => user ? fetchUserData(user.id) : null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
