import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorService } from '../../services';
import {
  Clock,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  Sliders,
  Check,
  X,
  Stethoscope
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
  { index: 6, name: 'Saturday' },
  { index: 0, name: 'Sunday' }
];

export default function DoctorAvailability() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Weekly Schedule State
  const [schedule, setSchedule] = useState({
    1: { active: true, start: '09:00', end: '17:00' },
    2: { active: true, start: '09:00', end: '17:00' },
    3: { active: true, start: '09:00', end: '17:00' },
    4: { active: true, start: '09:00', end: '17:00' },
    5: { active: true, start: '09:00', end: '17:00' },
    6: { active: false, start: '10:00', end: '14:00' },
    0: { active: false, start: '10:00', end: '14:00' }
  });

  const [slotDuration, setSlotDuration] = useState(30);
  const [consultationFee, setConsultationFee] = useState(500);

  const fetchSchedule = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const doctorId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const [slots, docDetails] = await Promise.all([
        doctorService.getDoctorSchedule(doctorId),
        doctorService.getDoctorProfile(doctorId)
      ]);

      if (docDetails) {
        setConsultationFee(docDetails.consultation_fee || 500);
      }

      if (slots && slots.length > 0) {
        const updated = { ...schedule };
        slots.forEach((s) => {
          updated[s.day_of_week] = {
            active: s.is_active,
            start: s.start_time ? s.start_time.slice(0, 5) : '09:00',
            end: s.end_time ? s.end_time.slice(0, 5) : '17:00'
          };
          if (s.slot_duration_minutes) {
            setSlotDuration(s.slot_duration_minutes);
          }
        });
        setSchedule(updated);
      }
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError(err.message || 'Unable to load existing availability schedule.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [user, profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleDay = (dayIndex) => {
    setSchedule((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        active: !prev[dayIndex].active
      }
    }));
  };

  const handleTimeChange = (dayIndex, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: value
      }
    }));
  };

  const handleSaveAll = async () => {
    const doctorId = profile?.id || user?.id;
    setSaving(true);
    try {
      // Build slots array
      const slotsToSave = Object.keys(schedule).map((dayIndex) => ({
        day_of_week: parseInt(dayIndex, 10),
        start_time: schedule[dayIndex].start,
        end_time: schedule[dayIndex].end,
        slot_duration_minutes: parseInt(slotDuration, 10),
        is_active: schedule[dayIndex].active
      }));

      await Promise.all([
        doctorService.saveDoctorSchedule(doctorId, slotsToSave),
        doctorService.updateDoctorProfile(doctorId, { consultation_fee: parseFloat(consultationFee) })
      ]);

      showToast('Weekly availability & consultation fee updated successfully!');
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeDaysCount = Object.values(schedule).filter((d) => d.active).length;

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading Doctor Schedule & Slot Rules...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 9999,
          fontSize: '14px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <Clock size={18} /> CLINICAL PRACTICE MANAGEMENT
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Doctor Availability & Schedule Rules
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Set your weekly clinical consultation hours, slot duration, and standard consultation fee.
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: '#0a4bb5',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(10, 75, 181, 0.25)'
          }}
        >
          {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Availability'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Settings Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '24px'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            Consultation Fee (₹ INR)
          </label>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>₹</span>
            <input
              type="number"
              value={consultationFee}
              onChange={(e) => setConsultationFee(e.target.value)}
              style={{ width: '100%', padding: '10px 8px', border: 'none', outline: 'none', fontSize: '14px', fontWeight: '700', color: '#0f172a' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            Slot Duration
          </label>
          <select
            value={slotDuration}
            onChange={(e) => setSlotDuration(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
          >
            <option value="15">15 Minutes / Quick Consult</option>
            <option value="30">30 Minutes / Standard Consult</option>
            <option value="45">45 Minutes / Comprehensive</option>
            <option value="60">60 Minutes / Specialist Intake</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
            Active Practice Summary
          </label>
          <div style={{ display: 'flex', alignItems: 'center', height: '42px', fontSize: '13px', color: '#166534', background: '#f0fdf4', padding: '0 14px', borderRadius: '8px', fontWeight: '700' }}>
            ✓ {activeDaysCount} Days Active • {activeDaysCount * (slotDuration === 15 ? 32 : slotDuration === 30 ? 16 : 8)} Max Slots/Wk
          </div>
        </div>
      </div>

      {/* Weekly Schedule Manager */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#0a4bb5" /> Weekly Consultation Timings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {DAYS_OF_WEEK.map((day) => {
            const dayConfig = schedule[day.index] || { active: false, start: '09:00', end: '17:00' };

            return (
              <div
                key={day.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: dayConfig.active ? '#f8fafc' : '#fcfcfc',
                  border: dayConfig.active ? '1px solid #cbd5e1' : '1px dashed #e2e8f0',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Day Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', width: '180px' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleDay(day.index)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      background: dayConfig.active ? '#16a34a' : '#cbd5e1',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {dayConfig.active ? <Check size={16} /> : <X size={16} />}
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: dayConfig.active ? '800' : '500', color: dayConfig.active ? '#0f172a' : '#94a3b8' }}>
                    {day.name}
                  </span>
                </div>

                {/* Timings or Closed */}
                {dayConfig.active ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Starts:</span>
                    <input
                      type="time"
                      value={dayConfig.start}
                      onChange={(e) => handleTimeChange(day.index, 'start', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                    />
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Ends:</span>
                    <input
                      type="time"
                      value={dayConfig.end}
                      onChange={(e) => handleTimeChange(day.index, 'end', e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600' }}
                    />
                  </div>
                ) : (
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                    Closed / Not Available for Consultations
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
