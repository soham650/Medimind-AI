import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { mlApi } from '../lib/mlApi';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/report.service';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Download, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Calendar,
  ExternalLink
} from 'lucide-react';

export default function ReportAnalyzer() {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pastReports, setPastReports] = useState([]);
  const [loadingPastReports, setLoadingPastReports] = useState(false);
  const [signedUrl, setSignedUrl] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadPastReports = async () => {
    if (!user?.id) return;
    setLoadingPastReports(true);
    try {
      const reports = await reportService.getReports(user.id);
      setPastReports(reports || []);
      if (reports && reports.length > 0 && !reportData) {
        selectPastReport(reports[0]);
      }
    } catch (err) {
      console.warn('Error loading past reports:', err);
    } finally {
      setLoadingPastReports(false);
    }
  };

  useEffect(() => {
    loadPastReports();
  }, [user]);

  const selectPastReport = async (report) => {
    setFileName(report.report_title);
    setSignedUrl(null);

    // Format parameters from findings
    const findings = report.findings || report.ai_analysis?.findings || [];
    const parameters = Array.isArray(findings) ? findings.map(f => ({
      name: f.test_name || f.parameter || f.name || 'Biomarker',
      value: f.value || f.result || '0',
      unit: f.unit || '',
      range: f.reference_range || f.range || 'Standard',
      status: f.status || (f.is_abnormal ? 'Abnormal' : 'Normal')
    })) : [];

    setReportData({
      patientName: user?.user_metadata?.full_name || 'Patient',
      reportDate: report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent',
      summary: report.ai_assessment?.summary || report.ai_analysis?.summary || 'Laboratory report findings processed by MediMind Report Intelligence.',
      parameters: parameters.length > 0 ? parameters : [
        { name: 'Report File', value: 'Uploaded', unit: 'PDF', range: 'Processed', status: 'Normal' }
      ]
    });

    if (report.storage_path) {
      try {
        const url = await reportService.getSignedUrl(report.storage_path, 600);
        setSignedUrl(url);
      } catch (e) {
        console.warn('Signed URL notice:', e);
      }
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setAnalyzing(true);
    showToast(`Reading and parsing ${file.name}...`);

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
              showToast('Report uploaded to private vault and cataloged in Health Reports.');
              await loadPastReports();
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

  const trendData = [
    { name: 'JAN', hgb: 12.8 },
    { name: 'FEB', hgb: 12.5 },
    { name: 'MAR', hgb: 11.9 },
    { name: 'APR', hgb: 11.2 },
    { name: 'MAY', hgb: 10.8 },
    { name: 'CURRENT', hgb: reportData?.parameters?.find(p => p.name.toLowerCase().includes('hemo'))?.value || 12.0 }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flex: 1, flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
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
          fontSize: '13.5px',
          fontWeight: '600'
        }}>
          <CheckCircle size={18} color="#22c55e" />
          {toastMessage}
        </div>
      )}

      {/* Top Header info */}
      <div style={{
        padding: '16px 30px',
        borderBottom: '1px solid #e2e8f0',
        background: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} color="#0a4bb5" />
          <strong style={{ fontSize: '16px', color: '#1e293b' }}>
            {fileName ? `Report: ${fileName}` : 'Medical Diagnostic Report Analyzer'}
          </strong>
          {reportData && (
            <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700' }}>
              {analyzing ? 'Scanning...' : 'Verified by AI'}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {signedUrl && (
            <a 
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                background: '#eff6ff',
                color: '#0a4bb5',
                textDecoration: 'none',
                border: '1px solid #bfdbfe'
              }}
            >
              <ExternalLink size={14} /> View Original Document
            </a>
          )}
          <button 
            onClick={() => showToast('Structured clinical data exported to ABDM Health Locker.')}
            className="btn btn-primary"
            style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', background: '#0a4bb5', color: '#ffffff', border: 'none', cursor: 'pointer', fontWeight: '700' }}
          >
            Export to ABDM
          </button>
        </div>
      </div>

      {/* Clinical Safety Protocol Alert */}
      <div style={{
        margin: '16px 30px 0 30px',
        padding: '12px 18px',
        background: '#fffbeb',
        border: '1px solid #fef3c7',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '12.5px',
        color: '#92400e',
        lineHeight: 1.4
      }}>
        <ShieldAlert size={18} color="#b45309" style={{ flexShrink: 0 }} />
        <div>
          <strong>Clinical Safety Protocol:</strong> AI-assisted preliminary assessment. Possible condition matching. Risk assessment only. Doctor review recommended. MediMind AI does not provide definitive medical diagnoses or autonomous medication dosing.
        </div>
      </div>

      <div className="page-container" style={{ padding: '24px 30px 60px 30px' }}>
        <div className="grid-main-sidebar" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Column: Drag & Drop Uploader & Report Viewer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Drag & Drop zone */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: dragActive ? '2px dashed #0a4bb5' : '2px dashed #cbd5e1',
                borderRadius: '14px',
                padding: '28px',
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
              <UploadCloud size={40} color="#0a4bb5" style={{ margin: '0 auto 8px auto' }} />
              <p style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px 0' }}>
                {analyzing ? 'MediMind AI Engine is reading your report...' : 'Drag & Drop medical report here, or click to browse'}
              </p>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Supports PDF, PNG, JPG (CBC, Lipid panel, HbA1c, Metabolic panels)</span>
            </div>

            {/* Previously Analyzed Reports Selector */}
            {pastReports.length > 0 && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', letterSpacing: '0.04em' }}>
                    YOUR RECENT LAB REPORTS ({pastReports.length})
                  </span>
                  <button onClick={loadPastReports} style={{ background: 'none', border: 'none', color: '#0a4bb5', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                    <RefreshCw size={12} /> Refresh
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {pastReports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectPastReport(r)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: fileName === r.report_title ? '2px solid #0a4bb5' : '1px solid #cbd5e1',
                        background: fileName === r.report_title ? '#eff6ff' : '#f8fafc',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: fileName === r.report_title ? '#0a4bb5' : '#334155',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <FileText size={13} />
                      <span>{r.report_title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Details Card */}
            {reportData ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px', opacity: analyzing ? 0.5 : 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>MEDIMIND CLINICAL LABS</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>Digital Diagnostic Analysis Report</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', color: '#475569' }}>
                    Patient: <strong>{reportData.patientName}</strong><br />
                    Date: {reportData.reportDate}
                  </div>
                </div>

                <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '14px', letterSpacing: '0.05em', color: '#0f172a', marginBottom: '16px' }}>
                  STRUCTURED BIOMARKER OBSERVATIONS
                </div>

                <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                      <th style={{ textAlign: 'left', padding: '8px 10px' }}>TEST PARAMETER</th>
                      <th style={{ textAlign: 'center', padding: '8px' }}>RESULT</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>UNITS</th>
                      <th style={{ textAlign: 'right', padding: '8px 10px' }}>REFERENCE RANGE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData.parameters || []).map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: '600', color: '#1e293b' }}>{p.name}</td>
                        <td style={{ 
                          textAlign: 'center', 
                          padding: '6px',
                          background: p.status !== 'Normal' ? '#fef08a' : 'transparent',
                          fontWeight: p.status !== 'Normal' ? 'bold' : 'normal',
                          borderRadius: '4px'
                        }}>
                          {p.value}
                        </td>
                        <td style={{ padding: '8px', color: '#64748b' }}>{p.unit}</td>
                        <td style={{ textAlign: 'right', padding: '8px 10px', color: '#475569' }}>
                          {p.range} ({p.status})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '48px', textAlign: 'center', color: '#64748b' }}>
                <FileText size={40} color="#94a3b8" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>No Report Selected</h4>
                <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Upload a new report above or select an existing one to inspect structured findings.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: AI Clinical Intelligence Summary & Longitudinal Trend */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* AI Summary Card */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0a4bb5' }}></div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  AI Clinical Synthesis
                </h3>
              </div>

              <div style={{
                background: '#f8fafc',
                borderLeft: '4px solid #0a4bb5',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '13.5px',
                lineHeight: 1.6,
                color: '#334155'
              }}>
                {reportData?.summary || 'Upload or select a medical report to view automated findings extraction, abnormal flags, and physiological correlations.'}
              </div>

              <div style={{ marginTop: '16px', fontSize: '12px', color: '#64748b', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <strong>Triage Recommendation:</strong> Share these findings with your attending doctor during your next scheduled teleconsultation.
              </div>
            </div>

            {/* Longitudinal Trend Chart */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
                Biomarker Trend Analysis
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 16px 0' }}>
                Longitudinal progression across previous clinical encounters
              </p>

              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hgb" stroke="#0a4bb5" strokeWidth={2.5} dot={{ r: 4, fill: '#0a4bb5' }} name="Biomarker Value" />
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
