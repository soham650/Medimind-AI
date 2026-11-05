import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { authService } from '../services/auth.service';
import { notificationService } from '../services/notification.service';
import { UserRoles, normalizeRole } from '../types/database';

const AuthContext = createContext(null);
const AUTH_CACHE_KEY = 'medimind_auth_cache_v2';

const readAuthCache = () => {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.user?.id && parsed?.role) {
      return parsed;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

const writeAuthCache = (data) => {
  try {
    if (data?.user?.id) {
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
        user: data.user,
        session: data.session,
        profile: data.profile,
        role: data.role,
        cachedAt: Date.now()
      }));
    } else {
      localStorage.removeItem(AUTH_CACHE_KEY);
    }
  } catch (e) {
    // ignore
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const initialCache = readAuthCache();
  const [user, setUser] = useState(initialCache?.user || null);
  const [session, setSession] = useState(initialCache?.session || null);
  const [profile, setProfile] = useState(initialCache?.profile || null);
  const [role, setRole] = useState(initialCache?.role || null);
  const [notifications, setNotifications] = useState([]);
  
  // Instant load: If user is cached from previous session, skip the loading spinner entirely!
  const [loading, setLoading] = useState(initialCache?.user ? false : true);

  const hydratingRef = useRef(false);

  // Fetch canonical role and profile from live Supabase tables for authenticated user
  const fetchUserData = useCallback(async (userId, passedUser = null, currentSession = null) => {
    if (hydratingRef.current) return;
    hydratingRef.current = true;

    try {
      const activeUser = passedUser || user;
      const userRole = await authService.getUserRole(userId, activeUser);
      const canonicalRole = normalizeRole(userRole);
      const userProfile = await authService.getUserProfile(userId, canonicalRole);

      setRole(canonicalRole);
      setProfile(userProfile);

      // Cache updated credentials immediately
      writeAuthCache({
        user: activeUser,
        session: currentSession || session,
        profile: userProfile,
        role: canonicalRole
      });

      // Load notifications in background without blocking UI
      notificationService.getNotifications(userId)
        .then(notes => { if (notes) setNotifications(notes); })
        .catch(err => console.warn('Background notification sync note:', err.message));

      return { role: canonicalRole, profile: userProfile };
    } catch (err) {
      console.error('Error hydrating user context from Supabase:', err);
      if (!role) setRole(UserRoles.PATIENT);
      return { role: role || UserRoles.PATIENT, profile: null };
    } finally {
      hydratingRef.current = false;
      setLoading(false);
    }
  }, [user, session, role]);

  // Listen to live Supabase Auth session and state changes
  useEffect(() => {
    let mounted = true;

    // Safety timeout: Never leave user stuck on session loading screen longer than 800ms
    const safetyTimer = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 800);

    // 1. Initial session check on mount
    supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
      if (!mounted) return;
      if (error) {
        console.warn('Initial session check note:', error.message);
        if (!initialCache?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setLoading(false);
        }
        return;
      }

      if (initialSession?.user) {
        setSession(initialSession);
        setUser(initialSession.user);
        fetchUserData(initialSession.user.id, initialSession.user, initialSession);
      } else {
        writeAuthCache(null);
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // 2. Auth state change listener (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted) return;

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        // Only run fetchUserData if not already hydrated with this user
        if (!hydratingRef.current) {
          fetchUserData(currentSession.user.id, currentSession.user, currentSession);
        }
      } else if (event === 'SIGNED_OUT') {
        writeAuthCache(null);
        setUser(null);
        setSession(null);
        setProfile(null);
        setRole(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  // Real-time notification listener for authenticated user
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = notificationService.subscribe(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
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
      writeAuthCache(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Role Evaluation Demo Sign-in
  const loginDemo = async (roleName = 'patient') => {
    setLoading(true);
    try {
      const result = await authService.loginDemo(roleName);
      setUser(result.user);
      setSession(result.session);
      setRole(result.role);
      setProfile(result.profile);
      writeAuthCache(result);
      return result;
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Auth registration
  const register = async (email, password, metadata) => {
    setLoading(true);
    try {
      const requestedRole = normalizeRole(metadata.role || 'patient');
      let data;

      if (requestedRole === UserRoles.DOCTOR || requestedRole === UserRoles.PHARMACIST) {
        data = await authService.registerPractitioner({
          email,
          password,
          role: requestedRole,
          fullName: metadata.full_name || metadata.name,
          phone: metadata.phone || metadata.mobile,
          licenseNumber: metadata.license_number || metadata.licenseNumber,
          clinicName: metadata.clinic_name || metadata.clinicName,
          specialization: metadata.specialization || metadata.specialist,
          pharmacyName: metadata.pharmacy_name || metadata.pharmacyName,
          pharmacyAddress: metadata.pharmacy_address || metadata.pharmacyAddress,
          gstNumber: metadata.gst_number || metadata.gstNumber
        });
      } else {
        // Patient registration
        data = await authService.signup(email, password, {
          fullName: metadata.full_name || metadata.name,
          phone: metadata.phone || metadata.mobile,
          abhaId: metadata.abha_id || metadata.abhaId,
          age: metadata.age,
          gender: metadata.gender
        });
      }

      if (data?.user && data?.session) {
        writeAuthCache(data);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  // Real Supabase Auth sign-out
  const logout = async () => {
    setLoading(true);
    try {
      writeAuthCache(null);
      await authService.logout();
    } catch (e) {
      console.warn('Signout warning:', e);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setNotifications([]);
      setLoading(false);
    }
  };

  // Password reset email request
  const resetPassword = async (email) => {
    return authService.resetPassword(email);
  };

  // Password update for logged-in or token-authenticated user
  const updatePassword = async (newPassword) => {
    return authService.updatePassword(newPassword);
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

  // Determine practitioner verification/approval status - default to approved so users get their module immediately
  const approvalStatus = profile?.verification_status || profile?.approval_status || 'approved';

  const isApproved = approvalStatus !== 'suspended' && approvalStatus !== 'rejected';

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
    loginDemo,
    register,
    logout,
    resetPassword,
    updatePassword,
    directResetPassword: (email, newPassword) => authService.directResetPassword(email, newPassword),
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshProfile: () => user ? fetchUserData(user.id, user, session) : null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
