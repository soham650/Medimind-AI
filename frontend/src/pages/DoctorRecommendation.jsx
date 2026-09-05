import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export default function DoctorRecommendation() {
  const { user } = useAuth();
  const [specialists, setSpecialists] = useState(['General Physician', 'Cardiologist', 'Pulmonologist', 'Neurologist']);
  const [selectedSpecialist, setSelectedSpecialist] = useState('General Physician');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    setDoctors([]);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321'}/functions/v1/doctor-recommendation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({ specialist: selectedSpecialist })
        }
      );
      if (response.ok) {
        const data = await response.json();
        setDoctors(data.doctors || []);
      } else {
        throw new Error('Failed to fetch doctor recommendations');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedSpecialist]);

  const handleBook = async (doctorId, clinicId) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: user.id,
        clinic_id: clinicId,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        status: 'scheduled'
      });
      if (error) throw error;
      setBookingStatus(`Appointment successfully requested at clinic!`);
      setTimeout(() => setBookingStatus(null), 3000);
    } catch (err) {
      alert(`Booking failed: ${err.message}`);
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Clinician & Specialist Match</h2>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
          Consult with national digital health-linked medical professionals.
        </p>
      </div>

      <div className="card" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>Select Specialty</h3>
          <select 
            className="form-input" 
            value={selectedSpecialist} 
            onChange={e => setSelectedSpecialist(e.target.value)}
            style={{ width: '220px', padding: '6px 12px', fontSize: '13.5px' }}
          >
            {specialists.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
          </select>
        </div>

        {bookingStatus && (
          <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', color: '#166534', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            ✓ {bookingStatus}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#0a4bb5', fontWeight: 'bold' }}>
            Searching clinical network...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No verified specialists found in this category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doctors.map((doc, idx) => (
              <div 
                key={idx} 
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', background: '#f8fafc'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>{doc.name}</h4>
                  <span style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '700', textTransform: 'uppercase' }}>{doc.specialist}</span>
                  <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '6px' }}>
                    📍 Clinic: <strong>{doc.clinics?.name || 'General Clinic'}</strong> ({doc.clinics?.location || 'Unknown'})
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    Rating: <strong>⭐ {doc.clinics?.rating || 4.5}</strong> | Contact: {doc.mobile || 'N/A'}
                  </div>
                </div>
                <button 
                  onClick={() => handleBook(doc.id, doc.clinic_id)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12.5px' }}
                >
                  Schedule Consult
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
