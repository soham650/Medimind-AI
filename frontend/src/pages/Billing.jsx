import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldCheck, 
  Plus, 
  ArrowUpRight, 
  Download, 
  ExternalLink,
  History,
  FileBadge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([
    { service: 'Cardiology Consultation (Dr. Sarah Miller)', date: 'Oct 24, 2023', status: 'SUCCESS', statusClass: 'badge-normal', amount: '₹800.00' },
    { service: 'Full Body Health Checkup (Quest Diagnostics)', date: 'Oct 18, 2023', status: 'SUCCESS', statusClass: 'badge-normal', amount: '₹4,250.00' },
    { service: 'AI MRI Analysis (Automated Report)', date: 'Oct 12, 2023', status: 'REFUNDED', statusClass: 'badge-warning', amount: '₹1,200.00' }
  ]);

  const [claims, setClaims] = useState([
    { ins: 'Star Health Insurance', ref: 'CLM-882941-X', status: 'PROCESSING', statusClass: 'badge-warning', amt: '₹12,450' },
    { ins: 'HDFC ERGO', ref: 'CLM-441202-A', status: 'SETTLED', statusClass: 'badge-normal', amt: '₹5,000' }
  ]);

  useEffect(() => {
    if (user?.id) {
      Promise.all([
        supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('medicine_orders').select('*').eq('patient_id', user.id).order('created_at', { ascending: false })
      ]).then(([paymentsRes, ordersRes]) => {
        const liveTx = [];
        if (paymentsRes.data && paymentsRes.data.length > 0) {
          paymentsRes.data.forEach(p => {
            liveTx.push({
              service: `Clinical Service Ref: ${p.transaction_reference}`,
              date: new Date(p.created_at).toLocaleDateString(),
              status: p.status.toUpperCase(),
              statusClass: p.status === 'completed' ? 'badge-normal' : 'badge-warning',
              amount: `₹${Number(p.amount).toFixed(2)}`
            });
          });
        }
        if (ordersRes.data && ordersRes.data.length > 0) {
          ordersRes.data.forEach(o => {
            liveTx.push({
              service: `Medicine Order #${o.order_number}`,
              date: new Date(o.created_at).toLocaleDateString(),
              status: o.payment_status.toUpperCase(),
              statusClass: o.payment_status === 'paid' ? 'badge-normal' : 'badge-warning',
              amount: `₹${Number(o.total_amount).toFixed(2)}`
            });
          });
        }
        if (liveTx.length > 0) {
          setTransactions(liveTx);
        }
        setLoading(false);
      }).catch(err => {
        console.warn('Notice loading billing data:', err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Billing & Insurance</h2>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
          Manage your healthcare expenses, insurance claims, and subscriptions securely.
        </p>
      </div>

      <div className="grid-main-sidebar" style={{ gridTemplateColumns: '1.4fr 0.8fr' }}>
        
        {/* Left Column: Upgrade plan & Payments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Upgrade Plan Card */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #10b981' }}>
            <div>
              <span className="badge badge-normal" style={{ fontSize: '9px', background: '#dcfce7', color: '#166534', borderRadius: '4px' }}>
                ★ MEDIMIND AI PREMIUM
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#1e293b', marginTop: '6px' }}>Upgrade to AI-Enhanced Monitoring</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px', maxWidth: '350px' }}>
                Get 24/7 predictive health alerts, priority AI diagnosis, and unlimited secure storage for medical records.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>₹1,499<span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}> / month</span></div>
              <button 
                onClick={() => alert('Starting your 14-day free premium trial...')}
                className="btn btn-primary" 
                style={{ marginTop: '8px', padding: '10px 18px', fontSize: '12.5px' }}
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title">Payment Methods</h3>
              <span className="badge badge-normal" style={{ textTransform: 'none', background: '#dcfce7', color: '#166534' }}>
                ✓ Secure Transaction
              </span>
            </div>

            <div className="grid-2" style={{ gap: '16px' }}>
              {/* Razorpay */}
              <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                <span className="badge badge-normal" style={{ fontSize: '9px', background: '#eff6ff', color: '#0a4bb5', borderRadius: '4px' }}>India</span>
                <strong style={{ display: 'block', fontSize: '13.5px', color: '#1e293b', marginTop: '8px' }}>Razorpay Payment Gateway</strong>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                  UPI, Netbanking, Local Wallets & Debit/Credit Cards.
                </p>
                <button 
                  onClick={() => alert('Opening Razorpay overlay...')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '12px', fontSize: '12.5px', padding: '8px' }}
                >
                  Pay via Razorpay →
                </button>
              </div>

              {/* Stripe */}
              <div style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                <span className="badge badge-normal" style={{ fontSize: '9px', background: '#f1f5f9', color: '#475569', borderRadius: '4px' }}>International</span>
                <strong style={{ display: 'block', fontSize: '13.5px', color: '#1e293b', marginTop: '8px' }}>Stripe Checkout</strong>
                <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                  Global Credit Cards, Apple Pay, Google Pay & Swift transfers.
                </p>
                <button 
                  onClick={() => alert('Redirecting to Stripe checkout portal...')}
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '12px', fontSize: '12.5px', padding: '8px' }}
                >
                  Pay via Stripe →
                </button>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Recent Transactions</h3>
              <a href="#history" style={{ fontSize: '12px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none' }}>View All History</a>
            </div>

            <table className="custom-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Service / Lab Test</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{t.service}</td>
                    <td style={{ color: '#64748b' }}>{t.date}</td>
                    <td>
                      <span className={`badge ${t.statusClass}`} style={{ fontSize: '9px' }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '700', color: '#1e293b' }}>{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ABHA Secure Locker */}
          <div style={{
            background: 'linear-gradient(135deg, #0a4bb5 0%, #032363 100%)',
            color: 'white',
            borderRadius: '12px',
            padding: '24px',
            position: 'relative'
          }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#bfdbfe', letterSpacing: '0.5px' }}>Health Registry identity</span>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '6px' }}>Your ABHA Identity</h3>
            
            <div style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '12px 16px',
              margin: '16px 0',
              fontFamily: 'monospace',
              fontSize: '16px',
              letterSpacing: '1px',
              textAlign: 'center'
            }}>
              91-4523-8841-0922
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={() => alert('Fetching latest ABDM consent requests...')}
                className="btn btn-secondary" 
                style={{ background: 'white', color: '#0a4bb5', border: 'none', width: '100%', fontSize: '12px' }}
              >
                Sync Medical Records
              </button>
              <button 
                onClick={() => alert('Accessing ABHA digital locker...')}
                className="btn btn-secondary" 
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', width: '100%', fontSize: '12px' }}
              >
                Digital Health Locker
              </button>
            </div>
          </div>

          {/* Insurance Claims */}
          <div className="card">
            <h4 className="card-title" style={{ marginBottom: '16px' }}>Insurance Claims</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              {claims.map((c, i) => (
                <div key={i} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{c.ins}</strong>
                    <span className={`badge ${c.statusClass}`} style={{ fontSize: '8px', padding: '1px 4px' }}>{c.status}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '2px' }}>Ref: {c.ref}</span>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#1e293b' }}>{c.amt}</strong>
                    <a href="#track" style={{ fontSize: '11px', color: '#0a4bb5', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '2px' }}>Track <ExternalLink size={10} /></a>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => alert('New clinical insurance claim creation started...')}
              className="btn btn-secondary" 
              style={{ width: '100%', display: 'flex', gap: '6px', fontSize: '12px', justifyContent: 'center' }}
            >
              <Plus size={14} /> New Claim Request
            </button>
          </div>

          {/* Section 80D Tax benefits */}
          <div className="card" style={{ background: '#f0fdf4', borderColor: '#dcfce7' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>ℹ️</span>
              <strong style={{ fontSize: '13px', color: '#14532d' }}>Section 80D Benefits</strong>
            </div>
            <p style={{ fontSize: '12px', color: '#15803d', lineHeight: '1.4' }}>
              Don't forget to download your 80D Tax Certificates for the current financial year. You've saved <strong>₹24,000</strong> in taxable income so far.
            </p>
            <button 
              onClick={() => alert('Downloading Section 80D Tax benefits certificate PDF...')}
              className="btn btn-secondary" 
              style={{ width: '100%', marginTop: '12px', background: '#white', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '12.5px', display: 'flex', gap: '6px', justifyContent: 'center' }}
            >
              <Download size={14} /> Download 80D Certificate
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
