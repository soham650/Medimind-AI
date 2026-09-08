import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import {
  Layers,
  AlertTriangle,
  Clock,
  Package,
  Plus,
  Search,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Edit2,
  Save,
  X,
  ShieldAlert,
  Calendar
} from 'lucide-react';

export default function BatchManagement() {
  const { user, profile } = useAuth();
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'near_expiry' | 'expired' | 'low_stock'

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modal form state
  const [formData, setFormData] = useState({
    medicine_id: '',
    batch_number: '',
    expiry_date: '',
    stock_quantity: 50,
    unit_price: 100.0,
    reorder_level: 15
  });

  const fetchBatchData = async () => {
    if (!user && !profile) {
      setLoading(false);
      return;
    }
    const pharmacyId = profile?.id || user?.id;
    setLoading(true);
    setError(null);
    try {
      const [batchList, medCatalog] = await Promise.all([
        pharmacyService.getBatches(pharmacyId),
        pharmacyService.getMedicines()
      ]);
      setBatches(batchList);
      setMedicines(medCatalog);
    } catch (err) {
      console.error('Error fetching batch data:', err);
      setError(err.message || 'Unable to load pharmaceutical batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [user, profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getExpiryDays = (expiryDate) => {
    if (!expiryDate) return null;
    const exp = new Date(expiryDate);
    const today = new Date();
    const diffTime = exp - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredBatches = batches.filter((b) => {
    const days = getExpiryDays(b.expiry_date);
    const isExpired = days !== null && days <= 0;
    const isNearExpiry = days !== null && days > 0 && days <= 90;
    const isLowStock = b.stock_quantity <= (b.reorder_level || 15);

    let matchesFilter = true;
    if (filter === 'near_expiry') matchesFilter = isNearExpiry;
    if (filter === 'expired') matchesFilter = isExpired;
    if (filter === 'low_stock') matchesFilter = isLowStock;

    const matchesSearch =
      (b.medicine?.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.medicine?.generic_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.batch_number || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const openAddModal = () => {
    setEditingBatch(null);
    setFormData({
      medicine_id: medicines[0]?.id || '',
      batch_number: `LOT-${Date.now().toString().slice(-6)}`,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      stock_quantity: 50,
      unit_price: 120.0,
      reorder_level: 15
    });
    setModalOpen(true);
  };

  const openEditModal = (batch) => {
    setEditingBatch(batch);
    setFormData({
      medicine_id: batch.medicine_id,
      batch_number: batch.batch_number || '',
      expiry_date: batch.expiry_date || '',
      stock_quantity: batch.stock_quantity,
      unit_price: batch.unit_price,
      reorder_level: batch.reorder_level || 15
    });
    setModalOpen(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    const pharmacyId = profile?.id || user?.id;

    if (!formData.medicine_id) {
      alert('Please select a medicine from catalog.');
      return;
    }

    setSavingBatch(true);
    try {
      await pharmacyService.saveBatch(pharmacyId, {
        id: editingBatch?.id,
        ...formData
      });
      showToast(editingBatch ? 'Batch updated successfully!' : 'New batch added to dispensary stock!');
      setModalOpen(false);
      await fetchBatchData();
    } catch (err) {
      alert('Failed to save batch: ' + err.message);
    } finally {
      setSavingBatch(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <RefreshCw className="animate-spin" size={32} color="#0a4bb5" style={{ margin: '0 auto 12px auto' }} />
        <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '600' }}>Loading Pharmaceutical Lots & Expiry Records...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1240px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: '700', fontSize: '13px' }}>
            <Layers size={18} /> DISPENSARY INVENTORY CONTROL
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Batch & Expiry Date Management
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Monitor pharmaceutical lot numbers, prevent expired drug dispensing, and adjust warehouse batch stocks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={fetchBatchData}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button
            onClick={openAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              background: '#0a4bb5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(10, 75, 181, 0.2)'
            }}
          >
            <Plus size={16} /> Record New Batch
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All Batches (${batches.length})` },
            { key: 'near_expiry', label: 'Near Expiry (<90 Days)' },
            { key: 'expired', label: 'Expired Lots' },
            { key: 'low_stock', label: 'Low Stock' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                background: filter === tab.key ? '#0a4bb5' : '#f1f5f9',
                color: filter === tab.key ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 12px', minWidth: '280px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search brand, generic, or LOT..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: '8px', fontSize: '13px', width: '100%', color: '#1e293b' }}
          />
        </div>
      </div>

      {/* Table of Batches */}
      {filteredBatches.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <Package size={56} color="#94a3b8" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>No Batches Found</h3>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '420px', margin: '8px auto 20px auto' }}>
            No pharmaceutical inventory lots match your active criteria. Record a new batch arrival to begin.
          </p>
          <button
            onClick={openAddModal}
            style={{ padding: '10px 20px', background: '#0a4bb5', color: '#ffffff', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer' }}
          >
            Record First Batch
          </button>
        </div>
      ) : (
        <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                <th style={{ padding: '14px 18px' }}>Medicine Catalog Item</th>
                <th style={{ padding: '14px 18px' }}>Batch / Lot #</th>
                <th style={{ padding: '14px 18px' }}>Expiry Date</th>
                <th style={{ padding: '14px 18px' }}>Expiry Acuity</th>
                <th style={{ padding: '14px 18px' }}>Units in Stock</th>
                <th style={{ padding: '14px 18px' }}>Unit Price (₹)</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBatches.map((b) => {
                const days = getExpiryDays(b.expiry_date);
                const isExpired = days !== null && days <= 0;
                const isNearExpiry = days !== null && days > 0 && days <= 90;

                return (
                  <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9', background: isExpired ? '#fffbfb' : 'transparent' }}>
                    <td style={{ padding: '16px 18px' }}>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                        {b.medicine?.brand_name || 'Pharmaceutical Item'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {b.medicine?.generic_name} • {b.medicine?.dosage_form}
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', fontWeight: '700', color: '#334155' }}>
                      {b.batch_number || 'LOT-DEFAULT'}
                    </td>

                    <td style={{ padding: '16px 18px', color: '#475569' }}>
                      {b.expiry_date || 'N/A'}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      {isExpired ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: '#fee2e2', color: '#b91c1c', fontWeight: '800', fontSize: '11px' }}>
                          <ShieldAlert size={13} /> EXPIRED ({Math.abs(days)}d ago)
                        </span>
                      ) : isNearExpiry ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: '#fef3c7', color: '#b45309', fontWeight: '800', fontSize: '11px' }}>
                          <AlertTriangle size={13} /> Expiring in {days} days
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '12px', background: '#dcfce7', color: '#15803d', fontWeight: '700', fontSize: '11px' }}>
                          <CheckCircle2 size={13} /> Valid ({days}d)
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '16px 18px' }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '800',
                        color: b.stock_quantity <= (b.reorder_level || 15) ? '#dc2626' : '#0f172a'
                      }}>
                        {b.stock_quantity} units
                      </span>
                    </td>

                    <td style={{ padding: '16px 18px', fontWeight: '700', color: '#0a4bb5' }}>
                      ₹{Number(b.unit_price || 0).toFixed(2)}
                    </td>

                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <button
                        onClick={() => openEditModal(b)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          background: '#f1f5f9',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit2 size={13} /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Batch Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                {editingBatch ? 'Adjust Batch Stock & Expiry' : 'Record New Medicine Batch'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBatch} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Select Medicine *
                </label>
                <select
                  value={formData.medicine_id}
                  onChange={(e) => setFormData({ ...formData, medicine_id: e.target.value })}
                  disabled={!!editingBatch}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.brand_name} ({m.generic_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Batch / Lot Number *
                </label>
                <input
                  type="text"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  required
                  placeholder="e.g. LOT-4029B"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Reorder Alert Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '9px 16px', background: '#f1f5f9', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingBatch}
                  style={{ padding: '9px 20px', background: '#0a4bb5', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', color: '#ffffff', cursor: 'pointer' }}
                >
                  {savingBatch ? 'Saving...' : 'Save Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
