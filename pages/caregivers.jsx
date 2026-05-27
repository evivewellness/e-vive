import { useState } from 'react';
import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { BASE_CSS } from '../components/SharedStyles';

const PAGE_CSS = `
  body { padding-top: 72px; }

  .cg-hero {
    background: linear-gradient(135deg, var(--forest) 0%, #0d2b1e 60%, #0c1228 100%);
    padding: 80px 24px 60px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .cg-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 30% 50%, rgba(168,0,64,0.08) 0%, transparent 60%),
                radial-gradient(ellipse at 70% 30%, rgba(56,189,248,0.06) 0%, transparent 60%);
  }
  .cg-hero-inner { position: relative; max-width: 720px; margin: 0 auto; }
  .cg-hero-tag {
    display: inline-block;
    background: rgba(168,0,64,0.12);
    border: 1px solid rgba(168,0,64,0.3);
    color: var(--mint);
    padding: 6px 18px;
    border-radius: 999px;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  .cg-hero h1 { font-size: clamp(2rem,5vw,3.2rem); margin-bottom: 18px; color: #fff; }
  .cg-hero p { font-size: 1.1rem; color: var(--muted); max-width: 540px; margin: 0 auto 32px; line-height: 1.7; }
  .cg-hero-stats {
    display: flex; gap: 32px; justify-content: center; flex-wrap: wrap; margin-top: 40px;
  }
  .cg-hero-stat { text-align: center; }
  .cg-hero-stat .val { font-size: 2rem; font-weight: 700; color: var(--mint); }
  .cg-hero-stat .lab { font-size: 0.8rem; color: var(--muted); }

  /* Section layout */
  .cg-section { padding: 64px 24px; }
  .cg-section-alt { background: rgba(255,255,255,0.02); }
  .cg-inner { max-width: 1100px; margin: 0 auto; }
  .cg-section-head { text-align: center; margin-bottom: 48px; }
  .cg-section-head .tag {
    display: inline-block;
    font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--mint); margin-bottom: 12px;
  }
  .cg-section-head h2 { font-size: clamp(1.5rem,3vw,2.2rem); margin-bottom: 12px; }
  .cg-section-head p { color: var(--muted); max-width: 560px; margin: 0 auto; line-height: 1.7; }

  /* Training modules grid */
  .modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  .module-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px;
    padding: 24px;
    transition: border-color 0.2s, transform 0.2s;
    cursor: pointer;
  }
  .module-card:hover { border-color: rgba(168,0,64,0.35); transform: translateY(-3px); }
  .module-icon {
    width: 48px; height: 48px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.4rem; margin-bottom: 16px;
  }
  .icon-mint { background: rgba(168,0,64,0.12); }
  .icon-sky  { background: rgba(56,189,248,0.12); }
  .icon-gold { background: rgba(251,191,36,0.12); }
  .icon-coral{ background: rgba(251,113,133,0.12); }
  .icon-teal { background: rgba(45,212,191,0.12); }
  .module-card h3 { font-size: 1rem; margin-bottom: 8px; }
  .module-card p  { font-size: 0.85rem; color: var(--muted); line-height: 1.6; margin-bottom: 16px; }
  .module-meta {
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
    font-size: 0.75rem; color: var(--muted);
  }
  .module-meta span { display: flex; align-items: center; gap: 4px; }
  .module-actions { margin-top: 16px; display: flex; gap: 10px; }
  .mod-progress {
    height: 4px; background: rgba(255,255,255,0.08); border-radius: 999px;
    margin-top: 14px; overflow: hidden;
  }
  .mod-progress-bar { height: 100%; border-radius: 999px; background: var(--mint); }

  /* Community / Forum */
  .community-grid {
    display: grid; grid-template-columns: 1fr 340px; gap: 28px;
  }
  @media(max-width:768px){ .community-grid { grid-template-columns: 1fr; } }

  .forum-threads { display: flex; flex-direction: column; gap: 12px; }
  .thread-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 18px; cursor: pointer;
    transition: border-color 0.2s;
  }
  .thread-card:hover { border-color: rgba(168,0,64,0.3); }
  .thread-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .thread-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg,var(--jade),var(--teal));
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 0.8rem; color: #fff; flex-shrink: 0;
  }
  .thread-meta { flex: 1; }
  .thread-meta .author { font-size: 0.85rem; font-weight: 600; }
  .thread-meta .time   { font-size: 0.73rem; color: var(--muted); }
  .thread-card h4 { font-size: 0.95rem; margin-bottom: 6px; }
  .thread-card p  { font-size: 0.82rem; color: var(--muted); line-height: 1.5; margin-bottom: 10px; }
  .thread-footer  { display: flex; gap: 16px; font-size: 0.75rem; color: var(--muted); }
  .thread-footer span { display: flex; align-items: center; gap: 4px; }

  .forum-sidebar { display: flex; flex-direction: column; gap: 16px; }
  .sidebar-widget {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 20px;
  }
  .sidebar-widget h4 { font-size: 0.9rem; margin-bottom: 14px; color: var(--mint); }
  .widget-list { display: flex; flex-direction: column; gap: 10px; }
  .widget-item { display: flex; align-items: center; gap: 10px; }
  .widget-item .badge-count {
    background: rgba(168,0,64,0.15); color: var(--mint);
    border-radius: 999px; padding: 2px 10px; font-size: 0.72rem; font-weight: 700;
  }
  .widget-item .label { font-size: 0.83rem; flex: 1; }
  .new-post-btn {
    width: 100%; padding: 12px; border-radius: 10px;
    background: rgba(168,0,64,0.12); border: 1px solid rgba(168,0,64,0.3);
    color: var(--mint); font-size: 0.88rem; font-weight: 600; cursor: pointer;
    transition: background 0.2s;
  }
  .new-post-btn:hover { background: rgba(168,0,64,0.22); }

  /* Counselling */
  .counselling-grid {
    display: grid; grid-template-columns: repeat(auto-fill,minmax(280px,1fr)); gap: 20px;
  }
  .counsellor-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 16px; padding: 24px; text-align: center;
    transition: border-color 0.2s, transform 0.2s;
  }
  .counsellor-card:hover { border-color: rgba(56,189,248,0.35); transform: translateY(-3px); }
  .counsellor-avatar {
    width: 72px; height: 72px; border-radius: 50%; margin: 0 auto 14px;
    background: linear-gradient(135deg,var(--sky),var(--teal));
    display: flex; align-items: center; justify-content: center;
    font-size: 1.6rem; font-weight: 700; color: #fff;
  }
  .counsellor-card h3 { font-size: 1rem; margin-bottom: 4px; }
  .counsellor-card .role { font-size: 0.8rem; color: var(--sky); margin-bottom: 8px; }
  .counsellor-card p   { font-size: 0.82rem; color: var(--muted); line-height: 1.5; margin-bottom: 16px; }
  .avail-slots { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; margin-bottom: 16px; }
  .slot {
    padding: 4px 10px; border-radius: 6px; font-size: 0.72rem;
    background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.25);
    color: var(--sky);
  }
  .slot.full { opacity: 0.4; text-decoration: line-through; }

  /* Booking modal */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .modal-box {
    background: #0d2b1e; border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px; padding: 32px; max-width: 480px; width: 100%;
  }
  .modal-box h3 { font-size: 1.2rem; margin-bottom: 6px; }
  .modal-box p  { font-size: 0.85rem; color: var(--muted); margin-bottom: 24px; }
  .modal-close {
    float: right; background: none; border: none; color: var(--muted);
    font-size: 1.4rem; cursor: pointer; line-height: 1;
  }

  /* Resource library */
  .resources-grid {
    display: grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap: 16px;
  }
  .resource-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 20px;
    transition: border-color 0.2s;
  }
  .resource-card:hover { border-color: rgba(251,191,36,0.3); }
  .resource-type {
    font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 8px;
  }
  .resource-card h4 { font-size: 0.92rem; margin-bottom: 6px; }
  .resource-card p  { font-size: 0.8rem; color: var(--muted); line-height: 1.5; margin-bottom: 14px; }
  .resource-meta { font-size: 0.73rem; color: var(--muted); }

  /* Support groups */
  .groups-list { display: flex; flex-direction: column; gap: 16px; }
  .group-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 14px; padding: 22px;
    display: flex; align-items: center; gap: 20px;
    transition: border-color 0.2s;
  }
  .group-card:hover { border-color: rgba(45,212,191,0.3); }
  .group-icon {
    width: 56px; height: 56px; border-radius: 14px; flex-shrink: 0;
    background: rgba(45,212,191,0.12);
    display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  }
  .group-info { flex: 1; }
  .group-info h4 { font-size: 0.95rem; margin-bottom: 4px; }
  .group-info p  { font-size: 0.82rem; color: var(--muted); line-height: 1.5; }
  .group-meta   { display: flex; gap: 12px; margin-top: 8px; font-size: 0.75rem; color: var(--muted); flex-wrap: wrap; }
  .group-meta span { display: flex; align-items: center; gap: 4px; }
  .group-actions { display: flex; flex-direction: column; gap: 8px; }
  @media(max-width:600px){ .group-card { flex-direction: column; align-items: flex-start; } }

  /* CTA bottom */
  .cg-cta {
    background: linear-gradient(135deg,rgba(168,0,64,0.08),rgba(56,189,248,0.05));
    border: 1px solid rgba(168,0,64,0.2);
    border-radius: 20px; padding: 48px 32px; text-align: center; margin-top: 24px;
  }
  .cg-cta h2 { font-size: clamp(1.4rem,3vw,2rem); margin-bottom: 12px; }
  .cg-cta p  { color: var(--muted); max-width: 480px; margin: 0 auto 28px; }
  .cg-cta-btns { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
`;

const MODULES = [
  { id: 1, icon: '🩺', iconCls: 'icon-mint', title: 'Basic Home Nursing Skills', desc: 'Learn wound dressing, medication administration, and vital signs monitoring from certified nurses.', lessons: 12, duration: '4 hrs', level: 'Beginner', progress: 0 },
  { id: 2, icon: '🧠', iconCls: 'icon-sky',  title: 'Dementia & Memory Care', desc: 'Practical strategies for managing challenging behaviour, communication, and daily routines.', lessons: 8, duration: '3 hrs', level: 'Intermediate', progress: 45 },
  { id: 3, icon: '❤️', iconCls: 'icon-coral', title: 'Palliative & End-of-Life Care', desc: 'Compassionate guidance on pain management, emotional support, and family communication.', lessons: 10, duration: '3.5 hrs', level: 'Intermediate', progress: 80 },
  { id: 4, icon: '💊', iconCls: 'icon-gold', title: 'Medication Management', desc: 'Safe handling, scheduling, and record-keeping of medications for common chronic conditions.', lessons: 6, duration: '2 hrs', level: 'Beginner', progress: 100 },
  { id: 5, icon: '🧘', iconCls: 'icon-teal', title: 'Caregiver Self-Care & Burnout Prevention', desc: 'Recognise burnout signals, set boundaries, and build sustainable routines for your own wellbeing.', lessons: 7, duration: '2.5 hrs', level: 'All Levels', progress: 20 },
  { id: 6, icon: '🏃', iconCls: 'icon-mint', title: 'Mobility & Safe Transfers', desc: 'Safe lifting, transfer, and positioning techniques to prevent injury to both caregiver and patient.', lessons: 9, duration: '3 hrs', level: 'Beginner', progress: 0 },
];

const THREADS = [
  { id: 1, initials: 'WN', author: 'Wanjiku N.', time: '2 hours ago', title: 'Tips for convincing a stubborn parent to take medication?', preview: 'My 78-year-old father refuses his BP medication. I have tried everything from hiding it in food to gentle persuasion...', replies: 14, likes: 22 },
  { id: 2, initials: 'AO', author: 'Amina O.', time: '5 hours ago', title: 'Respite care — how do you cope when you need a break?', preview: 'I have been the sole caregiver for my mother for 14 months and I am exhausted. How do others handle needing time off?', replies: 31, likes: 47 },
  { id: 3, initials: 'KM', author: 'Kamau M.', time: '1 day ago', title: 'Managing incontinence with dignity — what works?', preview: 'Looking for practical product recommendations and routines that preserve my uncle\'s dignity...', replies: 9, likes: 15 },
  { id: 4, initials: 'FW', author: 'Faith W.', time: '2 days ago', title: 'How to explain a terminal diagnosis to young grandchildren?', preview: 'Our family is struggling to find age-appropriate language. Any experiences to share?', replies: 18, likes: 34 },
];

const COUNSELLORS = [
  { initials: 'SK', name: 'Dr. Sarah Kamau', role: 'Grief & Bereavement Counsellor', bio: 'Specialises in supporting families navigating chronic illness and loss. 12 years experience.', slots: ['Mon 9am', 'Wed 11am', 'Fri 2pm'] },
  { initials: 'JO', name: 'James Otieno', role: 'Family Therapist', bio: 'Works with family systems under caregiving stress. Offers both individual and family sessions.', slots: ['Tue 10am', 'Thu 3pm', 'Sat 10am'] },
  { initials: 'RM', name: 'Rose Mutua', role: 'Mental Health Counsellor', bio: 'Caregiver burnout, anxiety, and depression specialist. Swahili and English sessions available.', slots: ['Mon 2pm', 'Wed 4pm'] },
  { initials: 'PM', name: 'Peter Mwangi', role: 'Social Worker', bio: 'Helps families access community resources, navigate systems, and plan sustainable care arrangements.', slots: ['Tue 11am', 'Thu 11am', 'Fri 10am'] },
];

const RESOURCES = [
  { type: 'Guide', title: 'Caregiver\'s Complete Handbook', desc: 'Comprehensive PDF covering all aspects of home care for seniors.', meta: '48 pages · PDF' },
  { type: 'Video', title: 'Safe Patient Transfer Techniques', desc: 'Step-by-step video demonstration with a physiotherapist.', meta: '22 min · Video' },
  { type: 'Checklist', title: 'Daily Care Routine Template', desc: 'Printable checklist for morning, afternoon, and evening care tasks.', meta: '2 pages · PDF' },
  { type: 'Guide',    title: 'Managing Dementia Behaviour', desc: 'Evidence-based strategies for common dementia-related behaviours.', meta: '18 pages · PDF' },
  { type: 'Webinar',  title: 'Navigating the Healthcare System in Kenya', desc: 'Recording: how to access NHIF, referrals, and specialist care.', meta: '55 min · Video' },
  { type: 'Template', title: 'Medication & Appointment Tracker', desc: 'Spreadsheet template for tracking medications, dosages, and appointments.', meta: 'Excel · Template' },
  { type: 'Guide',    title: 'Grief Support for Family Members', desc: 'For families in palliative situations — processing anticipatory grief.', meta: '12 pages · PDF' },
  { type: 'Checklist','title': 'Home Safety Assessment Checklist', desc: 'Audit your home environment for fall and safety risks.', meta: '4 pages · PDF' },
];

const GROUPS = [
  { icon: '🧠', name: 'Dementia Caregivers Kenya', desc: 'A supportive community for families navigating dementia at home. Share challenges, celebrate small wins, and learn from each other.', meets: 'Every Saturday, 10:00 AM', platform: 'Zoom + WhatsApp', members: 142 },
  { icon: '🕊️', name: 'Palliative Care Family Circle', desc: 'For families walking alongside a loved one in palliative or end-of-life care. Grief, hope, and practical support.', meets: 'Every Wednesday, 6:00 PM', platform: 'Zoom', members: 89 },
  { icon: '♿', name: 'Mobility & Disability Caregivers', desc: 'Support group for families caring for loved ones with physical disabilities, stroke recovery, and mobility challenges.', meets: 'Every Tuesday, 5:30 PM', platform: 'WhatsApp + Zoom', members: 63 },
  { icon: '👶', name: 'Childhood Illness & Disability Parents', desc: 'A caring space for parents managing complex childhood health conditions, palsy, developmental delays, and chronic illness.', meets: 'Every Thursday, 4:00 PM', platform: 'WhatsApp', members: 110 },
];

export default function CaregiversPage() {
  const [activeTab, setActiveTab] = useState('training');
  const [bookingModal, setBookingModal] = useState(null);
  const [bookForm, setBookForm] = useState({ name: '', phone: '', date: '', slot: '' });
  const [bookingDone, setBookingDone] = useState(false);

  const tabs = [
    { id: 'training',    label: 'Training Modules' },
    { id: 'community',  label: 'Community' },
    { id: 'counselling',label: 'Counselling' },
    { id: 'resources',  label: 'Resource Library' },
    { id: 'groups',     label: 'Support Groups' },
  ];

  function handleBook(c) { setBookingModal(c); setBookingDone(false); setBookForm({ name:'',phone:'',date:'',slot:'' }); }
  function submitBooking(e) { e.preventDefault(); setBookingDone(true); }

  return (
    <>
      <style>{BASE_CSS + PAGE_CSS}</style>
      <Nav />

      {/* Hero */}
      <section className="cg-hero">
        <div className="cg-hero-inner">
          <div className="cg-hero-tag">Family Caregiver Hub</div>
          <h1>You Are Not Alone in This</h1>
          <p>Training, community, professional counselling, and resources designed specifically for family members who care for a loved one at home.</p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-p" onClick={() => setActiveTab('training')}>Explore Training →</button>
            <button className="btn-o" onClick={() => setActiveTab('counselling')}>Book Counselling</button>
          </div>
          <div className="cg-hero-stats">
            <div className="cg-hero-stat"><div className="val">3,200+</div><div className="lab">Family caregivers supported</div></div>
            <div className="cg-hero-stat"><div className="val">18</div><div className="lab">Training modules</div></div>
            <div className="cg-hero-stat"><div className="val">4</div><div className="lab">Active support groups</div></div>
            <div className="cg-hero-stat"><div className="val">Free</div><div className="lab">Core resources</div></div>
          </div>
        </div>
      </section>

      {/* Tab navigation */}
      <div style={{ borderBottom:'1px solid rgba(255,255,255,0.08)', background:'rgba(0,0,0,0.25)', position:'sticky', top:72, zIndex:80 }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex', overflowX:'auto', gap:4, padding:'0 20px' }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding:'16px 22px', background:'none', border:'none', cursor:'pointer',
                fontSize:'0.88rem', fontWeight: activeTab===t.id ? 700 : 400,
                color: activeTab===t.id ? 'var(--mint)' : 'var(--muted)',
                borderBottom: activeTab===t.id ? '2px solid var(--mint)' : '2px solid transparent',
                whiteSpace:'nowrap', transition:'color 0.2s',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Training Modules */}
      {activeTab==='training' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Self-Paced Learning</div>
              <h2>Caregiver Training Modules</h2>
              <p>Developed with nurses and doctors, these modules give you practical skills to care for your loved one with confidence.</p>
            </div>
            <div className="modules-grid">
              {MODULES.map(m => (
                <div className="module-card" key={m.id}>
                  <div className={`module-icon ${m.iconCls}`}>{m.icon}</div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                  <div className="module-meta">
                    <span>📚 {m.lessons} lessons</span>
                    <span>⏱ {m.duration}</span>
                    <span style={{ marginLeft:'auto', color: m.level==='Beginner'?'var(--mint)':m.level==='Intermediate'?'var(--gold)':'var(--sky)' }}>{m.level}</span>
                  </div>
                  {m.progress > 0 && (
                    <div className="mod-progress">
                      <div className="mod-progress-bar" style={{ width:`${m.progress}%` }} />
                    </div>
                  )}
                  {m.progress > 0 && (
                    <div style={{ fontSize:'0.72rem', color:'var(--muted)', marginTop:6 }}>{m.progress}% complete</div>
                  )}
                  <div className="module-actions">
                    <button className="btn-p btn-sm" style={{ flex:1 }}>
                      {m.progress===0 ? 'Start Module' : m.progress===100 ? 'Review' : 'Continue'}
                    </button>
                    {m.progress===100 && <span className="badge-mint" style={{ padding:'4px 10px', alignSelf:'center' }}>✓ Done</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Community Forum */}
      {activeTab==='community' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Peer Support</div>
              <h2>Community Forum</h2>
              <p>Real conversations with real caregivers. Ask questions, share experiences, and know you are not walking this road alone.</p>
            </div>
            <div className="community-grid">
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontSize:'0.85rem', color:'var(--muted)' }}>Showing 4 of 312 discussions</div>
                  <button className="new-post-btn" style={{ width:'auto', padding:'10px 20px' }}>+ New Post</button>
                </div>
                <div className="forum-threads">
                  {THREADS.map(t => (
                    <div className="thread-card" key={t.id}>
                      <div className="thread-top">
                        <div className="thread-avatar">{t.initials}</div>
                        <div className="thread-meta">
                          <div className="author">{t.author}</div>
                          <div className="time">{t.time}</div>
                        </div>
                      </div>
                      <h4>{t.title}</h4>
                      <p>{t.preview}</p>
                      <div className="thread-footer">
                        <span>💬 {t.replies} replies</span>
                        <span>❤️ {t.likes} likes</span>
                        <span style={{ marginLeft:'auto', color:'var(--mint)', cursor:'pointer' }}>Read more →</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="btn-o btn-full" style={{ marginTop:20 }}>Load More Discussions</button>
              </div>
              <div className="forum-sidebar">
                <button className="new-post-btn">+ Start a New Discussion</button>
                <div className="sidebar-widget">
                  <h4>Popular Topics</h4>
                  <div className="widget-list">
                    {[['Dementia Care',47],['Medication',31],['Burnout',28],['End-of-Life',19],['Mobility',16],['Nutrition',12]].map(([t,n]) => (
                      <div className="widget-item" key={t}>
                        <div className="badge-count">{n}</div>
                        <div className="label">{t}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="sidebar-widget">
                  <h4>Community Guidelines</h4>
                  <p style={{ fontSize:'0.8rem', color:'var(--muted)', lineHeight:1.6 }}>This is a safe, moderated space. Be kind, protect privacy, and seek professional advice for medical decisions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Counselling */}
      {activeTab==='counselling' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Professional Support</div>
              <h2>Book a Counselling Session</h2>
              <p>Speak confidentially with trained mental health professionals who understand the unique challenges of caregiving.</p>
            </div>
            <div className="counselling-grid">
              {COUNSELLORS.map(c => (
                <div className="counsellor-card" key={c.name}>
                  <div className="counsellor-avatar">{c.initials}</div>
                  <h3>{c.name}</h3>
                  <div className="role">{c.role}</div>
                  <p>{c.bio}</p>
                  <div className="avail-slots">
                    {c.slots.map(s => <div className="slot" key={s}>{s}</div>)}
                  </div>
                  <button className="btn-sky btn-full" onClick={() => handleBook(c)}>Book Session</button>
                </div>
              ))}
            </div>
            <div style={{ marginTop:32, padding:24, background:'rgba(56,189,248,0.06)', border:'1px solid rgba(56,189,248,0.15)', borderRadius:14, textAlign:'center' }}>
              <p style={{ color:'var(--muted)', fontSize:'0.88rem' }}>Sessions are confidential and conducted via video call or phone. First session is free for new members.</p>
            </div>
          </div>
        </section>
      )}

      {/* Resource Library */}
      {activeTab==='resources' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Free Downloads</div>
              <h2>Resource Library</h2>
              <p>Practical guides, templates, videos, and checklists curated by our clinical team for family caregivers.</p>
            </div>
            <div className="resources-grid">
              {RESOURCES.map(r => (
                <div className="resource-card" key={r.title}>
                  <div className="resource-type">{r.type}</div>
                  <h4>{r.title}</h4>
                  <p>{r.desc}</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div className="resource-meta">{r.meta}</div>
                    <button className="btn-o btn-sm" style={{ fontSize:'0.75rem', padding:'6px 12px' }}>Download</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Support Groups */}
      {activeTab==='groups' && (
        <section className="cg-section">
          <div className="cg-inner">
            <div className="cg-section-head">
              <div className="tag">Regular Meetings</div>
              <h2>Virtual Support Groups</h2>
              <p>Join a facilitated support group matched to your caregiving situation. Moderated by trained counsellors.</p>
            </div>
            <div className="groups-list">
              {GROUPS.map(g => (
                <div className="group-card" key={g.name}>
                  <div className="group-icon">{g.icon}</div>
                  <div className="group-info">
                    <h4>{g.name}</h4>
                    <p>{g.desc}</p>
                    <div className="group-meta">
                      <span>📅 {g.meets}</span>
                      <span>📱 {g.platform}</span>
                      <span>👥 {g.members} members</span>
                    </div>
                  </div>
                  <div className="group-actions">
                    <button className="btn-p btn-sm">Join Group</button>
                    <button className="btn-o btn-sm">Learn More</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cg-section">
        <div className="cg-inner">
          <div className="cg-cta">
            <h2>Need a Professional HomeCare Assistant?</h2>
            <p>When caregiving becomes too much for one person, our vetted HCAs provide skilled, compassionate support at home.</p>
            <div className="cg-cta-btns">
              <Link href="/match" className="btn-p">Find a Carer →</Link>
              <Link href="/client/register" className="btn-o">Create Client Account</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Booking modal */}
      {bookingModal && (
        <div className="modal-overlay" onClick={() => setBookingModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            {!bookingDone ? (
              <>
                <button className="modal-close" onClick={() => setBookingModal(null)}>×</button>
                <h3>Book with {bookingModal.name}</h3>
                <p>{bookingModal.role}</p>
                <form onSubmit={submitBooking} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Your Name</label>
                    <input className="input" value={bookForm.name} onChange={e => setBookForm(p=>({...p,name:e.target.value}))} required placeholder="Full name" />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Phone Number</label>
                    <input className="input" value={bookForm.phone} onChange={e => setBookForm(p=>({...p,phone:e.target.value}))} required placeholder="+254 7XX XXX XXX" />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'var(--muted)', display:'block', marginBottom:6 }}>Preferred Session</label>
                    <select className="input" value={bookForm.slot} onChange={e => setBookForm(p=>({...p,slot:e.target.value}))} required>
                      <option value="">Select a slot</option>
                      {bookingModal.slots.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="btn-sky btn-full" style={{ marginTop:8 }}>Confirm Booking</button>
                </form>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'20px 0' }}>
                <div style={{ fontSize:'3rem', marginBottom:16 }}>✅</div>
                <h3 style={{ marginBottom:8 }}>Booking Confirmed</h3>
                <p>Your session with {bookingModal.name} has been requested. You will receive an SMS confirmation shortly.</p>
                <button className="btn-p" style={{ marginTop:20 }} onClick={() => setBookingModal(null)}>Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
