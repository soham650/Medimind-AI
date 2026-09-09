import React, { useState, useEffect } from 'react';
import { pharmacyService } from '../../services';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Package,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  QrCode,
  Layers,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function MedicineCatalog() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const data = await pharmacyService.getMedicines(searchTerm, selectedCategory);
      setMedicines(data);
    } catch (err) {
      console.error('Error fetching medicine catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadMedicines();
  };

  const categories = ['All', 'Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops'];

  return (
    <div style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: '700', fontSize: '13px' }}>
            <Package size={18} /> NATIONAL FORMULARY DIRECTORY
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>
            Master Pharmaceutical Drug Catalog
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Browse standardized therapeutic formulations, SKUs, barcodes, and schedule prescription mandates.
          </p>
        </div>

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
          <Plus size={16} /> Manage Dispensary Batches
        </Link>
      </div>

      {/* Search and Category Filter */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            flex: 1
          }}>
            <Search size={18} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search by brand name, active molecule / generic formula, or manufacturer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '14px' }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0a4bb5',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Search Catalog
          </button>
        </form>

        {/* Categories Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: selectedCategory === cat ? '#059669' : '#f1f5f9',
                color: selectedCategory === cat ? '#ffffff' : '#475569'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ fontSize: '14px', margin: 0 }}>Querying master drug catalog...</p>
          </div>
        ) : medicines.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Package size={44} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px 0' }}>No Formulations Found</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>Try clearing your search terms or selecting another category.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700' }}>
                  <th style={{ padding: '14px 18px' }}>Brand / Molecule</th>
                  <th style={{ padding: '14px 18px' }}>Formulation & Strength</th>
                  <th style={{ padding: '14px 18px' }}>SKU / Barcode</th>
                  <th style={{ padding: '14px 18px' }}>Manufacturer</th>
                  <th style={{ padding: '14px 18px' }}>Standard Price</th>
                  <th style={{ padding: '14px 18px' }}>Rx Schedule</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Dispensary Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => (
                  <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a' }}>{med.brand_name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{med.generic_name}</div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#334155' }}>
                      <span style={{ textTransform: 'capitalize', fontWeight: '600' }}>{med.dosage_form}</span> ({med.strength})
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#0a4bb5', fontSize: '12px' }}>
                        {med.sku}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                        <QrCode size={12} /> {med.barcode}
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: '#475569' }}>
                      {med.manufacturer || 'Authorized Pharma'}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '800', color: '#0f172a' }}>
                      ₹{med.standard_price}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {med.requires_prescription ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          Rx Mandated
                        </span>
                      ) : (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          background: '#dcfce7',
                          color: '#166534'
                        }}>
                          OTC Available
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <Link
                        to="/pharmacy/batches"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #0a4bb5',
                          background: '#eff6ff',
                          color: '#0a4bb5',
                          fontSize: '12px',
                          fontWeight: '600',
                          textDecoration: 'none'
                        }}
                      >
                        <Plus size={12} /> Stock Batch
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
