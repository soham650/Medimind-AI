/**
 * MediMind AI — Phase 9 Pharmacy Notification Center
 * Production In-App Notification Center for Licensed Dispensaries & Pharmacists
 * Real-time prescription orders, inventory warnings, and licensing alerts.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notification.service';
import {
  Bell,
  CheckCircle2,
  Package,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  CheckCheck,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PharmacyNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, orders, inventory, system
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchNotifications = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setRefreshing(true);
      const data = await notificationService.getNotifications(user.id, { limit: 50 });
      setNotifications(data || []);
    } catch (err) {
      console.warn('Error fetching pharmacy notifications:', err);
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
        showToast('New dispensary alert received');
      });
      return () => unsubscribe();
    }
  }, [user?.id]);

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
      showToast('All dispensary alerts marked as read.');
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'orders') return n.type === 'order' || n.notification_type === 'order';
    if (filter === 'inventory') return n.type === 'alert' || (n.metadata?.category === 'inventory');
    if (filter === 'system') return n.type === 'system' || n.notification_type === 'system' || n.type === 'verification';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getPriorityBadge = (priority) => {
    const p = (priority || 'NORMAL').toUpperCase();
    switch (p) {
      case 'CRITICAL':
        return (
          <span style={{
            background: '#fee2e2',
            color: '#dc2626',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '800'
          }}>
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span style={{
            background: '#fef3c7',
            color: '#b45309',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '700'
          }}>
            HIGH
          </span>
        );
      default:
        return (
          <span style={{
            background: '#eff6ff',
            color: '#1d4ed8',
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            NORMAL
          </span>
        );
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <Package size={18} color="#16a34a" />;
      case 'verification':
        return <ShieldCheck size={18} color="#2563eb" />;
      case 'alert':
        return <AlertTriangle size={18} color="#d97706" />;
      default:
        return <Bell size={18} color="#0a4bb5" />;
    }
  };

  return (
    <div style={{ padding: '28px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 18px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: 9999,
          fontSize: '13.5px',
          fontWeight: '600'
        }}>
          <CheckCircle2 size={16} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Dispensary Communications
            </h1>
            <p style={{ fontSize: '13.5px', color: '#64748b', margin: '2px 0 0 0' }}>
              Incoming medicine orders, fulfillment requests, inventory warnings, and licensing updates.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={fetchNotifications}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
              cursor: 'pointer'
            }}
            aria-label="Refresh notifications"
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
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#059669',
                fontSize: '13px',
                fontWeight: '700',
                color: '#ffffff',
                cursor: 'pointer'
              }}
              aria-label="Mark all dispensary alerts as read"
            >
              <CheckCheck size={15} />
              Mark All Read ({unreadCount})
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
        {[
          { id: 'all', label: 'All Alerts', count: notifications.length },
          { id: 'unread', label: 'Unread', count: unreadCount },
          { id: 'orders', label: 'Customer Orders' },
          { id: 'inventory', label: 'Stock Alerts' },
          { id: 'system', label: 'License & System' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: filter === tab.id ? '#059669' : '#f8fafc',
              color: filter === tab.id ? '#ffffff' : '#475569',
              fontSize: '13px',
              fontWeight: filter === tab.id ? '700' : '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                background: filter === tab.id ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                color: filter === tab.id ? '#ffffff' : '#0f172a',
                padding: '1px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '700'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Body */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <p style={{ fontSize: '14px', fontWeight: '600' }}>Loading dispensary communications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px dashed #cbd5e1',
          padding: '50px 20px',
          textAlign: 'center'
        }}>
          <Package size={36} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 6px 0' }}>
            No dispensary notifications found
          </h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {filter === 'unread'
              ? 'You have zero unread dispensary alerts.'
              : 'There are currently no notifications matching this category.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredNotifications.map((n) => {
            const priority = n.metadata?.priority || 'NORMAL';
            const isCritical = priority === 'CRITICAL';

            return (
              <div
                key={n.id}
                style={{
                  background: n.is_read ? '#ffffff' : (isCritical ? '#fff5f5' : '#f0fdf4'),
                  border: isCritical ? '1.5px solid #f87171' : (n.is_read ? '1px solid #e2e8f0' : '1px solid #86efac'),
                  borderRadius: '12px',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: isCritical ? '#fee2e2' : (n.is_read ? '#f1f5f9' : '#dcfce7'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(n.type || n.notification_type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a' }}>
                        {n.title}
                      </span>
                      {getPriorityBadge(priority)}
                      {!n.is_read && (
                        <span style={{
                          background: '#059669',
                          color: '#ffffff',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10.5px',
                          fontWeight: '800'
                        }}>
                          NEW
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 8px 0', lineHeight: 1.45 }}>
                      {n.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {new Date(n.created_at).toLocaleString()}
                      </span>

                      {n.link && (
                        <Link
                          to={n.link}
                          onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            color: '#059669',
                            fontWeight: '700',
                            textDecoration: 'none'
                          }}
                        >
                          Fulfill Order <ExternalLink size={12} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {!n.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(n.id)}
                    title="Mark as read"
                    style={{
                      background: 'transparent',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <CheckCircle2 size={13} />
                    Mark Read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
