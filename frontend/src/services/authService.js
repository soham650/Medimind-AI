import { supabase } from '../lib/supabaseClient';

/**
 * Authentication & RBAC Service (Client Applications & Auth Service)
 * Handles login, registration, role verification, and Admin Approval Gate checks.
 */
export const authService = {
  // Login with credentials and retrieve user profile with role & approval status
  async login(email, password, expectedRole = null) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const profile = await this.getProfile(data.user.id);
    if (expectedRole && profile.role !== expectedRole) {
      await supabase.auth.signOut();
      throw new Error(`Access restricted: Account is registered as "${profile.role}", not "${expectedRole}".`);
    }

    return { session: data.session, user: data.user, profile };
  },

  // Register a new user with role-specific metadata (supports Patient, Doctor, Pharmacy)
  async register({ email, password, role, name, extraData = {} }) {
    const metadata = {
      name,
      full_name: name,
      role: role || 'patient',
      // Patients and Admins are approved by default. Doctors and Pharmacies require Admin Approval Gate.
      approval_status: (role === 'doctor' || role === 'pharmacy') ? 'pending' : 'approved',
      ...extraData,
    };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;

    return data;
  },

  // Retrieve user profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Profile fetch warning:', error.message);
    }
    return data || null;
  },

  // Check if current user is approved
  isApproved(profile) {
    if (!profile) return false;
    if (profile.role === 'patient' || profile.role === 'admin') return true;
    return profile.approval_status === 'approved';
  },

  // Logout
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
};
