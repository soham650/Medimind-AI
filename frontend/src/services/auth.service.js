import { supabase } from '../lib/supabaseClient';
import { UserRoles } from '../types/database';

/**
 * Production Authentication & Session Service
 * Backed by Supabase Auth and public.user_roles + public.profiles
 */
export const authService = {
  // Sign in with email and password
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw new Error(this.friendlyError(error));

    const role = await this.getUserRole(data.user.id);
    const profile = await this.getUserProfile(data.user.id, role);

    return { session: data.session, user: data.user, role, profile };
  },

  // Secure Sign Up: Default role is always 'patient' in public.user_roles
  async signup(email, password, { fullName, phone, abhaId }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          phone,
          abha_id: abhaId,
          role: UserRoles.PATIENT // Default role
        }
      }
    });
    if (error) throw new Error(this.friendlyError(error));
    return data;
  },

  // Practitioner/Pharmacy Registration (With Documents for Admin Verification Gate)
  async registerPractitioner({ email, password, role, fullName, licenseNumber, clinicName, specialization }) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName,
          name: fullName,
          role: role || UserRoles.DOCTOR,
          license_number: licenseNumber,
          clinic_name: clinicName,
          specialization: specialization || 'General Physician',
          approval_status: 'pending' // Admin Gate
        }
      }
    });
    if (error) throw new Error(this.friendlyError(error));

    // Create doctor record in public.doctors with 'pending' verification
    if (data.user) {
      await supabase.from('doctors').insert({
        id: data.user.id,
        full_name: fullName,
        specialization: specialization || 'General Physician',
        license_number: licenseNumber,
        clinic_name: clinicName || 'MediMind Clinical Partner',
        verification_status: 'pending'
      });
    }

    return data;
  },

  // Fetch actual role from user_roles or fallback to profiles
  async getUserRole(userId) {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!error && data?.role) return data.role;
    } catch (e) {
      // ignore
    }

    // Fallback to profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    return profile?.role || UserRoles.PATIENT;
  },

  // Fetch role-specific profile (patient, doctor, pharmacy, admin)
  async getUserProfile(userId, role = UserRoles.PATIENT) {
    if (role === UserRoles.DOCTOR) {
      const { data } = await supabase.from('doctors').select('*').eq('id', userId).single();
      if (data) return { ...data, role };
    }
    if (role === UserRoles.PHARMACIST || role === 'pharmacy') {
      const { data } = await supabase.from('pharmacies').select('*').eq('id', userId).single();
      if (data) return { ...data, role };
    }
    // Default patient profile
    const { data: patient } = await supabase.from('patients').select('*').eq('id', userId).single();
    if (patient) return { ...patient, role: UserRoles.PATIENT };

    // Fallback public.profiles
    const { data: genericProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return genericProfile || { id: userId, full_name: 'Verified User', role };
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(this.friendlyError(error));
  },

  friendlyError(err) {
    const msg = err.message || '';
    if (msg.includes('Invalid login credentials')) return 'Incorrect email or password. Please try again.';
    if (msg.includes('User already registered')) return 'An account is already registered with this email.';
    if (msg.includes('Password should be')) return 'Password must be at least 6 characters long.';
    return msg || 'An unexpected authentication error occurred.';
  }
};
