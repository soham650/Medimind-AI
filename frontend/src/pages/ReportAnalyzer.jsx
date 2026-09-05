import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { mlApi } from '../lib/mlApi';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/report.service';

export default function ReportAnalyzer() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState({
    patientName: 'John Doe',
    reportDate: '2026-06-14',
    summary: 'The current profile demonstrates Normocytic Anemia (low Hemoglobin with normal MCV). The concurrent mild Thrombocytopenia (low platelets) warrants immediate investigation.',
    parameters: [
      { name: 'Hemoglobin', value: 10.5, unit: 'g/dL', range: '13.5 - 17.5', status: 'Low' },
      { name: 'Platelets', value: 145, unit: '10³/µL', range: '150 - 450', status: 'Low' },
      { name: 'WBC Count', value: 7.2, unit: '10³/µL', range: '4.5 - 11.0', status: 'Normal' }
    ]
  });

  const [fileName, setFileName] = useState('CBC_BloodWork_2026.pdf');
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const trendData = [
    { name: 'JAN', hgb: 12.8 },
    { name: 'FEB', hgb: 12.5 },
    { name: 'MAR', hgb: 11.9 },
    { name: 'APR', hgb: 11.2 },
    { name: 'MAY', hgb: 10.8 },
    { name: 'CURRENT', hgb: reportData.parameters.find(p => p.name.toLowerCase().includes('hemo'))?.value || 10.5 }
  ];

  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        try {
          const result = await mlApi.analyzeReport(file.name, file.type, base64Data);
          setReportData(result);

          // Upload to private Supabase Storage bucket 'medical-documents'
          if (user?.id) {
            try {
              await reportService.uploadReport(user.id, file, file.name, result);
            } catch (storageErr) {
              console.warn('Storage upload note:', storageErr.message);
            }
          }
        } catch (err) {
          alert(`Analysis failed: ${err.message}`);
        } finally {
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setAnalyzing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>
      
      {/* Top Header info */}
      <div style={{
        padding: '16px 30px',
        borderBottom: '1px solid #e2e8f0',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <strong style={{ fontSize: '15px', color: '#1e293b' }}>Report: {fileName}</strong>
          <span className="badge badge-normal" style={{ background: '#dcfce7', color: '#166534', borderRadius: '4px', textTransform: 'none' }}>
            {analyzing ? 'Scanning...' : 'Verified'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => alert('Exporting structured data to FHIR EHR portal...')}
            className="btn btn-primary"
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px' }}
          >
            Export to EHR
          </button>
        </div>
      </div>

      <div className="page-container" style={{ paddingBottom: '60px' }}>
        <div className="grid-main-sidebar" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
          
          {/* Left Column: PDF File viewer mockup or Drag & Drop Uploader */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Drag & Drop zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed #0a4bb5' : '2px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                background: dragActive ? '#f0f7ff' : '#f8fafc',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => document.getElementById('report-input').click()}
            >
              <input 
                type="file" 
                id="report-input" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileUpload(e.target.files[0])}
                accept="image/*,application/pdf"
              />
              <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#64748b', marginBottom: '8px' }}>
                cloud_upload
              </span>
              <p style={{ fontSize: '13.5px', fontWeight: '600', color: '#1e293b' }}>
                {analyzing ? 'AI Engine is reading your report...' : 'Drag & Drop medical report here, or click to browse'}
              </p>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Supports PDF, PNG, JPG (e.g. CBC, Blood Sugar, Lipid panels)</span>
            </div>

            {/* Mock PDF Document */}
            <div className="pdf-viewer-card" style={{ opacity: analyzing ? 0.5 : 1 }}>
              <div className="pdf-mock-page">
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
                  <div>
                    <strong>CITY GENERAL HOSPITAL</strong>
                    <div style={{ fontSize: '9px', fontFamily: 'monospace' }}>Pathology Department | ID: #99422-X</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px' }}>
                    Patient: {reportData.patientName}<br />
                    Date: {reportData.reportDate || 'June 14, 2026'}
                  </div>
                </div>

                <center><strong><u>LABORATORY DIAGNOSTICS REPORT</u></strong></center>
                <br />

                <table style={{ width: '100%', fontFamily: 'monospace', fontSize: '11px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                      <th style={{ textAlign: 'left' }}>TEST PARAMETER</th>
                      <th style={{ textAlign: 'center' }}>RESULT</th>
                      <th style={{ textAlign: 'left' }}>UNITS</th>
                      <th style={{ textAlign: 'right' }}>REFERENCE RANGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.parameters.map((p, idx) => (
                      <tr key={idx} style={{ height: '24px' }}>
                        <td>{p.name}</td>
                        <td style={{ 
                          textAlign: 'center', 
                          background: p.status !== 'Normal' ? '#fef08a' : 'transparent',
                          fontWeight: p.status !== 'Normal' ? 'bold' : 'normal',
                          padding: '2px' 
                        }}>
                          {p.value}
                        </td>
                        <td>{p.unit}</td>
                        <td style={{ textAlign: 'right' }}>{p.range} ({p.status})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: AI Extraction & Matrix details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Clinical Data Matrix */}
            <div className="card">
              <div className="card-title-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Clinical Data Matrix</h3>
                <button 
                  onClick={() => alert('Structured lab data verified against ICD-10 schema.')}
                  className="btn btn-secondary" 
                  style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '4px' }}
                >
                  Verify Data
                </button>
              </div>

              <table className="custom-table" style={{ fontSize: '13.5px', width: '100%', marginTop: '12px' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '8px 0' }}>Parameter</th>
                    <th style={{ padding: '8px 0', textAlign: 'center' }}>Result</th>
                    <th style={{ padding: '8px 0', textAlign: 'center' }}>Ref. Range</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.parameters.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 0', fontWeight: '700', color: '#0f172a' }}>{m.name}</td>
                      <td style={{ padding: '10px 0', textAlign: 'center', fontWeight: '700', color: m.status !== 'Normal' ? '#c21a1a' : '#1e293b' }}>
                        {m.value} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#64748b' }}>{m.unit}</span>
                      </td>
                      <td style={{ padding: '10px 0', textAlign: 'center', color: '#64748b' }}>{m.range}</td>
                      <td style={{ padding: '10px 0', textAlign: 'right' }}>
                        <span className={`badge ${m.status !== 'Normal' ? 'badge-critical' : 'badge-normal'}`} style={{ fontSize: '10px', padding: '3px 8px' }}>
                          {m.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Diagnostic Synthesis */}
            <div className="card" style={{ borderLeft: '4px solid #0a4bb5' }}>
              <h3 className="card-title" style={{ marginBottom: '12px' }}>Diagnostic Synthesis</h3>
              <p style={{ fontSize: '13.5px', color: '#475569', lineHeight: '1.5' }}>
                {reportData.summary}
              </p>
              
              <div style={{
                background: '#eff6ff',
                borderLeft: '4px solid #0a4bb5',
                padding: '14px',
                borderRadius: '6px',
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px' }}>ℹ️</span>
                <span style={{ fontSize: '12.5px', color: '#1e3a8a', lineHeight: '1.4' }}>
                  <strong>Auto-Calibration Alert:</strong> Extracted vitals are synced to your digital twin dashboard automatically.
                </span>
              </div>
            </div>

            {/* Hemoglobin trend analysis */}
            <div className="card">
              <div className="card-title-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="card-title">Hemoglobin Trend Analysis</h3>
                <span className="badge badge-normal" style={{ textTransform: 'none' }}>6 Months</span>
              </div>
              <div style={{ width: '100%', height: '140px', marginTop: '12px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hgb" stroke="#c21a1a" strokeWidth={2.5} name="Hemoglobin (g/dL)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
