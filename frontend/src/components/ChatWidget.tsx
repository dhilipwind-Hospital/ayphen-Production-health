import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Minimal floating chat widget MVP
// - Fixed bottom-left, opposite to WhatsApp badge
// - Sends messages to /api/public/chat
// - Keeps a small in-memory history and persists last 20 messages in localStorage

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  ts: number;
};

type Suggestion = { label: string; url?: string; message?: string };
type DepartmentOption = { id: string; name: string };
type DoctorOption = { id: string; firstName: string; lastName: string; departmentId?: string; department?: { id?: string; name?: string } };

const STORAGE_KEY = 'hw_chat_history_v1';
const SESSION_KEY = 'hw_chat_session_v1';

const ChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [mode, setMode] = useState<'chat' | 'book'>('chat');
  const [bookForm, setBookForm] = useState<{ name: string; phone: string; department?: string; serviceId?: string; doctorId?: string }>({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [depLoading, setDepLoading] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages]);

  // Load departments when entering booking mode
  useEffect(() => {
    // Pre-fill from logged-in user profile if empty
    if (mode === 'book' && user) {
      const nameFromUser = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
      const phoneFromUser = (user as any)?.phone || '';
      setBookForm(f => ({
        name: f.name || nameFromUser || '',
        phone: f.phone || phoneFromUser || '',
        department: f.department,
        serviceId: f.serviceId,
      }));
    }

    // Try to infer department from latest user message
    if (mode === 'book') {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.text?.toLowerCase() || '';
      if (lastUserMsg) {
        const maps: Array<{ rx: RegExp; dept: string }> = [
          { rx: /(chest pain|palpitation|breathless|ecg|bp high)/, dept: 'Cardiology' },
          { rx: /(fracture|bone|joint|sprain|knee|shoulder|back pain)/, dept: 'Orthopedics' },
          { rx: /(fever|cough|cold|flu|general check|headache)/, dept: 'General Medicine' },
          { rx: /(pregnan|gyneco|gynaeco|menstru|period|women|obstetric)/, dept: 'Gynecology' },
          { rx: /(kidney|urine|urology|stones)/, dept: 'Urology' },
          { rx: /(cancer|tumor|oncology)/, dept: 'Oncology' },
          { rx: /(mental|anxiety|depress|psychiat)/, dept: 'Psychiatry' },
          { rx: /(skin|derma|rash|acne|eczema)/, dept: 'Dermatology' },
          { rx: /(child|pediatric|kid)/, dept: 'Pediatrics' },
          { rx: /(stroke|numb|weak side|slurred speech|seizure|epilepsy)/, dept: 'Neurology' },
        ];
        const found = maps.find(m => m.rx.test(lastUserMsg));
        if (found) {
          setBookForm(f => ({ ...f, department: f.department || found.dept }));
        }
      }
    }

    const loadDeps = async () => {
      try {
        setDepLoading(true);
        const res = await fetch('/api/departments');
        const data = await res.json();
        const items = (data?.data || data || []) as any[];
        const options: DepartmentOption[] = items.map((d: any) => ({ id: String(d.id ?? d.name), name: String(d.name ?? '') })).filter(d => d.name);
        setDepartments(options);
      } catch {
        setDepartments([]);
      } finally {
        setDepLoading(false);
      }
    };
    if (mode === 'book' && departments.length === 0 && !depLoading) {
      loadDeps();
    }
  }, [mode]);

  // Load doctors list; filter by selected department on the client
  useEffect(() => {
    const loadDocs = async () => {
      try {
        setDocLoading(true);
        const res = await fetch('/api/public/doctors');
        const data = await res.json();
        const items = (data?.data || data || []) as any[];
        const options: DoctorOption[] = items.map((u: any) => ({ id: String(u.id), firstName: u.firstName || '', lastName: u.lastName || '', department: u.department }));
        setDoctors(options);
      } catch {
        setDoctors([]);
      } finally {
        setDocLoading(false);
      }
    };
    if (mode === 'book' && doctors.length === 0 && !docLoading) {
      loadDocs();
    }
  }, [mode]);

  const sessionId = useMemo(() => {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg: ChatMessage = { id: 'u_' + Date.now(), role: 'user', text, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text })
      });
      const data = await res.json();
      const botText = data?.reply ?? 'Sorry, I could not process that.';
      const sugg = (data?.suggestions ?? []) as Suggestion[];
      const botMsg: ChatMessage = { id: 'a_' + Date.now(), role: 'assistant', text: botText, ts: Date.now() };
      setMessages(prev => [...prev, botMsg]);
      if (Array.isArray(sugg)) setSuggestions(sugg);
    } catch (e) {
      const errMsg: ChatMessage = { id: 'e_' + Date.now(), role: 'system', text: 'Network error. Please try again.', ts: Date.now() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestion = (s: Suggestion) => {
    if (s.label && s.label.toLowerCase().includes('book appointment')) {
      setMode('book');
      return;
    }
    if (s.url) {
      window.location.href = s.url;
      return;
    }
    if (s.message) {
      setInput(s.message);
      setTimeout(() => send(), 0);
    }
  };

  const submitAppointment = async () => {
    if (!bookForm.name.trim() || !bookForm.phone.trim()) {
      setMessages(prev => [...prev, { id: 'e_' + Date.now(), role: 'system', text: 'Please enter your name and phone number.', ts: Date.now() }]);
      return;
    }
    // basic phone validation: 7-15 digits, optional leading +
    const phoneOk = /^\+?[0-9]{7,15}$/.test(bookForm.phone.trim());
    setPhoneValid(phoneOk);
    if (!phoneOk) {
      setMessages(prev => [...prev, { id: 'e_' + Date.now(), role: 'system', text: 'Please enter a valid phone number (7-15 digits).', ts: Date.now() }]);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/public/appointment-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookForm.name,
          phone: bookForm.phone,
          departmentName: bookForm.department || undefined,
          serviceId: bookForm.serviceId || undefined,
          doctorId: bookForm.doctorId || undefined,
          notes: 'Booked via chat widget'
        })
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const apptId = data?.appointmentId || data?.appointment?.id;
      const successText = apptId ? `Appointment request received (ID: ${apptId}). Our team will contact you shortly. Redirecting to home…` : 'Appointment request received. Our team will contact you shortly. Redirecting to home…';
      setMessages(prev => [...prev, { id: 'a_' + Date.now(), role: 'assistant', text: successText, ts: Date.now() }]);
      setMode('chat');
      setBookForm({ name: '', phone: '' });
      setTimeout(() => {
        window.location.href = '/home';
      }, 1500);
    } catch (e) {
      setMessages(prev => [...prev, { id: 'e_' + Date.now(), role: 'system', text: 'Could not submit appointment right now. Please try again.', ts: Date.now() }]);
    } finally {
      setSubmitting(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Styles kept inline for MVP simplicity
  return (
    <div aria-live="polite" aria-label="AI Assistant Chat Widget" style={{ position: 'fixed', left: 20, bottom: 20, zIndex: 1100 }}>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            background: '#1677ff',
            color: '#fff',
            border: 'none',
            boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform .15s ease, box-shadow .15s ease'
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white" fillOpacity="0.15"/>
            <path d="M20 3.5H4.5C3.67 3.5 3 4.17 3 5V19.5L6.5 16H20.5C21.33 16 22 15.33 22 14.5V5C22 4.17 21.33 3.5 20.5 3.5Z" stroke="white" strokeWidth="1.5"/>
            <circle cx="8" cy="10.5" r="1.2" fill="white"/>
            <circle cx="12" cy="10.5" r="1.2" fill="white"/>
            <circle cx="16" cy="10.5" r="1.2" fill="white"/>
          </svg>
        </button>
      )}
      {open && (
        <div
          role="dialog"
          aria-modal
          style={{
            width: 320,
            height: 420,
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '10px 12px', background: '#1677ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700 }}>AI Assistant</div>
            <button onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
          </div>
          <div ref={listRef} style={{ flex: 1, padding: 12, overflowY: 'auto', background: '#fafafa' }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 13, color: '#555', marginBottom: 12 }}>
                Hi! I can help with appointments, doctors, services, and emergencies. Try a quick action below.
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '8px 10px',
                  borderRadius: 10,
                  background: m.role === 'user' ? '#1677ff' : (m.role === 'assistant' ? '#fff' : '#fffbe6'),
                  color: m.role === 'user' ? '#fff' : '#000',
                  border: m.role === 'assistant' ? '1px solid #eee' : '1px solid transparent'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ fontSize: 12, color: '#666' }}>Assistant is typing…</div>
            )}
            {/* Suggestions or booking form */}
            {mode === 'chat' ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {(suggestions.length ? suggestions : [
                  { label: 'Book Appointment', url: '/appointments/book' },
                  { label: 'Find Doctors', url: '/doctors' },
                  { label: 'Services', url: '/services' },
                  { label: 'Request Callback', url: '/request-callback' },
                  { label: 'Emergency 24/7', url: '/emergency' },
                ]).map((s, idx) => (
                  <button
                    key={(s.label || 's') + idx}
                    onClick={() => handleSuggestion(s)}
                    style={{
                      border: '1px solid #d9d9d9',
                      background: '#fff',
                      borderRadius: 999,
                      padding: '6px 10px',
                      fontSize: 12,
                      cursor: 'pointer'
                    }}
                  >{s.label}</button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8, background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>Quick Appointment</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    placeholder="Full Name"
                    value={bookForm.name}
                    onChange={e => setBookForm(f => ({ ...f, name: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #d9d9d9' }}
                  />
                  <input
                    placeholder="Phone Number"
                    value={bookForm.phone}
                    onChange={e => {
                      const v = e.target.value;
                      setBookForm(f => ({ ...f, phone: v }));
                      setPhoneValid(/^\+?[0-9]{7,15}$/.test(v.trim()) || v.trim() === '');
                    }}
                    style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${phoneValid ? '#d9d9d9' : '#ff4d4f'}` }}
                  />
                  {!phoneValid && (
                    <div style={{ color: '#ff4d4f', fontSize: 12 }}>Enter 7–15 digits (you may start with +).</div>
                  )}
                  <div>
                    <select
                      value={bookForm.department || ''}
                      onChange={e => setBookForm(f => ({ ...f, department: e.target.value || undefined }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff' }}
                    >
                      <option value="">Select Department (optional)</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    {depLoading && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Loading departments…</div>}
                  </div>
                  <div>
                    <select
                      value={bookForm.doctorId || ''}
                      onChange={e => setBookForm(f => ({ ...f, doctorId: e.target.value || undefined }))}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff' }}
                    >
                      <option value="">Select Doctor (optional)</option>
                      {(bookForm.department ? doctors.filter(d => (d.department?.name || '').toLowerCase() === (bookForm.department || '').toLowerCase()) : doctors).map(d => (
                        <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                    {docLoading && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Loading doctors…</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => setMode('chat')} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d9d9d9', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={submitAppointment} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#1677ff', color: '#fff', cursor: 'pointer' }}>{submitting ? 'Submitting…' : 'Submit'}</button>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: 10, display: 'flex', gap: 8, borderTop: '1px solid #f0f0f0' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask about services, doctors, appointments…"
              style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #d9d9d9' }}
            />
            <button onClick={send} disabled={loading} style={{ padding: '8px 12px', background: '#1677ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
