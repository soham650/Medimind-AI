import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Map, 
  Check, 
  X, 
  ArrowUpRight, 
  BookOpen, 
  Bookmark,
  RefreshCw,
  Globe
} from 'lucide-react';

export default function TrialsExplorer() {
  const [trials, setTrials] = useState([
    {
      id: 'NCT04561234',
      title: 'Safety of MediMind-AI in Early-Stage Oncology Detection',
      sponsor: 'Global Health Genomics Institute',
      phase: 'Phase II Clinical Trial',
      location: 'Multiple Sites (CA, NY, TX)',
      status: 'Recruiting',
      matching: '94% Compatibility',
      criteria: [
        { text: 'Age 18-65 with confirmed Type II metabolic marker', allowed: true },
        { text: 'Previous failure of standard first-line therapy', allowed: true },
        { text: 'No history of autoimmune cardiovascular issues', allowed: false }
      ]
    },
    {
      id: 'NCT09918273',
      title: 'Personalized mRNA Immunotherapy for Rare Respiratory Syndromes',
      sponsor: 'BioVanguard Labs',
      phase: 'Phase III Randomized Trial',
      location: 'Remote/At-Home Monitoring',
      status: 'Recruiting',
      matching: '82% Compatibility',
      criteria: [
        { text: 'Diagnosed with rare respiratory syndrome', allowed: true },
        { text: 'Age 18-70', allowed: true }
      ]
    }
  ]);

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>Clinical Research Explorer</h2>
        <p style={{ color: '#64748b', fontSize: '13.5px', marginTop: '2px' }}>
          Precision-matched clinical trials and AI-distilled literature based on your unique health profile and genomic data.
        </p>
      </div>

      {/* Trials search bar filter row */}
      <div className="card" style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '16px 20px', background: 'white' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search trials by condition, medication, or NCT number..." 
            style={{ paddingLeft: '36px', fontSize: '13px' }}
          />
        </div>
        <button className="btn btn-primary" style={{ padding: '10px 18px', display: 'flex', gap: '6px', fontSize: '13px' }}><Filter size={16} /> Eligibility</button>
        <button className="btn btn-secondary" style={{ padding: '10px 18px', display: 'flex', gap: '6px', fontSize: '13px' }}>Phase II/III</button>
      </div>

      {/* Main Grid content split */}
      <div className="grid-main-sidebar" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Matched Trials list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Matched Ongoing Trials</h3>
            <span className="badge badge-normal" style={{ background: '#dcfce7', color: '#166534', borderRadius: '12px' }}>8 Matches Found</span>
          </div>

          {trials.map((t, idx) => (
            <div key={idx} className="card" style={{ position: 'relative' }}>
              <button style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Bookmark size={18} /></button>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-normal" style={{ background: '#eff6ff', color: '#0a4bb5', fontSize: '9px', borderRadius: '4px' }}>{t.id}</span>
              </div>

              <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#1e293b', lineHeight: '1.4' }}>{t.title}</h4>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Sponsor: {t.sponsor} • {t.phase}</span>

              {/* Location, Status, Compatibility details */}
              <div className="grid-3" style={{ margin: '16px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '12px 0', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Location</span>
                  <strong style={{ color: '#334155' }}>{t.location}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Status</span>
                  <strong style={{ color: '#166534' }}>● {t.status}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748b', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>AI Matching</span>
                  <strong style={{ color: '#0a4bb5' }}>{t.matching}</strong>
                </div>
              </div>

              {/* Criteria details */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', marginBottom: '8px' }}>Core Eligibility Criteria</span>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', color: '#475569' }}>
                  {t.criteria.map((c, i) => (
                    <li key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {c.allowed ? <Check size={14} color="#10b981" /> : <X size={14} color="#ef4444" />}
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => alert(`Registration request submitted for trial: ${t.id}`)}
                  className="btn btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '6px' }}
                >
                  Apply for Trial
                </button>
                <button 
                  onClick={() => alert('Accessing full clinical protocol PDF document...')}
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '6px' }}
                >
                  View Full Protocol
                </button>
              </div>

            </div>
          ))}

        </div>

        {/* Right Sidebar Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AI Literature Insights */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BookOpen size={18} color="#0a4bb5" />
              <h4 className="card-title">AI Literature Insights</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Insight 1 */}
              <div style={{ paddingBottom: '14px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifySelf: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#0a4bb5', textTransform: 'uppercase' }}>
                  <span>Pubmed Synthesis</span>
                  <span>2 days ago</span>
                </div>
                <strong style={{ display: 'block', fontSize: '13.5px', color: '#1e293b', marginTop: '4px', lineHeight: '1.3' }}>
                  Emerging Efficacy of SGLT2 Inhibitors in Non-Diabetic Renal Support
                </strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                  Recent meta-analysis suggests your current biomarkers align with patients showing 15% improved outcomes...
                </p>
                <a href="#summary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0a4bb5', textDecoration: 'none', fontWeight: '700', marginTop: '6px' }}>
                  Read Summary <ArrowUpRight size={12} />
                </a>
              </div>

              {/* Insight 2 */}
              <div>
                <div style={{ display: 'flex', justifySelf: 'center', justifyContent: 'space-between', fontSize: '10px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase' }}>
                  <span>Genomic Update</span>
                  <span>1 week ago</span>
                </div>
                <strong style={{ display: 'block', fontSize: '13.5px', color: '#1e293b', marginTop: '4px', lineHeight: '1.3' }}>
                  BRCA1 Variant Pathogenicity Reclassification
                </strong>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', lineHeight: '1.4' }}>
                  AI analysis of the 2024 Lancet study indicates your variant 'VUS-402' is being increasingly categorized as benign...
                </p>
                <a href="#summary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#0a4bb5', textDecoration: 'none', fontWeight: '700', marginTop: '6px' }}>
                  Read Summary <ArrowUpRight size={12} />
                </a>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', gap: '6px', fontSize: '12px', marginTop: '10px' }}><RefreshCw size={12} /> Refresh Personalized Feed</button>
            </div>
          </div>

          {/* Clinical Landscape density map */}
          <div className="card">
            <h4 className="card-title" style={{ marginBottom: '12px' }}>Clinical Landscape</h4>
            
            <div style={{
              height: '140px',
              borderRadius: '8px',
              background: '#eff6ff',
              border: '1px dashed #93c5fd',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }} onClick={() => alert('Launching Global Trial Density map visualization...')}>
              <Globe size={32} color="#0a4bb5" />
              <strong style={{ fontSize: '12.5px', color: '#0a4bb5' }}>Trial Density Map (Global)</strong>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
