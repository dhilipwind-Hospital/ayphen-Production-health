import React, { useEffect, useRef, useState } from 'react';
import { Card, Typography, Row, Col, Button, List, Tag, Alert, Space, Avatar, Rate } from 'antd';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import api from '../../services/api';
import {
  HeartOutlined,
  ExperimentOutlined,
  SkinOutlined,
  MedicineBoxOutlined,
  WomanOutlined,
  SolutionOutlined,
  EyeOutlined,
  SmileOutlined,
  UserOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  DeploymentUnitOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// Updated Medical Theme Colors
const theme = {
  primary: '#667eea',    // Medical purple
  secondary: '#0ea5e9',  // Sky blue  
  accent: '#22c55e',     // Success green
  danger: '#ef4444',     // Emergency red
  warning: '#f59e0b',    // Amber
  dark: '#1e293b',       // Slate 800
  light: '#f8fafc',      // Slate 50
  gradient: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    success: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    cardiology: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    dermatology: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    ent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    gastro: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  }
};

// Animations for hero
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
  background: ${theme.gradient.primary};
  border-radius: 20px;
  overflow: hidden;
  padding: 60px 40px;
  margin-bottom: 32px;
  min-height: 500px;
  display: flex;
  align-items: center;

  .hero-inner { 
    max-width: 1200px; 
    margin: 0 auto; 
    display: grid; 
    grid-template-columns: 1.2fr 1fr; 
    gap: 40px; 
    align-items: center;
    width: 100%;
  }
  
  .hero-copy h1 { 
    color: white; 
    margin: 0 0 20px 0; 
    font-weight: 700; 
    font-size: 48px;
    letter-spacing: -0.02em; 
    line-height: 1.1;
  }
  
  .hero-copy p { 
    color: rgba(255, 255, 255, 0.9); 
    font-size: 18px; 
    line-height: 1.6;
    margin-bottom: 32px;
    max-width: 500px;
  }

  .cta-group { 
    display: flex; 
    gap: 16px; 
    flex-wrap: wrap; 
  }

  .btn-primary {
    background: white;
    color: ${theme.primary};
    border: 2px solid white;
    font-weight: 600;
    height: 48px;
    padding: 0 32px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  .btn-primary:hover {
    background: transparent;
    color: white;
    border-color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  .visual { 
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .hero-image {
    width: 100%;
    height: 300px;
    border-radius: 16px;
    object-fit: cover;
    opacity: 0.9;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    .hero-inner {
      grid-template-columns: 1fr;
      gap: 24px;
      text-align: center;
    }
    
    .hero-copy h1 {
      font-size: 36px;
    }
    
    padding: 40px 24px;
  }
`;

const Section = styled.section`
  margin: 32px 0;
  /* Reveal animation */
  [data-reveal] { opacity: 0; transform: translateY(12px); transition: opacity .6s ease, transform .6s ease; }
  [data-reveal].is-visible { opacity: 1; transform: none; }
  /* Staggered reveal for grid columns */
  [data-reveal] .ant-col { opacity: 0; transform: translateY(12px); transition: opacity .6s ease, transform .6s ease; }
  [data-reveal].is-visible .ant-col { opacity: 1; transform: none; }
  [data-reveal].is-visible .ant-col:nth-child(2) { transition-delay: .05s; }
  [data-reveal].is-visible .ant-col:nth-child(3) { transition-delay: .1s; }
  [data-reveal].is-visible .ant-col:nth-child(4) { transition-delay: .15s; }
  [data-reveal].is-visible .ant-col:nth-child(5) { transition-delay: .2s; }
  [data-reveal].is-visible .ant-col:nth-child(6) { transition-delay: .25s; }
`;

// Uniform preview card styles (similar to Departments page)
const StretchCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  .ant-card-body { display: flex; flex-direction: column; height: 100%; }
  .desc { min-height: 48px; }
  .services { margin-top: 8px; min-height: 92px; }
  transition: transform .15s ease, box-shadow .15s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(15,23,42,0.08); }
`;

const DocCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;
  .ant-card-body { display: flex; flex-direction: column; height: 100%; }
  .top { margin-bottom: 8px; }
  .meta { margin-bottom: 6px; min-height: 22px; }
  transition: transform .15s ease, box-shadow .15s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(15,23,42,0.08); }
`;

const GlowCard = styled(Card)`
  position: relative;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  
  &:hover { 
    transform: translateY(-6px); 
    box-shadow: 0 12px 24px rgba(102, 126, 234, 0.15);
    border-color: ${theme.primary};
  }
`;

const SpecialtyCard = styled.div`
  position: relative;
  height: 280px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  
  &:hover {
    transform: translateY(-6px);
    border-color: #ec407a;
    box-shadow: 0 12px 24px rgba(236, 64, 122, 0.15);
  }
  
  .image-section {
    height: 140px;
    overflow: hidden;
    position: relative;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .image-bg {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .image-placeholder {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${theme.gradient.primary};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: white;
  }
  
  .content {
    padding: 20px;
    flex: 1;
    display: flex;
    flex-direction: column;
    background: white;
  }
  
  .specialty-title {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
    color: #1e293b;
  }
  
  .specialty-desc {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 12px;
    flex: 1;
  }
  
  .specialty-stats {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #667eea;
    font-weight: 600;
  }
`;

const StatsCard = styled.div`
  text-align: center;
  padding: 32px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    background: ${theme.gradient.primary};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      font-size: 28px;
      color: white;
    }
  }
  
  .stat-number {
    font-size: 36px;
    font-weight: 700;
    color: ${theme.primary};
    margin-bottom: 8px;
  }
  
  .stat-label {
    font-size: 16px;
    color: #64748b;
  }
`;

type Department = { id: string; name: string; description?: string; isActive?: boolean };
type Doctor = { id: string; firstName: string; lastName: string; email?: string; phone?: string; specialization?: string; departmentName?: string };
type Testimonial = { id: string; name: string; quote: string; rating: number; avatarUrl?: string };

const tips: { title: string; color: string }[] = [
  { title: 'Stay hydrated and maintain a balanced diet.', color: 'blue' },
  { title: 'Get 7–8 hours of sleep for better immunity.', color: 'green' },
  { title: 'Regular check-ups can prevent complications.', color: 'purple' },
];

const fallbackTestimonials: Testimonial[] = [
  { id: 't1', name: 'Ravi K.', quote: 'Friendly staff and quick diagnosis. Highly recommend!', rating: 5 },
  { id: 't2', name: 'Meera S.', quote: 'Doctors were attentive and explained everything clearly.', rating: 4 },
  { id: 't3', name: 'Arun P.', quote: 'Clean facility and smooth appointment process.', rating: 5 },
  { id: 't4', name: 'Priya D.', quote: 'Emergency team was prompt and professional.', rating: 5 },
  { id: 't5', name: 'Karthik N.', quote: 'Got my reports on time. Overall great experience.', rating: 4 }
];

// Color helpers
const getDeptColor = (name?: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('cardio')) return '#ef4444';
  if (n.includes('ortho')) return '#0ea5e9';
  if (n.includes('pedia')) return '#22c55e';
  if (n.includes('derma')) return '#a855f7';
  if (n.includes('ophthal') || n.includes('opthal') || n.includes('eye')) return '#06b6d4';
  if (n.includes('neuro')) return '#f59e0b';
  if (n.includes('ent')) return '#10b981';
  if (n.includes('gastro')) return '#ec4899';
  return '#16a34a';
};

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
  return <UserOutlined style={style} />;
};

// Professional specialties data with image support
const specialtiesData = [
  {
    id: 'cardiology',
    title: 'Cardiology',
    description: 'Advanced heart care and cardiac procedures',
    image: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400&h=300&fit=crop&auto=format', // Heart/cardiac care
    bgGradient: theme.gradient.cardiology,
    stats: '5000+ procedures',
    doctors: 12
  },
  {
    id: 'dermatology', 
    title: 'Dermatology',
    description: 'Comprehensive skin care and treatments',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format', // Dermatology/skin care
    bgGradient: theme.gradient.dermatology,
    stats: '3000+ patients',
    doctors: 8
  },
  {
    id: 'ent',
    title: 'ENT',
    description: 'Ear, nose, and throat specialists',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=300&fit=crop&auto=format', // Medical examination
    bgGradient: theme.gradient.ent,
    stats: '2500+ surgeries',
    doctors: 6
  },
  {
    id: 'gastroenterology',
    title: 'Gastroenterology', 
    description: 'Digestive system care and endoscopy',
    image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=300&fit=crop&auto=format', // Medical equipment
    bgGradient: theme.gradient.gastro,
    stats: '4000+ procedures',
    doctors: 10
  }
];

// Statistics data
const statisticsData = [
  {
    icon: <HeartOutlined />,
    number: '50,000+',
    label: 'Patients Treated'
  },
  {
    icon: <TeamOutlined />,
    number: '200+',
    label: 'Expert Doctors'
  },
  {
    icon: <CheckCircleOutlined />,
    number: '15+',
    label: 'Departments'
  },
  {
    icon: <ThunderboltOutlined />,
    number: '24/7',
    label: 'Emergency Care'
  }
];

// Fallback demo content when API returns empty or is unreachable
const fallbackDepartments: Array<Department & { services?: string[]; icon?: React.ReactNode }> = [
  {
    id: 'dep-cardiology',
    name: 'Cardiology',
    description: 'Heart care including diagnostics, interventions, and rehabilitation.',
    isActive: true,
    services: ['ECG', 'Echocardiography', 'Angiography', 'Cardiac Rehab'],
    icon: <HeartOutlined style={{ color: '#ef4444' }} />,
  },
  {
    id: 'dep-orthopedics',
    name: 'Orthopedics',
    description: 'Bone and joint care for fractures, arthritis, and sports injuries.',
    isActive: true,
    services: ['Joint Replacement', 'Arthroscopy', 'Physiotherapy'],
    icon: <SolutionOutlined style={{ color: '#0ea5e9' }} />,
  },
  {
    id: 'dep-pediatrics',
    name: 'Pediatrics',
    description: 'Comprehensive child healthcare and immunizations.',
    isActive: true,
    services: ['Well-baby Clinic', 'Vaccinations', 'Growth Assessment'],
    icon: <SmileOutlined style={{ color: '#22c55e' }} />,
  },
  {
    id: 'dep-dermatology',
    name: 'Dermatology',
    description: 'Skin, hair, and nail conditions.',
    isActive: true,
    services: ['Acne Care', 'Dermatosurgery', 'Allergy Testing'],
    icon: <SkinOutlined style={{ color: '#a855f7' }} />,
  },
  {
    id: 'dep-ophthalmology',
    name: 'Ophthalmology',
    description: 'Eye care including cataract and glaucoma.',
    isActive: true,
    services: ['Eye Exams', 'Cataract Surgery', 'Glaucoma Clinic'],
    icon: <EyeOutlined style={{ color: '#06b6d4' }} />,
  },
  {
    id: 'dep-neurology',
    name: 'Neurology',
    description: 'Brain and nervous system disorders.',
    isActive: true,
    services: ['EEG', 'Stroke Clinic', 'Movement Disorders'],
    icon: <DeploymentUnitOutlined style={{ color: '#f59e0b' }} />,
  },
  {
    id: 'dep-ent',
    name: 'ENT',
    description: 'Ear, nose and throat care.',
    isActive: true,
    services: ['Sinus Clinic', 'Audiology', 'Tonsillectomy'],
    icon: <AlertOutlined style={{ color: '#10b981' }} />,
  },
  {
    id: 'dep-gastro',
    name: 'Gastroenterology',
    description: 'Digestive system and liver care.',
    isActive: true,
    services: ['Endoscopy', 'Colonoscopy', 'Liver Clinic'],
    icon: <MedicineBoxOutlined style={{ color: '#ec4899' }} />,
  }
];

const fallbackDoctors: Doctor[] = [
  { id: 'doc-1', firstName: 'Aarav', lastName: 'Sharma', specialization: 'Cardiologist', departmentName: 'Cardiology', email: 'aarav.sharma@example.com' },
  { id: 'doc-2', firstName: 'Priya', lastName: 'Natarajan', specialization: 'Orthopedic Surgeon', departmentName: 'Orthopedics', email: 'priya.n@example.com' },
  { id: 'doc-3', firstName: 'Rohan', lastName: 'Mehta', specialization: 'Pediatrician', departmentName: 'Pediatrics', email: 'rohan.mehta@example.com' },
  { id: 'doc-4', firstName: 'Sneha', lastName: 'Iyer', specialization: 'Dermatologist', departmentName: 'Dermatology', email: 'sneha.iyer@example.com' },
  { id: 'doc-5', firstName: 'Vikram', lastName: 'Patel', specialization: 'Ophthalmologist', departmentName: 'Ophthalmology', email: 'vikram.patel@example.com' },
  { id: 'doc-6', firstName: 'Anil', lastName: 'Kumar', specialization: 'Neurologist', departmentName: 'Neurology', email: 'anil.kumar@example.com' },
  { id: 'doc-7', firstName: 'Divya', lastName: 'Rao', specialization: 'ENT Specialist', departmentName: 'ENT', email: 'divya.rao@example.com' },
  { id: 'doc-8', firstName: 'Suresh', lastName: 'Menon', specialization: 'Gastroenterologist', departmentName: 'Gastroenterology', email: 'suresh.menon@example.com' },
  { id: 'doc-9', firstName: 'Lakshmi', lastName: 'Krishnan', specialization: 'Gynecologist', departmentName: 'Gynecology', email: 'lakshmi.k@example.com' },
  { id: 'doc-10', firstName: 'Imran', lastName: 'Ali', specialization: 'Urologist', departmentName: 'Urology', email: 'imran.ali@example.com' },
  { id: 'doc-11', firstName: 'Meera', lastName: 'Shah', specialization: 'Oncologist', departmentName: 'Oncology', email: 'meera.shah@example.com' },
];

const Home: React.FC = () => {
  const [deps, setDeps] = useState<Department[]>(fallbackDepartments.slice(0, 3));
  const [docs, setDocs] = useState<Doctor[]>(fallbackDoctors.slice(0, 3));
  const [error, setError] = useState<string | null>(null);
  const [tms, setTms] = useState<Testimonial[]>(fallbackTestimonials.slice(0, 3));

  useEffect(() => {
    const load = async () => {
      try {
        const [d1, d2, d3] = await Promise.all([
          api.get('/departments', { params: { page: 1, limit: 6 }, suppressErrorToast: true } as any),
          api.get('/public/doctors', { suppressErrorToast: true } as any),
          api.get('/public/testimonials', { suppressErrorToast: true } as any).catch(() => ({ data: [] }))
        ]);
        const depData = (d1.data?.data || d1.data || []) as Department[];
        const docData = (d2.data?.data || []) as Doctor[];
        const tmData = (d3 as any).data?.data || (d3 as any).data || [];

        // Helper to ensure at least 3 items by filling from fallback while keeping uniqueness
        const ensureThree = <T,>(base: T[], fallback: T[], key: (t: T) => string): T[] => {
          const used = new Set<string>(base.map(key));
          const out: T[] = [];
          for (const item of base) {
            if (out.length >= 3) break;
            out.push(item);
          }
          for (const f of fallback) {
            if (out.length >= 3) break;
            const k = key(f);
            if (!used.has(k)) {
              used.add(k);
              out.push(f);
            }
          }
          return out.slice(0, 3);
        };

        const deps3 = ensureThree(
          depData,
          fallbackDepartments,
          (d: any) => String(d?.id || d?.name || '')
        );
        const docs3 = ensureThree(
          docData,
          fallbackDoctors,
          (d: any) => String(d?.id || `${d?.firstName || ''}-${d?.lastName || ''}`)
        );
        const mappedTms: Testimonial[] = (Array.isArray(tmData) ? tmData : []).map((t: any, i: number) => {
          const base: Testimonial = {
            id: String(t?.id || `tm-${i}`),
            name: String(t?.name || t?.author || 'Patient'),
            quote: String(t?.quote || t?.text || ''),
            rating: Number(t?.rating || 5),
          };
          if (t?.avatarUrl) (base as any).avatarUrl = String(t.avatarUrl);
          return base;
        });

        const tms5 = ensureThree(
          mappedTms,
          fallbackTestimonials,
          (t: any) => String(t?.id || t?.name || '')
        ).slice(0, 5);

        setDeps(deps3);
        setDocs(docs3);
        setTms(tms5);
      } catch (e: any) {
        setError(e?.message || 'Failed to load data');
        // Use fallbacks if API is unreachable
        setDeps(fallbackDepartments.slice(0, 3));
        setDocs(fallbackDoctors.slice(0, 3));
        setTms(fallbackTestimonials.slice(0, 3));
      }
    };
    load();
  }, []);

  // Reveal on scroll for elements with [data-reveal]
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
    if (!nodes.length) return;
    const onIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('is-visible');
        }
      });
    };
    const io = new IntersectionObserver(onIntersect, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });
    nodes.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      el.querySelectorAll<HTMLElement>('.art span').forEach((s) => {
        const speed = Number(s.getAttribute('data-speed') || 1);
        const tx = (-nx * 6 * speed).toFixed(1);
        const ty = (-ny * 6 * speed).toFixed(1);
        s.style.transform = `translate(${tx}px, ${ty}px)`;
      });
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div>
      <Hero ref={heroRef as any}>
        <div className="hero-inner">
          <div className="hero-copy">
            <Title level={1}>Compassionate Care. Modern Medicine.</Title>
            <Paragraph>
              Comprehensive healthcare services delivered by expert doctors and modern facilities. Your well-being is our priority.
            </Paragraph>
            <div className="cta-group">
              <Link to="/appointments/book"><Button type="primary" size="large" className="btn-primary">Book Appointment</Button></Link>
              <Link to="/emergency"><Button danger size="large">Emergency 24/7</Button></Link>
              <Link to="/departments"><Button size="large" ghost style={{ color: 'white', borderColor: 'white' }}>Explore Departments</Button></Link>
            </div>
          </div>
          <div className="visual">
            <img 
              src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop" 
              alt="Modern hospital with medical professionals"
              className="hero-image"
            />
          </div>
        </div>
      </Hero>

      {/* Statistics Section */}
      <Section>
        <Row data-reveal gutter={[24, 24]}>
          {statisticsData.map((stat, index) => (
            <Col key={index} xs={12} sm={6} md={6}>
              <StatsCard>
                <div className="stat-icon">
                  {stat.icon}
                </div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </StatsCard>
            </Col>
          ))}
        </Row>
      </Section>

      {/* Professional Specialties Section */}
      <Section>
        <Row data-reveal gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: '#1e293b' }}>Centers of Excellence</Title>
            <Text style={{ color: '#64748b', fontSize: '16px' }}>World-class medical care across specialties</Text>
          </Col>
          <Col><Link to="/departments"><Button type="link">View all departments</Button></Link></Col>
        </Row>
        <Row data-reveal gutter={[24, 24]}>
          {specialtiesData.map((specialty) => (
            <Col key={specialty.id} xs={24} sm={12} md={6}>
              <Link to={`/doctors?dept=${encodeURIComponent(specialty.title)}`} style={{ color: 'inherit' }}>
                <SpecialtyCard>
                  <div className="image-section">
                    <img 
                      src={specialty.image} 
                      alt={specialty.title}
                      className="image-bg"
                      onError={(e) => {
                        console.log('Image failed to load:', specialty.image);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.parentElement?.querySelector('.image-placeholder');
                        if (placeholder) {
                          (placeholder as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    <div className="image-placeholder" style={{ display: 'none' }}>
                      {getSpecIcon(specialty.title.toLowerCase())}
                    </div>
                  </div>
                  <div className="content">
                    <div className="specialty-title">{specialty.title}</div>
                    <div className="specialty-desc">{specialty.description}</div>
                    <div className="specialty-stats">
                      <span>👨‍⚕️ {specialty.doctors} doctors</span>
                      <span>📊 {specialty.stats}</span>
                    </div>
                  </div>
                </SpecialtyCard>
              </Link>
            </Col>
          ))}
        </Row>
      </Section>

      <Section>
        <Row data-reveal gutter={[16, 16]} align="middle" style={{ marginBottom: 8 }}>
          <Col flex="auto"><Title level={3} style={{ margin: 0 }}>Other Departments & Services</Title></Col>
          <Col><Link to="/departments"><Button type="link">View all</Button></Link></Col>
        </Row>
        <Row data-reveal gutter={[16, 16]}>
          {deps.map((d) => (
            <Col key={d.id} xs={24} sm={12} md={8}>
              <Link to={`/doctors?dept=${encodeURIComponent((d as any).name || '')}`} style={{ color: 'inherit' }}>
                <GlowCard hoverable title={
                  <Space>
                    {(d as any).icon || <MedicineBoxOutlined />}
                    <span>{d.name}</span>
                  </Space>
                } extra={d.isActive !== undefined && <Tag color={d.isActive ? 'green' : 'red'}>{d.isActive ? 'Active' : 'Inactive'}</Tag>}>
                  <Paragraph className="desc">{d.description || 'No description available.'}</Paragraph>
                  {(() => {
                    const svcs: any[] | undefined = (d as any).services;
                    if (Array.isArray(svcs) && svcs.length) {
                      const names = svcs.map((s: any) => typeof s === 'string' ? s : (s?.name || s?.title || 'Service'));
                      const deptColor = getDeptColor(d.name);
                      return (
                        <List
                          className="services"
                          size="small"
                          header={<Text strong>Services:</Text>}
                          dataSource={names}
                          renderItem={(name: string) => (
                            <List.Item style={{ padding: '4px 0' }}>
                              <Space>
                                <CheckCircleOutlined style={{ color: deptColor }} />
                                <span>{name}</span>
                              </Space>
                            </List.Item>
                          )}
                        />
                      );
                    }
                    return null;
                  })()}
                </GlowCard>
              </Link>
            </Col>
          ))}
          {deps.length === 0 && (
            <Col span={24}><Alert type="info" message="No departments available yet." showIcon /></Col>
          )}
        </Row>
      </Section>

      <Section>
        <Row data-reveal gutter={[16, 16]} align="middle" style={{ marginBottom: 8 }}>
          <Col flex="auto"><Title level={3} style={{ margin: 0 }}>Our Doctors</Title></Col>
          <Col><Link to="/doctors"><Button type="link">View all</Button></Link></Col>
        </Row>
        <Row data-reveal gutter={[16, 16]}>
          {docs.map((doc) => (
            <Col key={doc.id} xs={24} sm={12} md={8}>
              <Link to={`/doctors?dept=${encodeURIComponent(doc.departmentName || doc.specialization || '')}`} style={{ color: 'inherit' }}>
                <GlowCard hoverable>
                  <Space align="center" className="top">
                    {(() => {
                      const c = getSpecColor(doc.specialization);
                      return (
                        <Avatar
                          style={{ backgroundColor: '#fff', color: c, border: `1px solid ${c}` }}
                          icon={getSpecIcon(doc.specialization, c)}
                        />
                      );
                    })()}
                    <Title level={5} style={{ margin: 0 }}>{doc.firstName} {doc.lastName}</Title>
                  </Space>
                  {doc.specialization && (() => { const c = getSpecColor(doc.specialization); return <Tag style={{ borderColor: c, color: c }}>{doc.specialization}</Tag>; })()}
                  {doc.departmentName && <div className="meta"><Text type="secondary">Department: {doc.departmentName}</Text></div>}
                  {doc.email && <Text type="secondary">{doc.email}</Text>}<br/>
                  {doc.phone && <Text type="secondary">{doc.phone}</Text>}
                </GlowCard>
              </Link>
            </Col>
          ))}
          {docs.length === 0 && (
            <Col span={24}><Alert type="info" message="No doctors listed yet." showIcon /></Col>
          )}
        </Row>
      </Section>

      {/* Testimonials */}
      <Section>
        <Row data-reveal gutter={[16, 16]} align="middle" style={{ marginBottom: 8 }}>
          <Col flex="auto"><Title level={3} style={{ margin: 0 }}>What Patients Say</Title></Col>
          <Col><Link to="/about"><Button type="link">About us</Button></Link></Col>
        </Row>
        <div style={{ background: 'linear-gradient(180deg, #f0fdf4 0%, #ecfeff 100%)', borderRadius: 12, padding: 12 }}>
          <Row data-reveal gutter={[16, 16]}>
            {tms.slice(0, 5).map((t) => (
              <Col key={t.id} xs={24} sm={12} md={8}>
                <GlowCard hoverable>
                  <Space align="start" style={{ width: '100%' }}>
                    <Avatar src={t.avatarUrl} icon={!t.avatarUrl ? <UserOutlined /> : undefined} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong>{t.name}</Text>
                        <Rate value={Math.max(1, Math.min(5, t.rating))} disabled allowHalf={false} />
                      </div>
                      <Paragraph style={{ marginTop: 6, marginBottom: 0 }}>
                        “{t.quote}”
                      </Paragraph>
                    </div>
                  </Space>
                </GlowCard>
              </Col>
            ))}
            {tms.length === 0 && (
              <Col span={24}><Alert type="info" message="No testimonials yet." showIcon /></Col>
            )}
          </Row>
        </div>
      </Section>

      <Section>
        <Card>
          <Row data-reveal gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Title level={4}>Contact Us</Title>
              <Paragraph style={{ marginBottom: 4 }}>123, Health Avenue, MedCity</Paragraph>
              <Paragraph style={{ marginBottom: 4 }}>Phone: +1 (555) 123-4567</Paragraph>
              <Paragraph>Email: contact@hospital.example</Paragraph>
            </Col>
            <Col xs={24} md={16}>
              <iframe
                title="Map"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: 8 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.019548!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ2JzMwLjAiTiAxMjLCsDI1JzA5LjkiVw!5e0!3m2!1sen!2sus!4v1689876543210">
              </iframe>
            </Col>
          </Row>
        </Card>
      </Section>

      {/* Floating WhatsApp/Call badge */}
      <WhatsAppFabLink
        href="https://wa.me/18000009999"
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp: For Appointment — Click Here"
      >
        <WhatsAppBadgeSVG />
      </WhatsAppFabLink>
    </div>
  );
};

const SpaceBetween = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

// WhatsApp badge - clean and simple
const WhatsAppBadgeSVG: React.FC = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden focusable="false">
    <defs>
      <path id="wa-top" d="M 40 10 a 30 30 0 1 1 0 60" />
      <path id="wa-bottom" d="M 40 70 a 30 30 0 1 1 0 -60" />
    </defs>
    
    {/* Outer white circle with border */}
    <circle cx="40" cy="40" r="38" fill="#fff" stroke="#ddd" strokeWidth="2" />
    
    {/* WhatsApp bubble */}
    <g transform="translate(40,40)">
      {/* Green circle */}
      <circle cx="0" cy="0" r="16" fill="#25D366" />
      
      {/* Bubble tail */}
      <path d="M -8 10 L -12 14 L -6 12 Z" fill="#25D366" />
      
      {/* Phone icon */}
      <path fill="#fff" d="M-4 -6 L4 -6 C5 -6 6 -5 6 -4 L6 4 C6 5 5 6 4 6 L-4 6 C-5 6 -6 5 -6 4 L-6 -4 C-6 -5 -5 -6 -4 -6 Z M-3 -3 L3 -3 M-3 -1 L3 -1 M-3 1 L3 1 M-1 3 L1 3"/>
    </g>
    
    {/* Curved text */}
    <text fontSize="7" fontWeight="700" fill="#e91e63" letterSpacing="1" style={{ textTransform: 'uppercase' }}>
      <textPath href="#wa-top" startOffset="5%">FOR APPOINTMENT</textPath>
    </text>
    <text fontSize="7" fontWeight="700" fill="#333" letterSpacing="1" style={{ textTransform: 'uppercase' }}>
      <textPath href="#wa-bottom" startOffset="45%">CLICK HERE</textPath>
    </text>
  </svg>
);

const WhatsAppFabLink = styled.a`
  position: fixed;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom, 0px));
  z-index: 1100;
  display: inline-block;
  line-height: 0;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.18));
  transition: transform .15s ease, filter .15s ease;
  &:hover { transform: scale(1.05); filter: drop-shadow(0 12px 24px rgba(0,0,0,0.22)); }
  /* Mobile: keep slightly higher to avoid bars */
  @media (max-width: 575px) {
    bottom: calc(40px + env(safe-area-inset-bottom, 0px));
  }
  /* static curved text; no rotation */
`;

export default Home;
