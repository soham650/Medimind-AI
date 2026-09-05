import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mlApi } from '../lib/mlApi';
import { aiService } from '../services/ai.service';
import { useAuth } from '../hooks/useAuth';
import { Send, History, Download, Mic, Paperclip, Activity, Heart, CalendarDays, Pill } from 'lucide-react';

export default function Chatbot() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Load chat history from Supabase
    supabase
      .from('chat_history')
      .select('messages')
      .eq('patient_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setMessages(data.messages || []);
        } else {
          // Initialize default messages if empty
          const defaults = [
            {
              sender: 'bot',
              text: "Hello! I am the MediMind Healthcare Assistant. How can I help you today? Please tell me if you are experiencing any symptoms, or if you need general health tips.",
              timestamp: new Date().toISOString()
            }
          ];
          setMessages(defaults);
          // Insert initial row in Supabase
          if (user) {
            supabase.from('chat_history').insert({ patient_id: user.id, messages: defaults }).then(() => {});
          }
        }
      });
  }, [user]);

  const saveHistory = async (newMessages) => {
    if (!user) return;
    await supabase
      .from('chat_history')
      .update({ messages: newMessages, updated_at: new Date().toISOString() })
      .eq('patient_id', user.id);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const userMsg = { 
      sender: 'patient', 
      text: inputVal, 
      timestamp: new Date().toISOString() 
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputVal('');
    setLoading(true);

    try {
      // 1. Primary: Direct Google AI Studio Gemini integration using configured API key
      const geminiReply = await aiService.chatWithGemini(userMsg.text, updated);
      
      const botMsg = {
        sender: 'bot',
        text: geminiReply,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updated, botMsg];
      setMessages(finalMessages);
      await saveHistory(finalMessages);
    } catch (err) {
      console.warn('Gemini chat fallback to ML service:', err);
      try {
        const reply = await mlApi.getChatReply(userMsg.text, updated);
        const botMsg = {
          sender: 'bot',
          text: reply.text,
          timestamp: reply.timestamp || new Date().toISOString()
        };
        const finalMessages = [...updated, botMsg];
        setMessages(finalMessages);
        await saveHistory(finalMessages);
      } catch (innerErr) {
        console.error(innerErr);
        const errorMsg = {
          sender: 'bot',
          text: 'I apologize, I am unable to connect to the medical assistant at this moment. Please check if the services are active.',
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (text) => {
    setInputVal(text);
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear the conversation history?')) return;
    const defaults = [
      {
        sender: 'bot',
        text: "Conversation cleared. Tell me if you are experiencing any symptoms, or if you need general health tips.",
        timestamp: new Date().toISOString()
      }
    ];
    setMessages(defaults);
    await saveHistory(defaults);
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Bot Header Row */}
      <div style={{
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px', background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
          }}>
            🤖
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b' }}>MediMind AI Assistant</h3>
            <span style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Active Security Guardrails Enabled
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={clearHistory} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            <History size={14} /> Clear History
          </button>
        </div>
      </div>

      {/* Message Area */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '420px', background: '#ffffff', marginTop: '20px' }}>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '450px', paddingRight: '4px' }}>
          
          {messages.map((m, idx) => (
            <div key={idx} style={{ 
              alignSelf: m.sender === 'patient' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              display: 'flex',
              gap: '12px'
            }}>
              {m.sender !== 'patient' && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: '#0a4bb5', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0
                }}>
                  M
                </div>
              )}
              <div>
                <div style={{
                  background: m.sender === 'patient' ? '#f1f5f9' : '#eff6ff',
                  color: '#1e293b',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  borderTopRightRadius: m.sender === 'patient' ? '2px' : '12px',
                  borderTopLeftRadius: m.sender !== 'patient' ? '2px' : '12px',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  color: '#94a3b8', 
                  display: 'block', 
                  marginTop: '4px', 
                  textAlign: m.sender === 'patient' ? 'right' : 'left',
                  marginRight: m.sender === 'patient' ? '4px' : '0',
                  marginLeft: m.sender !== 'patient' ? '4px' : '0'
                }}>
                  {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%', background: '#0a4bb5', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0
              }}>
                M
              </div>
              <div style={{ background: '#eff6ff', color: '#1e293b', padding: '14px 18px', borderRadius: '12px', borderTopLeftRadius: '2px', fontSize: '13px' }}>
                Typing diagnostics...
              </div>
            </div>
          )}

        </div>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          <button onClick={() => handleChip('Check my latest blood report')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', background: '#eff6ff', color: '#0a4bb5', border: '1px solid rgba(10, 75, 181, 0.15)' }}><Activity size={12} /> Check my latest report</button>
          <button onClick={() => handleChip('Explain high blood pressure symptoms')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', background: '#eff6ff', color: '#0a4bb5', border: '1px solid rgba(10, 75, 181, 0.15)' }}><Heart size={12} /> Explain my symptoms</button>
          <button onClick={() => handleChip('Book a doctor consultation')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', background: '#eff6ff', color: '#0a4bb5', border: '1px solid rgba(10, 75, 181, 0.15)' }}><CalendarDays size={12} /> Book a follow-up</button>
          <button onClick={() => handleChip('Aspirin and Warfarin interaction')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', background: '#eff6ff', color: '#0a4bb5', border: '1px solid rgba(10, 75, 181, 0.15)' }}><Pill size={12} /> Drug Interaction Check</button>
        </div>

        {/* Chat input box */}
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button type="button" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Paperclip size={18} /></button>
            <button type="button" style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Mic size={18} /></button>
          </div>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Type your clinical query here..." 
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}><Send size={16} /></button>
        </form>

        {/* Disclaimer footer */}
        <div style={{ fontSize: '11px', color: '#c21a1a', textAlign: 'center', lineHeight: '1.4' }}>
          <strong>Clinical Disclaimer:</strong> MediMind AI is for informational purposes and intended for clinician use only. It is not a substitute for professional medical judgment, diagnosis, or treatment. Always verify critical clinical findings before taking action.
        </div>

      </div>

    </div>
  );
}
