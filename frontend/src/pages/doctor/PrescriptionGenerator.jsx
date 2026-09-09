import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams, Link } from 'react-router-dom';
import { prescriptionService } from '../../services/prescription.service';
import { appointmentService } from '../../services/appointment.service';
import { 
  FilePlus2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  User, 
  AlertCircle, 
  Stethoscope, 
  Calendar, 
  Clock, 
  ArrowLeft 
} from 'lucide-react';

const COMMON_MEDICINES = [
  { name: 'Paracetamol 650mg', dosage: '650mg', frequency: '1-0-1 (After meals)', duration: '3 Days', instructions: 'Take for fever / pain' },
  { name: 'Amoxicillin + Clavulanic Acid 625mg', dosage: '625mg', frequency: '1-0-1 (After meals)', duration: '5 Days', instructions: 'Complete full antibiotic course' },
  { name: 'Pantoprazole 40mg', dosage: '40mg', frequency: '1-0-0 (Before breakfast)', duration: '14 Days', instructions: 'Empty stomach in morning' },
  { name: 'Atorvastatin 20mg', dosage: '20mg', frequency: '0-0-1 (At bedtime)', duration: '30 Days', instructions: 'Take at night after food' },
  { name: 'Metoprolol Succinate 25mg', dosage: '25mg', frequency: '1-0-0 (Morning)', duration: '30 Days', instructions: 'Monitor pulse and BP regularly' },
  { name: 'Cetirizine 10mg', dosage: '10mg', frequency: '0-0-1 (At bedtime)', duration: '5 Days', instructions: 'May cause mild sedation' }
];

export default function PrescriptionGenerator() {
  const { user, profile } = useAuth();
  const doctorId = profile?.id || user?.id;

  const [searchParams] = useSearchParams();
  const paramPatientId = searchParams.get('patientId');
  const paramAppointmentId = searchParams.get('appointmentId');

  const [authorizedPatients, setAuthorizedPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(paramPatientId || '');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(paramAppointmentId || '');
  const [loadingPatients, setLoadingPatients] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [generalAdvice, setGeneralAdvice] = useState('');
  const [createSchedules, setCreateSchedules] = useState(true);
  const [medicines, setMedicines] = useState([
    { name: '', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '5 Days', instructions: 'Take with water after meals' }
  ]);
  const [createdRx, setCreatedRx] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load authorized patients from doctor appointments
  useEffect(() => {
    async function loadDoctorPatients() {
      if (!doctorId) return;
      setLoadingPatients(true);
      try {
        const appts = await appointmentService.getDoctorAppointments(doctorId);
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
  }, [doctorId, paramPatientId]);

  const addMedicine = () => {
    setMedicines(prev => [
      ...prev,
      { name: '', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '5 Days', instructions: '' }
    ]);
  };

  const addQuickMedicine = (med) => {
    setMedicines(prev => {
      // If first row is blank, replace it
      if (prev.length === 1 && !prev[0].name.trim()) {
        return [{ ...med }];
      }
      return [...prev, { ...med }];
    });
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
    if (!diagnosis.trim() || medicines.some(m => !m.name.trim())) {
      alert('Please provide a clinician diagnosis and fill in all prescribed medicine names.');
      return;
    }

    setSubmitting(true);
    try {
      const generatedRx = await prescriptionService.createPrescription({
        doctorId,
        patientId: selectedPatientId,
        consultationId: selectedAppointmentId || null,
        diagnosis: diagnosis.trim(),
        medicines,
        generalAdvice: generalAdvice.trim(),
        createSchedules
      });

      setCreatedRx({
        ...generatedRx,
        diagnosis,
        generalAdvice,
        medicines,
        patient: authorizedPatients.find(p => p.id === selectedPatientId)
      });
    } catch (err) {
      alert('Failed to generate prescription: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#0f766e', fontWeight: '800', fontSize: '11px', background: '#ccfbf1', padding: '3px 8px', borderRadius: '4px', marginBottom: '6px' }}>
          <FilePlus2 size={13} /> CORE SERVICE 4: DIGITAL PRESCRIPTION SERVICE (TRANSACTIONAL RPC)
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
          Digital Rx Pad & Pharmacotherapy Plan
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
          Author and issue digitally validated prescriptions using <code>create_prescription_tx</code>. Prescriptions synchronize with patient dose schedules and the pharmacy network.
        </p>
      </div>

      {createdRx ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '2px solid #0f766e',
          padding: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '11.5px', fontWeight: '800', color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✓ Digitally Signed & Transactionally Committed
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
                Rx Identifier: {createdRx.rx_id}
              </h2>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Issued by Dr. {profile?.full_name || 'Practitioner'} • Date: {new Date().toLocaleDateString()}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Printer size={15} /> Print Rx Slip
            </button>
          </div>

          {/* Patient Details */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>Patient: {createdRx.patient?.name || 'Authorized Patient'}</strong>
                <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  ABHA ID: {createdRx.patient?.abha || '91-XXXX-XXXX'} • Ph: {createdRx.patient?.phone || 'N/A'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#0f766e', display: 'block' }}>CLINICAL DIAGNOSIS</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{createdRx.diagnosis}</strong>
              </div>
            </div>
          </div>

          {/* Prescribed Items Table */}
          <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', marginBottom: '10px' }}>
            Prescribed Medications ({createdRx.medicines?.length || 0})
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', marginBottom: '20px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569' }}>
                <th style={{ padding: '10px 14px' }}>Medicine</th>
                <th style={{ padding: '10px 14px' }}>Dosage</th>
                <th style={{ padding: '10px 14px' }}>Frequency</th>
                <th style={{ padding: '10px 14px' }}>Duration</th>
                <th style={{ padding: '10px 14px' }}>Instructions</th>
              </tr>
            </thead>
            <tbody>
              {(createdRx.medicines || []).map((med, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '700', color: '#0f172a' }}>{med.name}</td>
                  <td style={{ padding: '10px 14px', color: '#334155' }}>{med.dosage}</td>
                  <td style={{ padding: '10px 14px', color: '#0f766e', fontWeight: '600' }}>{med.frequency}</td>
                  <td style={{ padding: '10px 14px', color: '#475569' }}>{med.duration}</td>
                  <td style={{ padding: '10px 14px', color: '#64748b' }}>{med.instructions || 'As directed'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {createdRx.generalAdvice && (
            <div style={{ marginBottom: '24px', padding: '14px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
              <strong style={{ fontSize: '12.5px', color: '#6d28d9', display: 'block', marginBottom: '4px' }}>General Clinical Advice & Lifestyle:</strong>
              <p style={{ fontSize: '13px', color: '#581c87', margin: 0 }}>{createdRx.generalAdvice}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <Link
              to="/doctor/appointments"
              style={{ fontSize: '13px', fontWeight: '700', color: '#0f766e', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowLeft size={14} /> Back to Appointments
            </Link>

            <button
              onClick={() => {
                setCreatedRx(null);
                setDiagnosis('');
                setGeneralAdvice('');
                setMedicines([{ name: '', dosage: '500mg', frequency: '1-0-1 (After Meals)', duration: '5 Days', instructions: '' }]);
              }}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                background: '#0f766e',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Issue Another Prescription
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
          
          {/* Patient & Consultation Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Select Authorized Patient *
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => {
                  setSelectedPatientId(e.target.value);
                  const p = authorizedPatients.find(x => x.id === e.target.value);
                  if (p?.appointmentId) setSelectedAppointmentId(p.appointmentId);
                }}
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
              >
                {authorizedPatients.length === 0 ? (
                  <option value="">No authorized patients found</option>
                ) : (
                  authorizedPatients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ABHA: {p.abha || 'N/A'})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                Attending Physician
              </label>
              <input
                type="text"
                value={`Dr. ${profile?.full_name || 'Practitioner'} (${profile?.license_number || 'Verified'})`}
                disabled
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  background: '#f1f5f9',
                  color: '#475569'
                }}
              />
            </div>
          </div>

          {/* Clinician Diagnosis */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#0f766e', marginBottom: '6px' }}>
              Clinician-Authored Diagnosis * (Mandatory)
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Essential Hypertension (I10) / Type 2 Diabetes Mellitus"
              required
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '6px',
                border: '2px solid #0f766e',
                fontSize: '13.5px',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          </div>

          {/* Quick Medicine Inserters */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
              Quick Add Common Medications:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {COMMON_MEDICINES.map((med, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addQuickMedicine(med)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  + {med.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Itemized Medicine Rows */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Prescribed Drug Lines
              </h3>
              <button
                type="button"
                onClick={addMedicine}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} /> Add Drug Line
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medicines.map((med, idx) => (
                <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1fr auto', gap: '10px', alignItems: 'center' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Brand / Generic Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Telmisartan 40mg"
                        value={med.name}
                        onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                        required
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Dosage</label>
                      <input
                        type="text"
                        placeholder="e.g. 40mg"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(idx, 'dosage', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Frequency</label>
                      <input
                        type="text"
                        placeholder="e.g. 1-0-1 (After meals)"
                        value={med.frequency}
                        onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 14 Days"
                        value={med.duration}
                        onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12.5px', outline: 'none' }}
                      />
                    </div>

                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(idx)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px', marginTop: '16px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Avoid taking with dairy, take with warm water)"
                      value={med.instructions}
                      onChange={(e) => updateMedicine(idx, 'instructions', e.target.value)}
                      style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none', background: '#ffffff' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Advice */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
              General Clinical Advice & Lifestyle Guidelines
            </label>
            <textarea
              rows="3"
              value={generalAdvice}
              onChange={(e) => setGeneralAdvice(e.target.value)}
              placeholder="e.g. Low sodium DASH diet, 30 min daily brisk walking, hydration, avoid smoking..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            ></textarea>
          </div>

          {/* Medication Schedule Integration Checkbox */}
          <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
              <input
                type="checkbox"
                checked={createSchedules}
                onChange={(e) => setCreateSchedules(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#0f766e' }}
              />
              Automatically generate daily medication intake schedule (medication_schedules) for patient dose tracker
            </label>
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                background: '#0f766e',
                border: 'none',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: '700',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(15, 118, 110, 0.25)'
              }}
            >
              <FilePlus2 size={16} />
              {submitting ? 'Executing Transaction...' : 'Issue & Sign Digital Rx (create_prescription_tx)'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
