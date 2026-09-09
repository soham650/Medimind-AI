import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { pharmacyService } from '../../services';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Edit2,
  Plus,
  RefreshCw,
  ArrowUpDown,
  Layers,
  Save,
  X
} from 'lucide-react';

export default function InventoryManagement() {
  const { user, profile } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, low_stock, near_expiry, expired
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const pharmacyId = profile?.id || user?.id;

  const loadInventory = async () => {
    if (!pharmacyId) return;
    setLoading(true);
    try {
      const data = await pharmacyService.getPharmacyInventory(pharmacyId);
      setInventory(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [pharmacyId]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleEdit = (item) => {
    setSelectedItem({
      id: item.id,
      medicine_id: item.medicine_id,
      brand_name: item.medicine?.brand_name,
      batch_number: item.batch_number,
      stock_quantity: item.stock_quantity,
      unit_price: item.unit_price,
      reorder_level: item.reorder_level,
      expiry_date: item.expiry_date
    });
    setModalOpen(true);
  };

  const handleSaveStock = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await pharmacyService.saveBatch(pharmacyId, {
        id: selectedItem.id,
        medicine_id: selectedItem.medicine_id,
        stock_quantity: selectedItem.stock_quantity,
        unit_price: selectedItem.unit_price,
        batch_number: selectedItem.batch_number,
        expiry_date: selectedItem.expiry_date,
        reorder_level: selectedItem.reorder_level
      });
      showToast('Inventory stock and unit pricing updated successfully!');
      setModalOpen(false);
      await loadInventory();
    } catch (err) {
      alert('Failed to update stock: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = inventory.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.medicine?.brand_name || '').toLowerCase().includes(term) ||
      (item.medicine?.generic_name || '').toLowerCase().includes(term) ||
      (item.batch_number || '').toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (filter === 'low_stock') return item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock';
    if (filter === 'near_expiry') return item.expiryStatus === 'near_expiry';
    if (filter === 'expired') return item.expiryStatus === 'expired';
    return true;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Toast */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0a4bb5', fontWeight: '700', fontSize: '13px' }}>
            <Package size={18} /> DISPENSARY PHARMACEUTICAL STOCK
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Pharmacy Inventory & Stock Control
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Track live batch inventory, selling prices, reorder thresholds, and FEFO allocation status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={loadInventory}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link
            to="/pharmacy/batches"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0a4bb5',
              borderRadius: '8px',
              padding: '10px 18px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            <Plus size={16} /> Add Batch
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#ffffff',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by brand name, generic composition, or batch number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#1e293b' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Items' },
            { key: 'low_stock', label: 'Low Stock Alerts' },
            { key: 'near_expiry', label: 'Expiring ≤ 90d' },
            { key: 'expired', label: 'Expired' }
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: '700',
                border: 'none',
                cursor: 'pointer',
                background: filter === btn.key ? '#0a4bb5' : '#f1f5f9',
                color: filter === btn.key ? '#ffffff' : '#475569'
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontSize: '14px', margin: 0 }}>Loading live dispensary stock...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Package size={44} color="#94a3b8" style={{ margin: '0 auto 14px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>No Inventory Records Found</h3>
            <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>Add medication batches from the master drug catalog to populate your dispensary stock.</p>
            <Link
              to="/pharmacy/batches"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#0a4bb5',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              <Plus size={16} /> Create Initial Batch
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 18px' }}>Medication & Formulation</th>
                  <th style={{ padding: '14px 18px' }}>Batch Number</th>
                  <th style={{ padding: '14px 18px' }}>Expiry Date</th>
                  <th style={{ padding: '14px 18px' }}>Available Units</th>
                  <th style={{ padding: '14px 18px' }}>Unit Price</th>
                  <th style={{ padding: '14px 18px' }}>Stock Health</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.stockStatus === 'low_stock' || item.stockStatus === 'out_of_stock';
                  const isExpired = item.expiryStatus === 'expired';
                  const isNearExp = item.expiryStatus === 'near_expiry';

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: '800', color: '#0f172a' }}>{item.medicine?.brand_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {item.medicine?.generic_name} • {item.medicine?.strength} ({item.medicine?.dosage_form})
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: '700', color: '#0a4bb5' }}>
                        {item.batch_number}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: isExpired ? '#dc2626' : isNearExp ? '#d97706' : '#1e293b', fontWeight: '600' }}>
                          {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : 'N/A'}
                        </div>
                        {item.diffDays !== null && (
                          <div style={{ fontSize: '11px', color: isExpired ? '#dc2626' : isNearExp ? '#d97706' : '#64748b' }}>
                            {isExpired ? 'Expired' : `${item.diffDays} days left`}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: isLow ? '#dc2626' : '#0f172a' }}>
                          {item.stock_quantity}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Reorder at: {item.reorder_level || 10}</div>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: '700', color: '#0f172a' }}>
                        ₹{item.unit_price}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        {isExpired ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                            <AlertCircle size={12} /> Expired
                          </span>
                        ) : isLow ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                            <CheckCircle2 size={12} /> Optimal
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleEdit(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            color: '#0a4bb5',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          <Edit2 size={12} /> Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline Adjust Modal */}
      {modalOpen && selectedItem && (
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
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '500px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                Adjust Stock & Pricing
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSaveStock}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Medication
                </label>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  {selectedItem.brand_name}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Batch Number
                  </label>
                  <input
                    type="text"
                    value={selectedItem.batch_number}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, batch_number: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={selectedItem.expiry_date || ''}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, expiry_date: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Available Units
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={selectedItem.stock_quantity}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, stock_quantity: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Unit Retail Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={selectedItem.unit_price}
                    onChange={(e) => setSelectedItem(prev => ({ ...prev, unit_price: e.target.value }))}
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0a4bb5', color: '#ffffff', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  {saving ? 'Saving...' : 'Save Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
