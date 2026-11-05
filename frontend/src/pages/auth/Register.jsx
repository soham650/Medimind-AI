import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { UserCheck, Stethoscope, Store, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('patient'); // 'patient' | 'doctor' | 'pharmacy'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    // Patient specific
    age: '28',
    gender: 'Male',
    abhaId: '',
    // Doctor specific
    specialist: 'General Physician',
    licenseNumber: '',
    experienceYears: '5',
    clinicName: 'MediMind Clinical Centre',
    // Pharmacy specific
    pharmacyName: '',
    pharmacyAddress: '',
    gstNumber: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all core credentials.');
      return;
    }

    if (role === 'doctor' && !formData.licenseNumber) {
      setError('Medical License Number is required for Doctor verification.');
      return;
    }

    if (role === 'pharmacy' && (!formData.pharmacyName || !formData.licenseNumber)) {
      setError('Pharmacy Store Name and Drug License Number are required.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const canonicalRole = role === 'pharmacy' ? 'pharmacist' : role;
      const metadata = {
        name: formData.name,
        full_name: formData.name,
        role: canonicalRole,
        mobile: formData.mobile,
        phone: formData.mobile,
        approval_status: 'approved',
        verification_status: 'approved',
        ...(role === 'patient' ? {
          age: parseInt(formData.age) || 30,
          gender: formData.gender,
          abha_id: formData.abhaId
        } : {}),
        ...(role === 'doctor' ? {
          specialization: formData.specialist,
          specialist: formData.specialist,
          license_number: formData.licenseNumber,
          experience_years: parseInt(formData.experienceYears) || 0,
          clinic_name: formData.clinicName
        } : {}),
        ...(role === 'pharmacy' ? {
          pharmacy_name: formData.pharmacyName,
          pharmacy_address: formData.pharmacyAddress,
          gst_number: formData.gstNumber,
          license_number: formData.licenseNumber
        } : {})
      };

      await register(formData.email, formData.password, metadata);
      setSuccess(true);

      setTimeout(() => {
        if (canonicalRole === 'doctor' || canonicalRole === 'pharmacist') {
          navigate('/pending-approval', { replace: true });
        } else {
          navigate('/patient/dashboard', { replace: true });
        }
      }, 1000);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-[560px] bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xl mb-2">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            MediMind Healthcare
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create System Account</h2>
          <p className="text-sm text-slate-500 mt-1">Select your healthcare role to join the network</p>
        </div>

        {/* 3 Registration Roles */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'patient' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            <UserCheck size={16} /> Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'doctor' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            <Stethoscope size={16} /> Doctor
          </button>
          <button
            type="button"
            onClick={() => setRole('pharmacy')}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              role === 'pharmacy' ? 'bg-white text-primary shadow-sm font-bold' : 'text-slate-600'
            }`}
          >
            <Store size={16} /> Pharmacy
          </button>
        </div>

        {/* Approval Gate Alert */}
        {(role === 'doctor' || role === 'pharmacy') && (
          <div className="mb-5 p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
            <ShieldAlert size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <strong className="font-semibold block">Mandatory Admin Approval Gate:</strong>
              As an accredited {role === 'doctor' ? 'Practitioner' : 'Pharmacy'}, your registration requires verification by our Admin compliance team before your public profile and clinical services become active.
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>Account registered successfully! Redirecting...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* Common Fields */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {role === 'pharmacy' ? 'Authorized Pharmacist / Contact Name' : 'Full Name'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={role === 'doctor' ? 'Dr. Sarah Connor' : (role === 'pharmacy' ? 'Rajesh Kumar' : 'John Doe')}
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Min. 8 characters"
                className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Contact</label>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm focus:border-primary focus:outline-none"
            />
          </div>

          {/* Role specific: Patient */}
          {role === 'patient' && (
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ABHA ID (Optional)</label>
                <input
                  type="text"
                  name="abhaId"
                  value={formData.abhaId}
                  onChange={handleChange}
                  placeholder="XX-XXXX-XXXX"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
          )}

          {/* Role specific: Doctor */}
          {role === 'doctor' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medical Specialization</label>
                  <select
                    name="specialist"
                    value={formData.specialist}
                    onChange={handleChange}
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm bg-white"
                  >
                    <option value="General Physician">General Physician</option>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Pediatrician">Pediatrician</option>
                    <option value="Orthopedic">Orthopedic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State / National License No.</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="MCI-2024-9871"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Affiliated Clinic / Hospital</label>
                <input
                  type="text"
                  name="clinicName"
                  value={formData.clinicName}
                  onChange={handleChange}
                  placeholder="Apex City Hospital, Ward 4"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
          )}

          {/* Role specific: Pharmacy */}
          {role === 'pharmacy' && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pharmacy / Medical Store Name</label>
                <input
                  type="text"
                  name="pharmacyName"
                  value={formData.pharmacyName}
                  onChange={handleChange}
                  placeholder="Apollo Care Pharmacy - Branch 12"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Drug License No. (DL No.)</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="DL-MH-2023-8871"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="27AAACG0000A1Z5"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Store Address</label>
                <input
                  type="text"
                  name="pharmacyAddress"
                  value={formData.pharmacyAddress}
                  onChange={handleChange}
                  placeholder="Shop #4, Main Market, Sector 15"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-300 text-sm"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 mt-4 bg-primary text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow disabled:opacity-50"
          >
            {submitting ? 'Registering...' : `Complete ${role.toUpperCase()} Registration`}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Sign In to your account
          </Link>
        </div>

      </div>
    </div>
  );
}
