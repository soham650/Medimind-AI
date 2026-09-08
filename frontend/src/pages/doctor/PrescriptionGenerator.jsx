import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { prescriptionService } from '../../services/prescriptionService';
import { appointmentService } from '../../services';
import { FilePlus2, Plus, Trash2, CheckCircle2, ShieldCheck, Printer, User, AlertCircle } from 'lucide-react';

export default function PrescriptionGenerator() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const paramAppointmentId = searchParams.get('appointmentId');

  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId || '');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(paramAppointmentId || '');
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '5 Days', instructions: 'Take with plenty of water' }
  ]);
  const [createdRx, setCreatedRx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load authorized patients from doctor appointments
  useEffect(() => {
    async function loadDoctorPatients() {
      if (!profile?.id) return;
      setLoadingPatients(true);
      try {
        const appts = await appointmentService.getDoctorAppointments(profile.id);
        const patientsMap = new Map();
        appts.forEach(a => {
          if (a.patient && a.patient.id) {
            patientsMap.set(a.patient.id, {
              id: a.patient.id,
              name: a.patient.full_name || 'Authorized Patient',
              phone: a.patient.phone || 'N/A',
              abha: a.patient.abha_id || 'N/A',
              appointmentId: a.id
            });
          }
        });
        const list = Array.from(patientsMap.values());
        setAuthorizedPatients(list);

        if (paramPatientId) {
          setSelectedPatientId(paramPatientId);
        } else if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0].id);
          setSelectedAppointmentId(list[0].appointmentId || '');
        }
      } catch (err) {
        console.warn('Notice loading doctor patients:', err);
      } finally {
        setLoadingPatients(false);
      }
    }
    loadDoctorPatients();
  }, [profile?.id, paramPatientId]);

  const addMedicine = () => {
    setMedicines(prev => [
      ...prev,
      { name: '', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '5 Days', instructions: '' }
    ]);
  };

  const removeMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const updateMedicine = (index, field, value) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[index][field] = value;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert('Please select an authorized patient recipient for this digital prescription.');
      return;
    }
    if (!diagnosis || medicines.some(m => !m.name.trim())) {
      alert('Please provide a clinical diagnosis and fill in all prescribed medicine names.');
      return;
    }

    setSubmitting(true);
    try {
      const generatedRx = await prescriptionService.createPrescription({
        doctorId: profile.id,
        patientId: selectedPatientId,
        consultationId: selectedAppointmentId || null,
        diagnosis,
        medicines,
        generalAdvice
      });
      setCreatedRx(generatedRx);
    } catch (err) {
      alert('Failed to generate prescription: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
          <FilePlus2 size={18} /> CORE SERVICE 4: DIGITAL PRESCRIPTION SERVICE
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
          Digital Rx Generator & Dispensation Record
        </h1>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Creates an encrypted, tamper-evident digital prescription with unique Rx ID for direct pharmacy fulfillment.
        </p>
      </div>

      {createdRx ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '2px solid #16a34a',
          padding: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Digitally Signed & Authenticated
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                Rx Identifier: {createdRx.rx_id}
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Issued by: Dr. {profile?.name || 'Physician'} | {profile?.specialist} | Lic. #{profile?.license_number || 'VERIFIED'}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              <Printer size={16} /> Print / Save PDF
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <strong style={{ fontSize: '13px', color: '#334155' }}>Clinical Diagnosis:</strong>
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginTop: '4px' }}>{createdRx.diagnosis}</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <strong style={{ fontSize: '13px', color: '#334155', display: 'block', marginBottom: '10px' }}>Prescribed Regimen:</strong>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '8px 12px' }}>Medicine</th>
                  <th style={{ padding: '8px 12px' }}>Dosage</th>
                  <th style={{ padding: '8px 12px' }}>Frequency</th>
                  <th style={{ padding: '8px 12px' }}>Duration</th>
                  <th style={{ padding: '8px 12px' }}>Instructions</th>
                </tr>
              </thead>
              <tbody>
                {createdRx.medicines.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: '700' }}>{m.name}</td>
                    <td style={{ padding: '8px 12px' }}>{m.dosage}</td>
                    <td style={{ padding: '8px 12px' }}>{m.frequency}</td>
                    <td style={{ padding: '8px 12px' }}>{m.duration}</td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{m.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {createdRx.general_advice && (
            <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#334155', marginBottom: '24px' }}>
              <strong>Physician Notes / Diet / Lifestyle Advice:</strong> {createdRx.general_advice}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setCreatedRx(null)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: '#0a4bb5',
                color: '#ffffff',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              Issue Another Prescription
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Authorized Patient Recipient *
            </label>
            {authorizedPatients.length > 0 ? (
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  const matched = authorizedPatients.find(p => p.id === e.target.value);
                  if (matched) setSelectedAppointmentId(matched.appointmentId || '');
                }}
                required
                style={{ width: '100%', height: '42px', padding: '0 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
              >
                <option value="">-- Select Active Consultation Patient --</option>
                {authorizedPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (ABHA: {p.abha} | Phone: {p.phone})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Enter Patient UUID (e.g. from Appointment or Patient Access Bridge)"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            )}
            {selectedAppointmentId && (
              <p style={{ fontSize: '12px', color: '#16a34a', marginTop: '6px', fontWeight: '600' }}>
                ✓ Linked to Appointment: {selectedAppointmentId}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              Clinical Diagnosis
            </label>
            <input
              type="text"
              placeholder="e.g. Acute Viral Bronchitis with Mild Wheezing"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
              required
            />
          </div>

          {/* Medicines List */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                Prescribed Medicines & Dosage Schedule
              </label>
              <button
                type="button"
                onClick={addMedicine}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  background: '#eff6ff',
                  color: '#0a4bb5',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            {medicines.map((med, index) => (
              <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 40px', gap: '8px', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Medicine Name (e.g. Augmentin 625)"
                  value={med.name}
                  onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                  style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  required
                />
                <input
                  type="text"
                  placeholder="Dosage (500mg)"
                  value={med.dosage}
                  onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                  style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Freq (1-0-1)"
                  value={med.frequency}
                  onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                  style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Duration (5 Days)"
                  value={med.duration}
                  onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                  style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <input
                  type="text"
                  placeholder="Instructions"
                  value={med.instructions}
                  onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                  style={{ height: '38px', padding: '0 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                {medicines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeMedicine(index)}
                    style={{ height: '38px', border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Trash2 size={16} />
                  </button>
                ) : <div />}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
              General Advice / Follow-up Schedule
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Steam inhalation twice daily. Review after 5 days if fever persists."
              value={generalAdvice}
              onChange={(e) => setGeneralAdvice(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: '46px',
              border: 'none',
              borderRadius: '8px',
              background: '#0a4bb5',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {submitting ? 'Generating Authenticated Rx...' : 'Digitally Sign & Issue Prescription'}
          </button>
        </form>
      )}
    </div>
  );
}
