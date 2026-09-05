import React, { useState, useEffect } from 'react';
import { pharmacyService } from '../../services/pharmacyService';
import { Package, Plus, Search, CheckCircle, AlertCircle } from 'lucide-react';

export default function InventoryManagement() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await pharmacyService.getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = medicines.filter(m =>
    (m.brand_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.generic_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>
            Pharmacy Stock & Inventory Control
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Manage master drug catalog availability, dosage strengths, and retail pricing.
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
        background: '#ffffff',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px'
      }}>
        <Search size={18} color="#94a3b8" />
        <input
          type="text"
          placeholder="Search by brand name, generic composition, or therapeutic category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#1e293b' }}
        />
        <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
          <strong>{filtered.length}</strong> items listed
        </span>
      </div>

      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>Loading pharmacy inventory...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                <th style={{ padding: '12px 16px' }}>Brand / Generic Name</th>
                <th style={{ padding: '12px 16px' }}>Category</th>
                <th style={{ padding: '12px 16px' }}>Dosage Form</th>
                <th style={{ padding: '12px 16px' }}>Price (INR)</th>
                <th style={{ padding: '12px 16px' }}>Rx Required</th>
                <th style={{ padding: '12px 16px' }}>Stock Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(med => (
                <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{med.brand_name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{med.generic_name}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{med.category || 'General'}</td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{med.dosage_form || 'Tablet'} ({med.strength || 'Standard'})</td>
                  <td style={{ padding: '12px 16px', fontWeight: '700' }}>₹{med.standard_price || 50}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {med.requires_prescription ? (
                      <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#991b1b', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        Rx Mandated
                      </span>
                    ) : (
                      <span style={{ padding: '2px 6px', background: '#dcfce7', color: '#166534', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
                        OTC
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: '600' }}>
                      <CheckCircle size={14} /> In Stock
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
