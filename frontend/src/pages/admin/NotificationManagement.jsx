/**
 * MediMind AI — Phase 9 Admin Communication Monitoring & Broadcast Center
 * Telemetry Dashboard, Multi-Channel Health Indicators, and Role-Targeted Broadcasts.
 */

import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { notificationService } from '../../services/notification.service';
import {
  Bell,
  Send,
  RefreshCw,
  CheckCircle2,
  Users,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  Radio,
  Server,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCheck
} from 'lucide-react';

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [metrics, setMetrics] = useState({
    totalDispatched: 0,
    delivered: 0,
    failed: 0,
    providers: {}
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [form, setForm] = useState({
    title: '',
    message: '',
    targetRole: 'all',
    type: 'announcement',
    priority: 'NORMAL'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [list, commMetrics] = await Promise.all([
        adminService.getNotifications(50),
        notificationService.getAdminCommunicationMetrics()
      ]);
      setNotifications(list || []);
      if (commMetrics) setMetrics(commMetrics);
    } catch (err) {
      console.error('Failed to load notification telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      alert('Please provide both title and message for the announcement.');
      return;
    }

    if (!window.confirm(`Broadcast notification to "${form.targetRole.toUpperCase()}" users?`)) return;

    setSending(true);
    try {
      const res = await adminService.sendBroadcastNotification({
        title: form.title.trim(),
        message: form.message.trim(),
        targetRole: form.targetRole,
        type: form.type
      });

      showToast(`Notification successfully delivered to ${res.sent} active user(s).`);
      setForm({ title: '', message: '', targetRole: 'all', type: 'announcement', priority: 'NORMAL' });
      await fetchData();
    } catch (err) {
      alert('Broadcast dispatch failed: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const getChannelIcon = (name) => {
    switch (name) {
      case 'in_app':
        return <Bell size={16} color="#0a4bb5" />;
      case 'email':
        return <Mail size={16} color="#4f46e5" />;
      case 'sms':
        return <Smartphone size={16} color="#059669" />;
      case 'whatsapp':
        return <MessageSquare size={16} color="#16a34a" />;
      default:
        return <Radio size={16} color="#7c3aed" />;
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Notification */}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#eef2ff', borderRadius: '6px', color: '#4f46e5', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Radio size={16} /> Notification & Communication Platform
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '6px', margin: 0 }}>
            Communication Telemetry & Multi-Channel Dispatch
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Monitor channel delivery health, provider gateway availability, and broadcast authenticated platform announcements.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155'
          }}
          aria-label="Refresh communication feed"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Health Feed
        </button>
      </div>

      {/* Channel Gateway Health Matrix */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#334155', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={16} color="#0a4bb5" /> Channel Gateway Providers & Configuration Status
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {metrics.providers && Object.entries(metrics.providers).map(([key, prov]) => {
            const isOperational = prov.status === 'OPERATIONAL';
            return (
              <div key={key} style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>
                    {getChannelIcon(key)} {prov.name}
                  </div>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: '800',
                    padding: '2px 7px',
                    borderRadius: '5px',
                    background: isOperational ? '#dcfce7' : '#f1f5f9',
                    color: isOperational ? '#166534' : '#64748b'
                  }}>
                    {prov.status}
                  </span>
                </div>
                <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0 }}>
                  {isOperational ? 'Gateway operational and verified.' : 'Credentials not configured in environment.'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Broadcast Composer */}
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Send size={18} color="#4f46e5" /> Broadcast Authenticated Announcement
          </h3>

          <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Announcement Headline:
              </label>
              <input
                type="text"
                placeholder="e.g. Scheduled System Upgrade at 11 PM IST"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#f8fafc',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                Announcement Message (Minimum Necessary Information):
              </label>
              <textarea
                rows="4"
                placeholder="Compose announcement body..."
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  background: '#f8fafc',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Target Recipient Group:
                </label>
                <select
                  value={form.targetRole}
                  onChange={(e) => setForm(prev => ({ ...prev, targetRole: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
                >
                  <option value="all">All Platform Users</option>
                  <option value="patient">Patients Only</option>
                  <option value="doctor">Doctors Only</option>
                  <option value="pharmacist">Pharmacies Only</option>
                  <option value="admin">Administrators Only</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Notification Priority:
                </label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
                >
                  <option value="NORMAL">NORMAL (Standard)</option>
                  <option value="HIGH">HIGH (Urgent)</option>
                  <option value="CRITICAL">CRITICAL (System Emergency)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                background: '#4f46e5',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '14px',
                cursor: sending ? 'not-allowed' : 'pointer',
                marginTop: '8px'
              }}
            >
              <Send size={16} />
              {sending ? 'Dispatching Broadcast...' : 'Dispatch Broadcast'}
            </button>
          </form>
        </div>

        {/* Live Communications Feed */}
        <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#0a4bb5" /> Recent Notification Dispatches
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Showing latest {notifications.length} records
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '13px' }}>Loading notification stream...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', margin: 0 }}>Zero notifications recorded in current feed.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{n.title}</strong>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: n.metadata?.priority === 'CRITICAL' ? '#fee2e2' : '#eff6ff',
                      color: n.metadata?.priority === 'CRITICAL' ? '#dc2626' : '#1d4ed8'
                    }}>
                      {n.metadata?.priority || 'NORMAL'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', color: '#475569', fontSize: '12.5px' }}>
                    {n.message}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                    <span>Type: {n.type || n.notification_type}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
