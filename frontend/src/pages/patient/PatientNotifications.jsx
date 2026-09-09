import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  Package,
  FileText,
  AlertTriangle,
  Check,
  Trash2,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function PatientNotifications() {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (user?.id) {
      const unsubscribe = notificationService.subscribe(user.id, (newNotif) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await notificationService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} color="#0a4bb5" />;
      case 'order':
        return <Package size={18} color="#16a34a" />;
      case 'prescription':
      case 'rx':
        return <FileText size={18} color="#7c3aed" />;
      case 'alert':
      case 'emergency':
        return <AlertTriangle size={18} color="#dc2626" />;
      default:
        return <Bell size={18} color="#0a4bb5" />;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <Bell size={18} /> PATIENT NOTIFICATION CENTER
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '4px 0 0 0' }}>
            Notifications & Health Alerts
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0 0' }}>
            Real-time updates on appointments, prescriptions, medicine orders, and AI clinical assessments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchNotifications}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#0a4bb5',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Check size={14} /> Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { key: 'all', label: `All (${notifications.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${notifications.length - unreadCount})` }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              background: filter === tab.key ? '#eff6ff' : 'transparent',
              color: filter === tab.key ? '#0a4bb5' : '#64748b',
              fontWeight: filter === tab.key ? '700' : '500',
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <RefreshCw className="animate-spin" size={28} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: 0 }}>Loading your notifications from Supabase...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{
          padding: '50px 24px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1'
        }}>
          <Bell size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
            No {filter !== 'all' ? filter : ''} notifications
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {filter === 'unread'
              ? 'You are all caught up! No unread notifications.'
              : 'You will receive notifications here when appointments are confirmed or prescriptions are issued.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                background: notif.is_read ? '#ffffff' : '#f0f7ff',
                border: notif.is_read ? '1px solid #e2e8f0' : '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: notif.is_read ? '#f8fafc' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getIcon(notif.type || notif.notification_type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                      {notif.title || 'Notification'}
                    </h4>
                    {!notif.is_read && (
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#0a4bb5',
                        display: 'inline-block'
                      }} />
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', margin: '4px 0 6px 0', lineHeight: '1.4' }}>
                    {notif.message}
                  </p>
                  <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} /> {new Date(notif.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!notif.is_read && (
                <button
                  onClick={() => handleMarkAsRead(notif.id)}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: '#0a4bb5',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
