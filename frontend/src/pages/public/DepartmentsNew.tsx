import React, { useEffect, useState } from 'react';
import { List, Typography, Tag, Space, Input, Spin, Alert, Avatar, Button, Switch, Select, Pagination } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { CheckableTag } = Tag;

interface Department {
  id: string;
  name: string;
  description?: string;
  isActive?: boolean;
  doctorCount?: number;
  serviceCount?: number;
}

// Color mapping for departments
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

// Fallback departments
const fallbackDepartments: Department[] = [
  { id: '1', name: 'Cardiology', description: 'Heart and cardiovascular care', isActive: true, doctorCount: 12, serviceCount: 8 },
  { id: '2', name: 'Orthopedics', description: 'Bone and joint specialists', isActive: true, doctorCount: 10, serviceCount: 6 },
  { id: '3', name: 'Pediatrics', description: 'Child healthcare experts', isActive: true, doctorCount: 8, serviceCount: 5 },
  { id: '4', name: 'Dermatology', description: 'Skin, hair and nail care', isActive: true, doctorCount: 6, serviceCount: 7 },
  { id: '5', name: 'Ophthalmology', description: 'Eye care specialists', isActive: true, doctorCount: 7, serviceCount: 5 },
  { id: '6', name: 'Neurology', description: 'Brain and nervous system', isActive: true, doctorCount: 9, serviceCount: 6 },
  { id: '7', name: 'ENT', description: 'Ear, nose and throat', isActive: true, doctorCount: 5, serviceCount: 4 },
  { id: '8', name: 'Gastroenterology', description: 'Digestive system care', isActive: true, doctorCount: 8, serviceCount: 7 },
  { id: '9', name: 'Gynecology', description: 'Women\'s health', isActive: true, doctorCount: 9, serviceCount: 6 },
  { id: '10', name: 'Urology', description: 'Urinary system care', isActive: true, doctorCount: 6, serviceCount: 5 },
  { id: '11', name: 'Oncology', description: 'Cancer treatment', isActive: true, doctorCount: 11, serviceCount: 9 },
  { id: '12', name: 'Radiology', description: 'Medical imaging', isActive: true, doctorCount: 7, serviceCount: 8 },
];

const DepartmentsNew: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [includeDemo, setIncludeDemo] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, [includeDemo]);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments', {
        params: { page: 1, limit: 100, isActive: 'true' },
        suppressErrorToast: true
      } as any);
      const items = res.data?.data || res.data || [];
      setDepartments(items.length > 0 ? items : (includeDemo ? fallbackDepartments : []));
    } catch (error) {
      setDepartments(includeDemo ? fallbackDepartments : []);
    } finally {
      setLoading(false);
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(query.toLowerCase()) ||
    (dept.description || '').toLowerCase().includes(query.toLowerCase())
  );

  const pagedDepartments = filteredDepartments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <PageContainer>
      <Hero>
        <HeroContent>
          <Tag color="pink" style={{ marginBottom: 12 }}>🏥 Expert Medical Care</Tag>
          <Title level={1} style={{ margin: '0 0 12px 0', fontSize: 42, fontWeight: 700, color: '#1a1a1a' }}>
            Our Departments
          </Title>
          <Text style={{ fontSize: 16, color: '#666', display: 'block', lineHeight: 1.6 }}>
            Comprehensive healthcare services across every major specialty — here to provide expert, compassionate care.
          </Text>
        </HeroContent>
        <HeroIcons>
          <IconFloat delay={0}><HeartOutlined style={{ fontSize: 32, color: '#ef4444' }} /></IconFloat>
          <IconFloat delay={0.3}><MedicineBoxOutlined style={{ fontSize: 28, color: '#22c55e' }} /></IconFloat>
          <IconFloat delay={0.6}><UserOutlined style={{ fontSize: 30, color: '#0ea5e9' }} /></IconFloat>
        </HeroIcons>
      </Hero>

      <StatsBar>
        <Text style={{ color: '#ec407a', fontWeight: 600 }}>
          📊 Showing {pagedDepartments.length} of {filteredDepartments.length} departments
        </Text>
      </StatsBar>

      <ControlPanel>
        <Input.Search
          placeholder="🔍 Search departments by name or specialty"
          allowClear
          size="large"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={setQuery}
          style={{ flex: 1, maxWidth: 500 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Text>Include demo data</Text>
          <Switch checked={includeDemo} onChange={setIncludeDemo} />
        </div>
      </ControlPanel>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <ListWrap>
            <List
              grid={{ gutter: [16, 16], xs: 1, sm: 2, md: 3, lg: 4 }}
              dataSource={pagedDepartments}
              renderItem={(dept) => (
                <List.Item>
                  <DeptCard>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                      <Avatar
                        size={64}
                        style={{
                          backgroundColor: '#fff',
                          color: getDeptColor(dept.name),
                          border: `2px solid ${getDeptColor(dept.name)}`,
                          marginBottom: 16
                        }}
                        icon={getDeptIcon(dept.name, getDeptColor(dept.name))}
                      />
                      <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                        {dept.name}
                      </Title>
                      <Text style={{ fontSize: 13, color: '#666', marginBottom: 12, display: 'block', lineHeight: 1.5 }}>
                        {dept.description || 'Specialized medical care'}
                      </Text>
                      
                      <Space size={4} wrap style={{ marginBottom: 16, justifyContent: 'center' }}>
                        {dept.doctorCount && (
                          <Tag color="blue" style={{ fontSize: 11, padding: '2px 8px' }}>
                            <UserOutlined /> {dept.doctorCount} Doctors
                          </Tag>
                        )}
                        {dept.serviceCount && (
                          <Tag color="green" style={{ fontSize: 11, padding: '2px 8px' }}>
                            <MedicineBoxOutlined /> {dept.serviceCount} Services
                          </Tag>
                        )}
                      </Space>

                      <div style={{ marginTop: 'auto', width: '100%', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size={6}>
                          <Button 
                            type="primary" 
                            size="small" 
                            block
                            onClick={() => navigate(`/doctors?dept=${encodeURIComponent(dept.name)}`)}
                          >
                            View Doctors
                          </Button>
                          <Button 
                            size="small" 
                            block
                            onClick={() => navigate(`/services?departmentId=${dept.id}`)}
                          >
                            View Services
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </DeptCard>
                </List.Item>
              )}
            />
            <div className="bubbles">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
          </ListWrap>

          {filteredDepartments.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredDepartments.length}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default DepartmentsNew;

// Styled Components
const PageContainer = styled.div`
  padding: 0 24px 24px;
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;

const Hero = styled.section`
  position: relative;
  background: linear-gradient(135deg, #fef2f7 0%, #fff 50%, #f0f9ff 100%);
  border-radius: 16px;
  padding: 32px 28px;
  margin-bottom: 24px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  overflow: hidden;
`;

const HeroContent = styled.div`
  z-index: 1;
`;

const HeroIcons = styled.div`
  position: relative;
  display: flex;
  gap: 16px;
  align-items: center;
`;

const IconFloat = styled.div<{ delay: number }>`
  animation: ${pulse} 2s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const StatsBar = styled.div`
  margin-bottom: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #ec407a10 0%, #d81b6010 100%);
  border-radius: 8px;
  border: 1px solid #ec407a20;
`;

const ControlPanel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  flex-wrap: wrap;
`;

const listBubbleUp = keyframes`
  0% { transform: translateY(0) translateX(0); opacity: .45; }
  50% { transform: translateY(-40px) translateX(6px); opacity: .9; }
  100% { transform: translateY(-90px) translateX(-6px); opacity: .15; }
`;

const ListWrap = styled.div`
  position: relative;
  
  .bubbles { 
    position: absolute; 
    inset: 0; 
    pointer-events: none; 
    z-index: 0; 
  }
  
  .bubbles span {
    position: absolute; 
    width: 10px; 
    height: 10px; 
    border-radius: 9999px;
    background: rgba(19,194,194,0.10); 
    filter: blur(0.2px);
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

const DeptCard = styled.div`
  background: white !important;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  
  &:hover {
    background: white !important;
    border: 2px solid #ec407a;
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(236, 64, 122, 0.15);
    
    .ant-btn-primary {
      background: #d81b60 !important;
      box-shadow: 0 4px 12px rgba(236, 64, 122, 0.3);
    }
    
    .ant-btn:not(.ant-btn-primary) {
      border-color: #ec407a !important;
      color: #ec407a !important;
      background: rgba(236, 64, 122, 0.04) !important;
    }
  }
  
  .ant-btn {
    cursor: pointer;
    position: relative;
    z-index: 10;
  }
`;
