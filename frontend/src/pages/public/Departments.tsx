import React, { useEffect, useState, useRef } from 'react';
import { Card, List, Typography, Tag, Spin, Alert, Space } from 'antd';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import styled, { keyframes } from 'styled-components';
import {
  HeartOutlined,
  SolutionOutlined,
  SmileOutlined,
  SkinOutlined,
  EyeOutlined,
  DeploymentUnitOutlined,
  AlertOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface Department {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

// Color helper to keep icon colors consistent
const getDeptColor = (name?: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('cardio')) return '#ef4444';
  if (n.includes('ortho')) return '#0ea5e9';
  if (n.includes('pedia')) return '#22c55e';
  if (n.includes('derma')) return '#a855f7';
  if (n.includes('ophthal') || n.includes('eye')) return '#06b6d4';
  if (n.includes('neuro')) return '#f59e0b';
  if (n.includes('ent')) return '#10b981';
  if (n.includes('gastro')) return '#ec4899';
  if (n.includes('onco')) return '#9333ea';
  if (n.includes('uro')) return '#0ea5e9';
  if (n.includes('gyn')) return '#db2777';
  if (n.includes('radio')) return '#6366f1';
  if (n.includes('pulmo')) return '#0891b2';
  if (n.includes('nephro')) return '#22d3ee';
  return '#16a34a';
};

const getDeptIcon = (name?: string, color?: string) => {
  const c = color || getDeptColor(name);
  const n = (name || '').toLowerCase();
  const style = { color: c } as React.CSSProperties;
  if (n.includes('cardio')) return <HeartOutlined style={style} />;
  if (n.includes('ortho')) return <SolutionOutlined style={style} />;
  if (n.includes('pedia')) return <SmileOutlined style={style} />;
  if (n.includes('derma')) return <SkinOutlined style={style} />;
  if (n.includes('ophthal') || n.includes('eye')) return <EyeOutlined style={style} />;
  if (n.includes('neuro')) return <DeploymentUnitOutlined style={style} />;
  if (n.includes('ent')) return <AlertOutlined style={style} />;
  if (n.includes('gastro')) return <MedicineBoxOutlined style={style} />;
  if (n.includes('onco')) return <ExperimentOutlined style={style} />;
  return <TeamOutlined style={style} />;
};

type DeptWithServices = Department & { services?: string[] };

// Fallback full department list with services
const fallbackDepartments: DeptWithServices[] = [
  { id: 'dep-cardiology', name: 'Cardiology', description: 'Heart care', isActive: true, services: ['ECG', 'Echocardiography', 'Angiography', 'Cardiac Rehab'] },
  { id: 'dep-orthopedics', name: 'Orthopedics', description: 'Bone and joints', isActive: true, services: ['Joint Replacement', 'Arthroscopy', 'Physiotherapy'] },
  { id: 'dep-pediatrics', name: 'Pediatrics', description: 'Child healthcare', isActive: true, services: ['Well-baby Clinic', 'Vaccinations', 'Growth Assessment'] },
  { id: 'dep-dermatology', name: 'Dermatology', description: 'Skin, hair and nail', isActive: true, services: ['Acne Care', 'Dermatosurgery', 'Allergy Testing'] },
  { id: 'dep-ophthalmology', name: 'Ophthalmology', description: 'Eye care', isActive: true, services: ['Eye Exams', 'Cataract Surgery', 'Glaucoma Clinic'] },
  { id: 'dep-neurology', name: 'Neurology', description: 'Brain and nerves', isActive: true, services: ['EEG', 'Stroke Clinic', 'Movement Disorders'] },
  { id: 'dep-ent', name: 'ENT', description: 'Ear, nose and throat', isActive: true, services: ['Sinus Clinic', 'Audiology', 'Tonsillectomy'] },
  { id: 'dep-gastro', name: 'Gastroenterology', description: 'Digestive system and liver', isActive: true, services: ['Endoscopy', 'Colonoscopy', 'Liver Clinic'] },
  { id: 'dep-gynecology', name: 'Gynecology', description: 'Women’s health', isActive: true, services: ['Prenatal Care', 'Fertility Counseling', 'Menstrual Disorders'] },
  { id: 'dep-urology', name: 'Urology', description: 'Urinary tract care', isActive: true, services: ['Prostate Clinic', 'Stone Management', 'Endoscopy'] },
  { id: 'dep-oncology', name: 'Oncology', description: 'Cancer care', isActive: true, services: ['Chemotherapy', 'Radiation', 'Immunotherapy'] },
  { id: 'dep-radiology', name: 'Radiology', description: 'Imaging services', isActive: true, services: ['X-Ray', 'MRI', 'CT Scan'] },
  { id: 'dep-pulmonology', name: 'Pulmonology', description: 'Lungs and breathing', isActive: true, services: ['PFT', 'Asthma Clinic', 'Sleep Study'] },
  { id: 'dep-nephrology', name: 'Nephrology', description: 'Kidney care', isActive: true, services: ['Dialysis', 'CKD Clinic', 'Transplant Evaluation'] },
];

// Animations
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
  padding: 28px 24px;
  margin-bottom: 16px;

  .wrap { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; align-items: center; }
  .art { position: relative; height: 100px; }
  .art span { position: absolute; font-size: 24px; opacity: 0.95; }
  .art .cardio { left: 10px; top: 12px; color: #ef4444; animation: ${float} 3s ease-in-out infinite; }
  .art .ortho { left: 60px; top: 30px; color: #0ea5e9; animation: ${float} 2.6s ease-in-out infinite; }
  .art .pedia { left: 110px; top: 18px; color: #22c55e; animation: ${float} 3.4s ease-in-out infinite; }
  .art .derma { left: 160px; top: 40px; color: #a855f7; animation: ${float} 2.8s ease-in-out infinite; }
`;

// Grid container with responsive columns - 4 cards layout
const DepartmentGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

// Compact white card with pink hover - Fixed uniform height (matching Doctors page)
const StretchCard = styled(Card)`
  height: 100%;
  min-height: 320px;
  max-height: 320px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  
  .ant-card-head {
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 14px 16px;
    min-height: 56px;
    
    .ant-card-head-title {
      color: #1a1a1a;
      font-weight: 600;
      font-size: 16px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .anticon {
      font-size: 20px;
      transition: color 0.3s;
    }
  }
  
  .ant-card-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding: 16px;
    overflow: hidden;
  }
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(236, 64, 122, 0.2);
    border-color: #ec407a;
    background: linear-gradient(135deg, #ec407a 0%, #d81b60 100%);
    
    .ant-card-head {
      background: transparent;
      border-bottom-color: rgba(255, 255, 255, 0.2);
      
      .ant-card-head-title {
        color: white;
      }
      
      .anticon {
        color: white;
      }
    }
    
    .ant-card-body {
      color: white;
    }
    
    .desc {
      color: rgba(255, 255, 255, 0.9);
    }
    
    .services {
      .ant-list-header {
        border-bottom-color: rgba(255, 255, 255, 0.2);
        
        strong {
          color: white;
        }
      }
      
      .ant-list-item {
        color: white;
        
        .anticon {
          color: white;
        }
      }
    }
    
    .ant-tag {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.3);
      color: white;
    }
  }
  
  .desc {
    min-height: 38px;
    max-height: 38px;
    color: #666;
    line-height: 1.4;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 8px;
  }
  
  .services {
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #e5e7eb;
    max-height: 150px;
    overflow-y: auto;
    
    /* Hide scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
      display: none;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none;
    scrollbar-width: none;
    
    .ant-list-header {
      padding: 6px 0;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1;
    }
    
    .ant-list-item {
      padding: 4px 0;
      border-bottom: none;
      font-size: 12px;
      line-height: 1.3;
    }
  }
  
  &:hover .services .ant-list-header {
    background: transparent;
  }
`;

const Departments: React.FC = () => {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const departmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const selectedDepartment = searchParams.get('department');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/departments', { params: { page: 1, limit: 100, isActive: 'true' }, suppressErrorToast: true } as any);
        const items = (res.data?.data || res.data || []) as any[];
        // Filter to only show active departments
        const activeItems = items.filter((dept: any) => dept.status === 'active' || dept.isActive === true);
        if (activeItems && activeItems.length > 0) {
          // Enrich API departments: if no services came from API, attach fallback services by matching name.
          const norm = (s?: string) => String(s || '').toLowerCase();
          const enriched: DeptWithServices[] = activeItems.map((d: any) => {
            const apiServices = Array.isArray(d.services) ? d.services : [];
            const names = apiServices.map((s: any) => (typeof s === 'string' ? s : s?.name)).filter(Boolean);
            if (names.length > 0) return { ...(d as Department), services: names };
            const fb = fallbackDepartments.find(fd => norm(fd.name) === norm(d.name));
            return { ...(d as Department), services: fb?.services || [] };
          });
          // Merge with additional fallback departments not present in API
          const have = new Set(enriched.map(d => norm(d.name)));
          const merged: DeptWithServices[] = [ ...enriched, ...fallbackDepartments.filter(fd => !have.has(norm(fd.name))) ];
          setData(merged);
        } else {
          setData(fallbackDepartments);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load departments');
        setData(fallbackDepartments);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Scroll to selected department when data loads
  useEffect(() => {
    if (selectedDepartment && data.length > 0) {
      setTimeout(() => {
        const ref = departmentRefs.current[selectedDepartment];
        if (ref) {
          ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          ref.style.boxShadow = '0 0 0 3px rgba(236, 64, 122, 0.3)';
          setTimeout(() => {
            ref.style.boxShadow = '';
          }, 2000);
        }
      }, 300);
    }
  }, [selectedDepartment, data]);

  if (loading) return <Spin />;
  // If error occurred, we already populated fallbacks; do not block the page with an error.

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px' }}>
      <Hero>
        <div className="wrap">
          <div>
            <Title level={2} style={{ margin: 0 }}>Departments & Services</Title>
            <Paragraph style={{ marginTop: 6 }}>Explore our hospital departments and the services we offer.</Paragraph>
          </div>
          <div className="art">
            <span className="cardio"><HeartOutlined /></span>
            <span className="ortho"><SolutionOutlined /></span>
            <span className="pedia"><SmileOutlined /></span>
            <span className="derma"><SkinOutlined /></span>
          </div>
        </div>
      </Hero>
      <DepartmentGrid>
        {(data as DeptWithServices[]).map((item) => (
          <div 
            key={item.id}
            ref={(el) => { departmentRefs.current[item.name] = el; }}
            style={{ display: 'flex' }}
          >
            <Link to={`/doctors?dept=${encodeURIComponent(item.name)}`} style={{ color: 'inherit', width: '100%', display: 'flex' }}>
              <StretchCard
                hoverable
                style={{ 
                  cursor: 'pointer',
                  transition: 'box-shadow 0.3s ease',
                  width: '100%'
                }}
                title={<Space>{getDeptIcon(item.name)}<span>{item.name}</span></Space>}
                cover={item.imageUrl ? <img alt={item.name} src={item.imageUrl} /> : undefined}
              >
              {item.isActive !== undefined && (
                <Tag color={item.isActive ? 'green' : 'red'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Tag>
              )}
              <Paragraph className="desc" style={{ marginTop: 8 }}>{item.description || 'No description available.'}</Paragraph>
              {Array.isArray((item as any).services) && (item as any).services.length > 0 && (
                <List className="services"
                  size="small"
                  header={<Typography.Text strong>Services:</Typography.Text>}
                  dataSource={(item as any).services}
                  renderItem={(svc: string) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: getDeptColor(item.name) }} />
                        <span>{typeof svc === 'string' ? svc : (svc as any)?.name || 'Unnamed Service'}</span>
                      </Space>
                    </List.Item>
                  )}
                />
              )}
              </StretchCard>
            </Link>
          </div>
        ))}
      </DepartmentGrid>
    </div>
  );
};

export default Departments;
