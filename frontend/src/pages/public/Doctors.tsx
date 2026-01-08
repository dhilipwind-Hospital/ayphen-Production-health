import React, { useEffect, useState } from 'react';
import { List, Avatar, Card, Typography, Spin, Alert, Button, Tag, Space, Input, Skeleton, Select, Pagination, Switch } from 'antd';
import styled, { keyframes } from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';
import {
  HeartOutlined,
  SkinOutlined,
  EyeOutlined,
  SolutionOutlined,
  SmileOutlined,
  DeploymentUnitOutlined,
  AlertOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  WomanOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

// Page-level reveal wrapper (module scope to avoid dynamic styled warnings)
const Page = styled.div`
  [data-reveal] { opacity: 0; transform: translateY(12px); transition: opacity .6s ease, transform .6s ease; }
  [data-reveal].is-visible { opacity: 1; transform: none; }
  /* Stagger list items a bit */
  [data-reveal].is-visible .ant-list-item:nth-child(2) { transition-delay: .05s; }
  [data-reveal].is-visible .ant-list-item:nth-child(3) { transition-delay: .1s; }
  [data-reveal].is-visible .ant-list-item:nth-child(4) { transition-delay: .15s; }
`;

const GlowCard = styled(Card)`
  position: relative;
  height: 100%;
  min-height: 360px;
  max-height: 360px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white !important;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  
  /* Clean edges and corners */
  -webkit-border-radius: 12px;
  -moz-border-radius: 12px;
  -webkit-background-clip: padding-box;
  -moz-background-clip: padding;
  background-clip: padding-box;
  
  /* Force white background on all states */
  &, 
  &:hover,
  &:focus,
  &:active {
    background: white !important;
    background-color: white !important;
  }
  
  /* Ensure white background always on card body */
  .ant-card-body {
    position: relative;
    z-index: 1;
    padding: 18px;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white !important;
    background-color: white !important;
    border-radius: 12px;
  }
  
  /* Override any Ant Design hover styles */
  &.ant-card:hover {
    background: white !important;
    background-color: white !important;
  }
  
  /* Clean border and smooth transitions */
  border-color: #e5e7eb;
  transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  
  &:hover {
    /* ONLY change border color and add subtle effects */
    border: 2px solid #ec407a;
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(236, 64, 122, 0.08), 
                0 2px 4px rgba(0, 0, 0, 0.06);
    
    /* Ensure background stays white */
    background: white !important;
    background-color: white !important;
    
    .ant-card-body {
      background: white !important;
      background-color: white !important;
      padding: 17px; /* Adjust for thicker border */
    }
    
    /* Subtle button enhancements */
    .ant-btn-primary {
      background: #ec407a !important;
      border-color: #ec407a !important;
      
      &:hover {
        background: #d81b60 !important;
      }
    }
    
    .ant-btn:not(.ant-btn-primary) {
      border-color: #ec407a !important;
      color: #ec407a !important;
      
      &:hover {
        background: rgba(236, 64, 122, 0.04) !important;
      }
    }
  }
`;

// Subtle bubbles behind the doctors list
const listBubbleUp = keyframes`
  0% { transform: translateY(0) translateX(0); opacity: .45; }
  50% { transform: translateY(-40px) translateX(6px); opacity: .9; }
  100% { transform: translateY(-90px) translateX(-6px); opacity: .15; }
`;
const ListWrap = styled.div`
  position: relative;
  .bubbles { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
  .bubbles span {
    position: absolute; width: 10px; height: 10px; border-radius: 9999px;
    background: rgba(19,194,194,0.10); filter: blur(0.2px);
    animation: ${listBubbleUp} 12s ease-in-out infinite;
  }
  .bubbles span:nth-child(1) { left: 8%; bottom: -10px; animation-duration: 13s; animation-delay: 0s; }
  .bubbles span:nth-child(2) { left: 22%; bottom: -12px; width: 8px; height: 8px; animation-duration: 14s; animation-delay: .5s; }
  .bubbles span:nth-child(3) { left: 38%; bottom: -14px; width: 12px; height: 12px; animation-duration: 11s; animation-delay: .8s; }
  .bubbles span:nth-child(4) { left: 58%; bottom: -18px; width: 9px; height: 9px; animation-duration: 13s; animation-delay: .3s; }
  .bubbles span:nth-child(5) { left: 74%; bottom: -10px; width: 7px; height: 7px; animation-duration: 12s; animation-delay: 1.1s; }
  .bubbles span:nth-child(6) { left: 90%; bottom: -14px; width: 11px; height: 11px; animation-duration: 15s; animation-delay: .6s; }
  @media (prefers-reduced-motion: reduce) {
    .bubbles span { animation: none !important; }
  }
`;

// Animations and hero styling
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const Hero = styled.section`
  position: relative;
  background: radial-gradient(1200px 600px at 10% -10%, rgba(14,165,233,0.18), transparent),
              radial-gradient(1000px 500px at 90% 0%, rgba(34,197,94,0.15), transparent),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  overflow: hidden;
  padding: 24px;
  margin-bottom: 0;

  .hero-inner { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; align-items: center; }
  .copy { padding: 4px; }
  .art { position: relative; height: 100px; }
  .art span { position: absolute; font-size: 24px; opacity: 0.95; }
  .art .heart { left: 8px; top: 20px; color: #ef4444; animation: ${pulse} 2s ease-in-out infinite; }
  .art .pill { left: 60px; top: 10px; color: #06b6d4; animation: ${float} 3.2s ease-in-out infinite; }
  .art .ortho { left: 110px; top: 40px; color: #0ea5e9; animation: ${float} 2.6s ease-in-out infinite; }
  .art .kids { left: 160px; top: 15px; color: #22c55e; animation: ${float} 3.6s ease-in-out infinite; }

  /* Bubbles animation */
  @keyframes bubbleUp {
    0% { transform: translateY(0) translateX(0); opacity: .5; }
    50% { transform: translateY(-50px) translateX(6px); opacity: .9; }
    100% { transform: translateY(-100px) translateX(-6px); opacity: .15; }
  }
  .bubbles { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
  .bubbles span {
    position: absolute; width: 10px; height: 10px; border-radius: 9999px;
    background: rgba(19,194,194,0.12); filter: blur(0.2px);
    animation: bubbleUp 12s ease-in-out infinite;
  }
  .bubbles span:nth-child(1) { left: 10%; bottom: -10px; animation-duration: 13s; animation-delay: 0s; }
  .bubbles span:nth-child(2) { left: 25%; bottom: -16px; width: 8px; height: 8px; animation-duration: 14s; animation-delay: .6s; }
  .bubbles span:nth-child(3) { left: 40%; bottom: -12px; width: 12px; height: 12px; animation-duration: 11s; animation-delay: .3s; }
  .bubbles span:nth-child(4) { left: 60%; bottom: -18px; width: 9px; height: 9px; animation-duration: 13s; animation-delay: .9s; }
  .bubbles span:nth-child(5) { left: 75%; bottom: -10px; width: 7px; height: 7px; animation-duration: 12s; animation-delay: 1.2s; }
  .bubbles span:nth-child(6) { left: 88%; bottom: -14px; width: 11px; height: 11px; animation-duration: 15s; animation-delay: .3s; }

  @media (prefers-reduced-motion: reduce) {
    .art span { animation: none !important; }
    .bubbles span { animation: none !important; }
  }
`;

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  specialization?: string;
  departmentName?: string;
  qualification?: string;
  role?: string; // Chief Doctor | Senior Doctor | Practitioner | Consultant
  experienceYears?: number;
}

const getSpecColor = (spec?: string): string => {
  const s = (spec || '').toLowerCase();
  if (s.includes('cardio')) return '#ef4444';
  if (s.includes('ortho')) return '#0ea5e9';
  if (s.includes('pedia')) return '#22c55e';
  if (s.includes('derma')) return '#a855f7';
  if (s.includes('ophthal')) return '#06b6d4';
  if (s.includes('neuro')) return '#f59e0b';
  if (s.includes('ent')) return '#10b981';
  if (s.includes('gastro')) return '#ec4899';
  if (s.includes('gyn')) return '#db2777';
  if (s.includes('uro')) return '#0ea5e9';
  if (s.includes('onco')) return '#9333ea';
  if (s.includes('radiol')) return '#8b5cf6';
  if (s.includes('psy') || s.includes('mental')) return '#6366f1';
  if (s.includes('dent')) return '#14b8a6';
  if (s.includes('pulmo') || s.includes('lung')) return '#fb923c';
  if (s.includes('nephro') || s.includes('kidney')) return '#84cc16';
  if (s.includes('endocr') || s.includes('diabet')) return '#f97316';
  if (s.includes('rheuma')) return '#f43f5e';
  if (s.includes('hemo')) return '#f43f5e';
  if (s.includes('family') || s.includes('general') || s.includes('physician')) return '#64748b';
  return '#2563eb';
};

const getSpecIcon = (spec?: string, color?: string) => {
  const s = (spec || '').toLowerCase();
  const style = { color: color || getSpecColor(spec) } as React.CSSProperties;
  if (s.includes('cardio')) return <HeartOutlined style={style} />;
  if (s.includes('derma')) return <SkinOutlined style={style} />;
  if (s.includes('ophthal')) return <EyeOutlined style={style} />;
  if (s.includes('ortho')) return <SolutionOutlined style={style} />;
  if (s.includes('pedia')) return <SmileOutlined style={style} />;
  if (s.includes('neuro')) return <DeploymentUnitOutlined style={style} />;
  if (s.includes('ent')) return <AlertOutlined style={style} />;
  if (s.includes('gastro')) return <MedicineBoxOutlined style={style} />;
  if (s.includes('gyn')) return <WomanOutlined style={style} />;
  if (s.includes('uro')) return <MedicineBoxOutlined style={style} />;
  if (s.includes('onco')) return <ExperimentOutlined style={style} />;
  if (s.includes('radiol')) return <ExperimentOutlined style={style} />;
  if (s.includes('psy') || s.includes('mental')) return <SmileOutlined style={style} />;
  if (s.includes('dent')) return <MedicineBoxOutlined style={style} />;
  if (s.includes('pulmo') || s.includes('lung')) return <AlertOutlined style={style} />;
  if (s.includes('nephro') || s.includes('kidney')) return <MedicineBoxOutlined style={style} />;
  if (s.includes('endocr') || s.includes('diabet')) return <MedicineBoxOutlined style={style} />;
  if (s.includes('rheuma')) return <SolutionOutlined style={style} />;
  if (s.includes('hemo')) return <ExperimentOutlined style={style} />;
  if (s.includes('family') || s.includes('general') || s.includes('physician')) return <MedicineBoxOutlined style={style} />;
  return <UserOutlined style={style} />;
};

// Unique name pool for fallback generation
const FIRST_NAMES = [
  'Aarav','Aisha','Kabir','Meera','Rohan','Ishita','Vihaan','Anaya','Arjun','Diya',
  'Advait','Isha','Kunal','Riya','Siddharth','Nisha','Manav','Pooja','Varun','Sneha',
  'Rahul','Priya','Naveen','Kavya','Rohit','Neha','Anil','Lakshmi','Sanjay','Divya'
];
const LAST_NAMES = [
  'Sharma','Iyer','Verma','Kapoor','Mehta','Nair','Gupta','Menon','Bhatia','Kulkarni',
  'Chandra','Desai','Reddy','Ghosh','Jain','Khan','Mishra','Joshi','Malhotra','Agarwal',
  'Sinha','Bose','Saxena','Kaur','Pillai','Rao','Srivastava','Pathak','Tiwari','Yadav'
];
const usedCombos = new Set<string>();
let fi = 0; let li = 0;
const nextName = () => {
  // Try up to FIRST_NAMES.length * LAST_NAMES.length combinations
  for (let tries = 0; tries < FIRST_NAMES.length * LAST_NAMES.length; tries++) {
    const first = FIRST_NAMES[fi % FIRST_NAMES.length];
    const last = LAST_NAMES[li % LAST_NAMES.length];
    fi++; if (fi % FIRST_NAMES.length === 0) li++;
    const key = `${first}_${last}`;
    if (!usedCombos.has(key)) { usedCombos.add(key); return { firstName: first, lastName: last }; }
  }
  // Fallback (shouldn't happen): return a numeric suffix
  const n = usedCombos.size + 1;
  return { firstName: `Doctor${n}`, lastName: 'Demo' };
};

// Helper to generate 5 sample doctors per department with roles and qualifications
const generateDept = (deptKey: string, departmentName: string, specialization: string): Doctor[] => {
  const base = deptKey.toLowerCase();
  const n1 = nextName();
  const n2 = nextName();
  const n3 = nextName();
  const n4 = nextName();
  const n5 = nextName();
  return [
    {
      id: `${base}-chief-1`, firstName: n1.firstName, lastName: n1.lastName,
      specialization, departmentName, email: `${base}.chief@example.com`,
      qualification: 'MD, FRCS', role: 'Chief Doctor', experienceYears: 18,
    },
    {
      id: `${base}-senior-1`, firstName: n2.firstName, lastName: n2.lastName,
      specialization, departmentName, email: `${base}.senior@example.com`,
      qualification: 'MD (Gold Medalist)', role: 'Senior Doctor', experienceYears: 12,
    },
    {
      id: `${base}-pract-1`, firstName: n3.firstName, lastName: n3.lastName,
      specialization, departmentName, email: `${base}.practitioner@example.com`,
      qualification: 'MBBS, DNB', role: 'Practitioner', experienceYears: 6,
    },
    {
      id: `${base}-consult-1`, firstName: n4.firstName, lastName: n4.lastName,
      specialization, departmentName, email: `${base}.consult1@example.com`,
      qualification: 'MD, Fellowship', role: 'Consultant', experienceYears: 8,
    },
    {
      id: `${base}-consult-2`, firstName: n5.firstName, lastName: n5.lastName,
      specialization, departmentName, email: `${base}.consult2@example.com`,
      qualification: 'MS', role: 'Consultant', experienceYears: 7,
    },
  ];
};

const fallbackDoctors: Doctor[] = [
  ...generateDept('cardio', 'Cardiology', 'Cardiologist'),
  ...generateDept('ortho', 'Orthopedics', 'Orthopedic Surgeon'),
  ...generateDept('pedia', 'Pediatrics', 'Pediatrician'),
  ...generateDept('derma', 'Dermatology', 'Dermatologist'),
  ...generateDept('ophthal', 'Ophthalmology', 'Ophthalmologist'),
  ...generateDept('neuro', 'Neurology', 'Neurologist'),
  ...generateDept('ent', 'ENT', 'ENT Specialist'),
  ...generateDept('gastro', 'Gastroenterology', 'Gastroenterologist'),
  ...generateDept('gyn', 'Gynecology', 'Gynecologist'),
  ...generateDept('uro', 'Urology', 'Urologist'),
  ...generateDept('onco', 'Oncology', 'Oncologist'),
];

// Map department display name to a suitable specialization label
const mapDepartmentToSpec = (dept: string): string => {
  const d = dept.toLowerCase();
  if (d.includes('cardio')) return 'Cardiologist';
  if (d.includes('ortho')) return 'Orthopedic Surgeon';
  if (d.includes('pedia') || d.includes('child')) return 'Pediatrician';
  if (d.includes('derma') || d.includes('skin')) return 'Dermatologist';
  if (d.includes('ophthal') || d.includes('eye')) return 'Ophthalmologist';
  if (d.includes('neuro')) return 'Neurologist';
  if (d.includes('ent')) return 'ENT Specialist';
  if (d.includes('gastro')) return 'Gastroenterologist';
  if (d.includes('gyn') || d.includes('obst')) return 'Gynecologist';
  if (d.includes('uro')) return 'Urologist';
  if (d.includes('onco')) return 'Oncologist';
  if (d.includes('radio')) return 'Radiologist';
  if (d.includes('psy') || d.includes('mental')) return 'Psychiatrist';
  if (d.includes('dental')) return 'Dentist';
  return 'Consultant Physician';
};

const slugify = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const Doctors: React.FC = () => {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const deptFilter = (params.get('dept') || '').trim();
  const [query, setQuery] = useState('');
  const [generatedDept, setGeneratedDept] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<'none'|'name_asc'|'name_desc'|'dept_asc'>('none');
  const paramInclude = (params.get('includeDemo') || '1').toLowerCase();
  const initialInclude = paramInclude === '1' || paramInclude === 'true' || paramInclude === 'yes';
  const [includeDemo, setIncludeDemo] = useState<boolean>(initialInclude);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all pages to ensure full doctor list
        const pageSize = 50;
        let page = 1;
        let rows: Doctor[] = [];
        for (let i = 0; i < 20; i++) {
          const res = await api.get('/public/doctors', { params: { page, limit: pageSize }, suppressErrorToast: true } as any);
          const chunk: Doctor[] = res.data?.data || [];
          rows = rows.concat(chunk);
          if (chunk.length < pageSize) break;
          page++;
        }
        // Always use fallback doctors for complete data (qualifications, experience, etc.)
        let source: Doctor[] = includeDemo ? fallbackDoctors : (rows.length ? rows : []);
        if (includeDemo && !deptFilter && rows.length > 0 && rows.length < 5) {
          const used = new Set<string>(rows.map(r => r.id));
          // Build department buckets from fallback
          const buckets = new Map<string, Doctor[]>();
          for (const d of fallbackDoctors) {
            if (used.has(d.id)) continue;
            const k = d.departmentName || 'Other';
            if (!buckets.has(k)) buckets.set(k, []);
            buckets.get(k)!.push(d);
          }
          const deptKeys = Array.from(buckets.keys());
          const need = 5 - rows.length;
          const extra: Doctor[] = [];
          let idx = 0;
          while (extra.length < need && deptKeys.length) {
            const k = deptKeys[idx % deptKeys.length];
            const arr = buckets.get(k)!;
            const pick = arr.shift();
            if (pick) extra.push(pick);
            // remove empty buckets
            if (arr.length === 0) {
              buckets.delete(k);
              const pos = deptKeys.indexOf(k);
              if (pos >= 0) deptKeys.splice(pos, 1);
              idx = 0;
              continue;
            }
            idx++;
          }
          source = [...rows, ...extra];
        }
        if (deptFilter) {
          const lower = deptFilter.toLowerCase();
          const filtered = source.filter(d => (d.departmentName || '').toLowerCase().includes(lower));
          if (filtered.length > 0) {
            setData(filtered);
            setGeneratedDept(null);
          } else {
            if (includeDemo) {
              const deptName = deptFilter;
              const spec = mapDepartmentToSpec(deptName);
              const generated = generateDept(slugify(deptName), deptName, spec);
              setData(generated);
              setGeneratedDept(deptName);
            } else {
              setData([]);
              setGeneratedDept(null);
            }
          }
        } else {
          setData(source);
          setGeneratedDept(null);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load doctors');
        // On error, generate department-specific demo doctors if filter has no matches
        if (deptFilter) {
          const lower = deptFilter.toLowerCase();
          if (includeDemo) {
            const filtered = fallbackDoctors.filter(d => (d.departmentName || '').toLowerCase().includes(lower));
            if (filtered.length > 0) {
              setData(filtered);
              setGeneratedDept(null);
            } else {
              const deptName = deptFilter;
              const spec = mapDepartmentToSpec(deptName);
              const generated = generateDept(slugify(deptName), deptName, spec);
              setData(generated);
              setGeneratedDept(deptName);
            }
          } else {
            setData([]);
            setGeneratedDept(null);
          }
        } else {
          setData(includeDemo ? fallbackDoctors : []);
          setGeneratedDept(null);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [deptFilter, includeDemo]);

  // Reveal-on-scroll for this page
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) (e.target as HTMLElement).classList.add('is-visible'); });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    nodes.forEach((n) => {
      // If already in viewport on load, mark visible immediately
      const r = n.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) n.classList.add('is-visible');
      io.observe(n);
    });
    return () => io.disconnect();
  }, []);

  // Reset pagination when filters or toggles change
  useEffect(() => { setPage(1); }, [deptFilter, query, sortMode, includeDemo]);

  // Persist includeDemo in URL when toggled
  useEffect(() => {
    const p = new URLSearchParams();
    if (deptFilter) p.set('dept', deptFilter);
    p.set('includeDemo', includeDemo ? '1' : '0');
    navigate(`/doctors${p.toString() ? `?${p.toString()}` : ''}`, { replace: true });
  }, [includeDemo]);

  if (loading) return <Spin />;
  // If error occurred, we already populated fallbacks; do not block the page with an error.

  const filtered = data.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const full = `${d.firstName || ''} ${d.lastName || ''}`.toLowerCase();
    return (
      full.includes(q) ||
      (d.specialization || '').toLowerCase().includes(q) ||
      (d.departmentName || '').toLowerCase().includes(q) ||
      (d.qualification || '').toLowerCase().includes(q) ||
      (d.role || '').toLowerCase().includes(q)
    );
  });

  // Interleave by department to avoid clustering one department at the top
  const interleaveByDepartment = (rows: Doctor[]): Doctor[] => {
    const byDept = new Map<string, Doctor[]>();
    for (const d of rows) {
      const k = (d.departmentName || 'Other');
      if (!byDept.has(k)) byDept.set(k, []);
      byDept.get(k)!.push(d);
    }
    const keys = Array.from(byDept.keys());
    const out: Doctor[] = [];
    let i = 0; let remaining = true;
    while (remaining) {
      remaining = false;
      for (const k of keys) {
        const arr = byDept.get(k)!;
        if (i < arr.length) { out.push(arr[i]); remaining = true; }
      }
      i++;
    }
    return out;
  };
  let displayRows = deptFilter ? filtered : interleaveByDepartment(filtered);
  // Apply sorting
  const nameKey = (d: Doctor) => `${(d.firstName||'').toLowerCase()} ${(d.lastName||'').toLowerCase()}`.trim();
  if (sortMode === 'name_asc') displayRows = [...displayRows].sort((a,b)=> nameKey(a).localeCompare(nameKey(b)));
  if (sortMode === 'name_desc') displayRows = [...displayRows].sort((a,b)=> nameKey(b).localeCompare(nameKey(a)));
  if (sortMode === 'dept_asc') displayRows = [...displayRows].sort((a,b)=> (a.departmentName||'').localeCompare(b.departmentName||''));

  // Build department chips (mix from data and fallbacks for a broad set)
  const deptSet = new Set<string>();
  [...data, ...fallbackDoctors].forEach(d => { if (d.departmentName) deptSet.add(d.departmentName); });
  const deptChips = Array.from(deptSet).sort().slice(0, 10);
  const { CheckableTag } = Tag as any;
  const pagedRows = displayRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Page style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 24px' }}>
      <Hero>
        <div className="hero-inner">
          <div className="copy">
            <div style={{ display: 'inline-block', padding: '6px 16px', background: 'rgba(236, 64, 122, 0.1)', borderRadius: '20px', marginBottom: '12px' }}>
              <Text style={{ color: '#ec407a', fontWeight: 600, fontSize: '14px' }}>🩺 Expert Medical Care</Text>
            </div>
            <Title level={1} style={{ margin: '8px 0', fontSize: '42px', fontWeight: 700, lineHeight: 1.2 }}>Meet Our Specialists</Title>
            <Typography.Paragraph style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '16px', maxWidth: '600px' }}>
              Experienced physicians across every major specialty — here to provide comprehensive, compassionate care.
            </Typography.Paragraph>
          </div>
          <div className="art">
            <span className="heart"><HeartOutlined /></span>
            <span className="pill"><MedicineBoxOutlined /></span>
            <span className="ortho"><SolutionOutlined /></span>
            <span className="kids"><SmileOutlined /></span>
          </div>
          <div className="bubbles">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </Hero>
      <div data-reveal style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        gap: 16, 
        marginBottom: 16,
        marginTop: 0,
        padding: '12px 16px',
        background: '#f8fafc',
        borderRadius: '0px',
        border: '1px solid #e2e8f0',
        borderTop: 'none'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <CheckableTag
            checked={!deptFilter}
            onChange={() => navigate(`/doctors?includeDemo=${includeDemo ? '1' : '0'}`)}
          >All</CheckableTag>
          {deptChips.map((name) => (
            <CheckableTag
              key={name}
              checked={deptFilter.toLowerCase() === name.toLowerCase()}
              onChange={() => navigate(`/doctors?dept=${encodeURIComponent(name)}&includeDemo=${includeDemo ? '1' : '0'}`)}
            >{name}</CheckableTag>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <Typography.Text style={{ marginRight: 8 }}>Include demo doctors</Typography.Text>
            <Switch size="small" checked={includeDemo} onChange={setIncludeDemo} />
          </div>
          <Select
            size="small"
            value={sortMode}
            onChange={(v) => setSortMode(v)}
            style={{ width: 180 }}
            options={[
              { value: 'none', label: 'Sort: Default' },
              { value: 'name_asc', label: 'Name A–Z' },
              { value: 'name_desc', label: 'Name Z–A' },
              { value: 'dept_asc', label: 'Department A–Z' },
            ]}
          />
        </div>
      </div>
      <div style={{ 
        marginBottom: 12, 
        marginTop: 0,
        padding: '8px 12px', 
        background: 'linear-gradient(135deg, #ec407a10 0%, #d81b6010 100%)',
        borderRadius: '0px',
        border: '1px solid #ec407a20',
        borderTop: 'none'
      }}>
        <Typography.Text style={{ color: '#ec407a', fontWeight: 600 }}>📊 Showing {pagedRows.length} of {displayRows.length} doctors</Typography.Text>
      </div>
      {generatedDept && (
        <Alert
          showIcon
          type="info"
          message={`No doctors found for "${generatedDept}". Showing demo doctors for this department.`}
          style={{ marginBottom: 12 }}
        />
      )}
      <Input.Search
        placeholder="🔍 Search by name, specialization, or department"
        allowClear
        size="large"
        onSearch={setQuery}
        onChange={(e) => setQuery(e.target.value)}
        style={{ 
          marginBottom: 16,
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
        }}
      />
      <ListWrap>
        <List
          grid={{ gutter: [16, 16], xs: 1, sm: 2, md: 4 }}
          dataSource={(pagedRows.length ? pagedRows : (displayRows.length ? displayRows : fallbackDoctors))}
          renderItem={(doc) => (
            <List.Item>
              <GlowCard>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                  <Avatar 
                    size={56} 
                    style={{ 
                      backgroundColor: '#fff', 
                      color: getSpecColor(doc.specialization), 
                      border: `2px solid ${getSpecColor(doc.specialization)}`,
                      marginBottom: '12px'
                    }} 
                    icon={getSpecIcon(doc.specialization, getSpecColor(doc.specialization))} 
                  />
                  <Title level={5} style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>{doc.firstName} {doc.lastName}</Title>
                  <Space size={4} wrap style={{ marginBottom: 8, justifyContent: 'center' }}>
                    {doc.specialization && (
                      <Tag style={{ 
                        borderColor: getSpecColor(doc.specialization), 
                        color: getSpecColor(doc.specialization),
                        fontSize: '12px',
                        padding: '2px 8px'
                      }}>
                        {doc.specialization}
                      </Tag>
                    )}
                    {doc.role && <Tag color="geekblue" style={{ fontSize: '12px', padding: '2px 8px' }}>{doc.role}</Tag>}
                  </Space>
                  <div style={{ color: '#666', fontSize: '13px', lineHeight: 1.5, marginBottom: '8px', flex: 1 }}>
                    {doc.departmentName && <div style={{ marginBottom: '4px', fontSize: '12px' }}><strong>Dept:</strong> {doc.departmentName}</div>}
                    {doc.qualification && (
                      <div style={{ fontSize: '12px' }}>
                        {doc.qualification}
                        {typeof doc.experienceYears === 'number' && <div>{doc.experienceYears}+ years exp.</div>}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 'auto', width: '100%', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                      <Typography.Text strong style={{ fontSize: '12px' }}>Next slots:</Typography.Text>
                      <div style={{ marginTop: '4px' }}>
                        <NextSlots doctorId={doc.id} doctorName={`${doc.firstName} ${doc.lastName}`} />
                      </div>
                    </div>
                    <Space direction="vertical" style={{ width: '100%' }} size={6}>
                      <Link to={`/doctors/${doc.id}/availability`} style={{ width: '100%' }}>
                        <Button type="primary" size="small" block>Book Appointment</Button>
                      </Link>
                    </Space>
                  </div>
                </div>
              </GlowCard>
            </List.Item>
          )}
        />
        {displayRows.length > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={displayRows.length}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        )}
        <div className="bubbles">
          <span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
      </ListWrap>
    </Page>
  );
};

// Inline component to show next 3 upcoming slots for a doctor
type Avail = { dayOfWeek: string; startTime: string; endTime: string; specificDate?: string; isActive?: boolean };
type NextSlot = { label: string; iso: string };
const cache = new Map<string, { at: number; slots: NextSlot[] }>();
const NextSlots: React.FC<{ doctorId: string; doctorName: string }> = ({ doctorId, doctorName }) => {
  const [slots, setSlots] = useState<NextSlot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const nextDateForDay = (day: string): dayjs.Dayjs => {
    const map: any = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    const target = map[(day || '').toLowerCase()] ?? 0;
    let d = dayjs();
    for (let i = 0; i < 7 && d.day() !== target; i++) d = d.add(1, 'day');
    return d;
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // Serve from cache if fresh (60s)
      const cached = cache.get(doctorId);
      const now = Date.now();
      if (cached && now - cached.at < 60_000) {
        setSlots(cached.slots);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/availability/doctors/${doctorId}`, { suppressErrorToast: true } as any);
        const arr: Avail[] = res.data?.data || [];
        const upcoming: NextSlot[] = arr
          .filter(s => s.isActive !== false)
          .map(s => {
            const base = s.specificDate ? dayjs(s.specificDate) : nextDateForDay(s.dayOfWeek);
            const at = dayjs(base.format('YYYY-MM-DD') + ' ' + s.startTime);
            return { at, label: at.format('ddd HH:mm'), iso: at.toISOString() } as any;
          })
          .filter(o => (o.at as any).isAfter(dayjs().subtract(5, 'minute')))
          .sort((a: any, b: any) => a.at.valueOf() - b.at.valueOf())
          .slice(0, 3)
          .map((o: any) => ({ label: o.label, iso: o.iso }));
        const result = upcoming.length ? upcoming : getFallback();
        if (!cancelled) {
          setSlots(result);
          cache.set(doctorId, { at: now, slots: result });
        }
      } catch {
        if (!cancelled) {
          const result = getFallback();
          setSlots(result);
          cache.set(doctorId, { at: Date.now(), slots: result });
        }
      }
      setLoading(false);
    };
    const getFallback = () => {
      // Simple fallback window: next three weekdays 10:00
      const out: NextSlot[] = [];
      let d = dayjs();
      for (let i = 0; i < 3; i++) {
        d = d.add(1, 'day');
        const at = d.hour(10).minute(0);
        out.push({ label: at.format('ddd HH:mm'), iso: at.toISOString() });
      }
      return out;
    };
    load();
    return () => { cancelled = true; };
  }, [doctorId]);

  return (
    <Space size={6} wrap>
      {loading && (
        <>
          <Skeleton.Button active size="small" style={{ width: 64 }} />
          <Skeleton.Button active size="small" style={{ width: 64 }} />
          <Skeleton.Button active size="small" style={{ width: 64 }} />
        </>
      )}
      {!loading && slots.map((s, idx) => {
        const q = new URLSearchParams({ doctorId, doctorName, dateTime: s.iso }).toString();
        return (
          <Link key={idx} to={`/appointments/book?${q}`}>
            <Tag color="blue" style={{ marginBottom: 4, cursor: 'pointer' }}>{s.label}</Tag>
          </Link>
        );
      })}
    </Space>
  );
};

export default Doctors;
