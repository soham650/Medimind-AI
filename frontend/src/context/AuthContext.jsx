import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/auth.service';
import { notificationService } from '../services/notification.service';
import { UserRoles } from '../types/database';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(UserRoles.PATIENT);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch role and profile from live Supabase tables for authenticated user
  const fetchUserData = useCallback(async (userId) => {
    try {
      const userRole = await authService.getUserRole(userId);
      const userProfile = await authService.getUserProfile(userId, userRole);
      const userNotes = await notificationService.getNotifications(userId);

      setRole(userRole || UserRoles.PATIENT);
      setProfile(userProfile);
      setNotifications(userNotes || []);
    } catch (err) {
      console.error('Error hydrating user context from Supabase:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen to live Supabase Auth session and state changes
  useEffect(() => {
    let mounted = true;

    // 1. Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setRole(UserRoles.PATIENT);
        setLoading(false);
      }
    });

    // 2. Auth changes listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        fetchUserData(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setRole(UserRoles.PATIENT);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Real-time notification listener for authenticated user
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = notificationService.subscribe(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });
    return () => unsubscribe();
  }, [user?.id]);

  // Real Supabase Auth login
  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      setSession(result.session);
      setRole(result.role);
      setProfile(result.profile);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Auth registration
  const register = async (email, password, metadata) => {
    setLoading(true);
    try {
      const data = await authService.signup(email, password, {
        fullName: metadata.full_name || metadata.name,
        phone: metadata.phone || metadata.mobile,
        abhaId: metadata.abha_id
      });
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Auth sign-out
  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(UserRoles.PATIENT);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Evaluation / Demo Login using real Supabase Auth
  // Signs in to a verified test account or creates it on the fly via Supabase Auth
  const loginDemo = async (targetRole = 'patient') => {
    setLoading(true);
    const demoEmail = import.meta.env.VITE_DEMO_PATIENT_EMAIL || `patient.eval.${targetRole}@medimind.ai`;
    const demoPassword = import.meta.env.VITE_DEMO_PATIENT_PASSWORD || 'MediMindDemo2026!';

    try {
      // 1. Attempt standard sign-in
      const res = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (!res.error && res.data?.user) {
        setUser(res.data.user);
        setSession(res.data.session);
        await fetchUserData(res.data.user.id);
        return res.data;
      }

      // 2. If user does not exist yet on this instance, register via standard Supabase Auth
      const signupRes = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPassword,
        options: {
          data: {
            full_name: targetRole === 'patient' ? 'Patient Demo' : (targetRole === 'doctor' ? 'Dr. Sarah Chen' : 'Apex Pharmacy'),
            name: targetRole === 'patient' ? 'Patient Demo' : (targetRole === 'doctor' ? 'Dr. Sarah Chen' : 'Apex Pharmacy'),
            phone: '+91 98765 43210',
            abha_id: '91-ABHA-DEMO-01',
            role: targetRole
          }
        }
      });

      if (signupRes.error) throw signupRes.error;

      // 3. Complete sign-in
      const signInAfterSignup = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword
      });

      if (signInAfterSignup.data?.user) {
        setUser(signInAfterSignup.data.user);
        setSession(signInAfterSignup.data.session);
        await fetchUserData(signInAfterSignup.data.user.id);
        return signInAfterSignup.data;
      }
    } catch (err) {
      console.error('Demo authentication notice:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const switchRole = (newRole) => {
    setRole(newRole);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (e) {
      console.warn('Error marking notification read:', e);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn('Error marking all notifications read:', e);
    }
  };

  const approvalStatus = profile?.verification_status || profile?.approval_status || 
    ((role === UserRoles.DOCTOR || role === UserRoles.PHARMACIST || role === 'pharmacy') ? 'pending' : 'approved');

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
    isAuthenticated: Boolean(user && session),
    login,
    register,
    logout,
    loginDemo,
    switchRole,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshProfile: () => user ? fetchUserData(user.id) : null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
