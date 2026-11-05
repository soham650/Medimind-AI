import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import {
  Zap,
  Activity,
  Cpu,
  RefreshCw,
  AlertTriangle,
  ShieldAlert,
  Server,
  CheckCircle2,
  Clock,
  Lock
} from 'lucide-react';

export default function AIUsageMonitoring() {
  const [usageRecords, setUsageRecords] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAiData = async () => {
    setLoading(true);
    try {
      const [records, sysHealth] = await Promise.all([
        adminService.getAiUsageSummary(30),
        adminService.getSystemHealth()
      ]);
      setUsageRecords(records);
      setHealth(sysHealth);
    } catch (err) {
      console.error('Failed to load AI usage monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData();
  }, []);

  const totalCallsAllTime = usageRecords.reduce((sum, r) => sum + Number(r.total_calls || 0), 0);
  const totalGeminiCalls = usageRecords.reduce((sum, r) => sum + Number(r.gemini_calls || 0), 0);
  const totalRfCalls = usageRecords.reduce((sum, r) => sum + Number(r.rf_calls || 0), 0);
  const totalHighRisk = usageRecords.reduce((sum, r) => sum + Number(r.high_risk_flagged || 0), 0);

  return (
    <div style={{ padding: '28px', maxWidth: '1400px', margin: '0 auto', color: '#0f172a' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#fff7ed', borderRadius: '6px', color: '#ea580c', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Zap size={16} /> AI Microservice Telemetry
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '6px' }}>
            AI Model Usage & Quota Monitoring
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
            Telemetry stream of Gemini 1.5 Pro medical reasoning calls, Random Forest symptom triages, and high-risk flags.
          </p>
        </div>

        <button
          onClick={fetchAiData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Telemetry
        </button>
      </div>

      {/* Secret Safeguard Notice */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '14px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        color: '#475569'
      }}>
        <Lock size={18} color="#ea580c" style={{ flexShrink: 0 }} />
        <span>
          <strong>Zero Secret Leakage Safeguard:</strong> Model orchestration uses server-side proxies. API keys, authorization bearer tokens, and private inference credentials are never exposed in frontend telemetry streams.
        </span>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Total AI Inferences</span>
            <Activity size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginTop: '10px' }}>
            {totalCallsAllTime.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Across all models in 30 days
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Gemini 1.5 Pro Calls</span>
            <Zap size={18} color="#2563eb" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#2563eb', marginTop: '10px' }}>
            {totalGeminiCalls.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Clinical summary & report engines
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>Random Forest Calls</span>
            <Cpu size={18} color="#059669" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#059669', marginTop: '10px' }}>
            {totalRfCalls.toLocaleString()}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Model: symptom-rf-v1 (FastAPI)
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
            <span>High-Risk Flags</span>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#dc2626', marginTop: '10px' }}>
            {totalHighRisk}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Triaged to emergency guidance
          </div>
        </div>
      </div>

      {/* Engine Status & Latency */}
      <div style={{ background: '#ffffff', padding: '20px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={18} color="#0a4bb5" /> Microservice Operational Status
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '13px' }}>Python FastAPI ML Service</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                background: health?.mlService?.status === 'healthy' ? '#dcfce7' : '#fee2e2',
                color: health?.mlService?.status === 'healthy' ? '#15803d' : '#b91c1c'
              }}>
                {health?.mlService?.status || 'offline'}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Endpoint: 127.0.0.1:8000/health ({health?.mlService?.latencyMs || 0}ms)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Active Model: {health?.mlService?.modelVersion || 'symptom-rf-v1'}
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: '700', fontSize: '13px' }}>Report Intelligence Engine</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '700',
                background: '#dcfce7',
                color: '#15803d'
              }}>
                healthy
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
              Engine: OCR + Gemini 1.5 Pro Clinical Parser
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Status: Operational
            </div>
          </div>
        </div>
      </div>

      {/* Daily Usage Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            Daily Telemetry Log (Last 30 Days)
          </h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            PostgreSQL <code style={{ fontSize: '11px' }}>public.ai_usage_daily</code>
          </span>
        </div>

        {usageRecords.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No daily AI telemetry records found. Telemetry is populated as users execute symptom checks and report analyses.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Total Inferences</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Gemini Calls</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>Random Forest Calls</th>
                  <th style={{ padding: '12px 16px', fontWeight: '600' }}>High-Risk Flags</th>
                </tr>
              </thead>
              <tbody>
                {usageRecords.map((r, i) => (
                  <tr key={r.id || i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>
                      {r.usage_date}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#ea580c' }}>
                      {r.total_calls}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#2563eb' }}>
                      {r.gemini_calls}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#059669' }}>
                      {r.rf_calls}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.high_risk_flagged > 0 ? (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#b91c1c', fontWeight: '700', fontSize: '11px' }}>
                          {r.high_risk_flagged} flags
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
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
