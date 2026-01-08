import React, { useEffect, useState } from 'react';
import { List, Typography, Tag, Space, Input, Spin, Select, Avatar, Button, Switch, Pagination } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import styled, { keyframes } from 'styled-components';
import {
  MedicineBoxOutlined,
  HeartOutlined,
  SolutionOutlined,
  EyeOutlined,
  SmileOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface Department {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance' | string;
  averageDuration?: number;
  department?: Department;
  price?: number;
}

// Service icon mapping
const getServiceIcon = (name?: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('ecg') || n.includes('cardiac') || n.includes('heart')) return <HeartOutlined />;
  if (n.includes('x-ray') || n.includes('scan') || n.includes('mri')) return <EyeOutlined />;
  if (n.includes('physio') || n.includes('therapy')) return <SolutionOutlined />;
  if (n.includes('pediatric') || n.includes('child')) return <SmileOutlined />;
  return <MedicineBoxOutlined />;
};

const getServiceColor = (name?: string): string => {
  const n = (name || '').toLowerCase();
  if (n.includes('ecg') || n.includes('cardiac')) return '#ef4444';
  if (n.includes('x-ray') || n.includes('scan')) return '#0ea5e9';
  if (n.includes('physio')) return '#22c55e';
  if (n.includes('pediatric')) return '#f59e0b';
  return '#ec407a';
};

// Fallback services - aligned with department IDs from DepartmentsNew.tsx
const fallbackServices: Service[] = [
  { id: 's1', name: 'ECG', description: 'Electrocardiogram test', status: 'active', averageDuration: 30, price: 500, department: { id: '1', name: 'Cardiology' } },
  { id: 's2', name: 'Cardiac Stress Test', description: 'Exercise stress testing', status: 'active', averageDuration: 45, price: 1500, department: { id: '1', name: 'Cardiology' } },
  { id: 's3', name: 'Echocardiography', description: 'Heart ultrasound', status: 'active', averageDuration: 40, price: 2000, department: { id: '1', name: 'Cardiology' } },
  { id: 's4', name: 'Joint Replacement', description: 'Hip and knee replacement', status: 'active', averageDuration: 120, price: 150000, department: { id: '2', name: 'Orthopedics' } },
  { id: 's5', name: 'Physiotherapy', description: 'Physical rehabilitation', status: 'active', averageDuration: 45, price: 1200, department: { id: '2', name: 'Orthopedics' } },
  { id: 's6', name: 'Arthroscopy', description: 'Minimally invasive joint surgery', status: 'active', averageDuration: 90, price: 50000, department: { id: '2', name: 'Orthopedics' } },
  { id: 's7', name: 'Vaccination', description: 'Child immunization', status: 'active', averageDuration: 15, price: 300, department: { id: '3', name: 'Pediatrics' } },
  { id: 's8', name: 'Growth Assessment', description: 'Child development monitoring', status: 'active', averageDuration: 30, price: 800, department: { id: '3', name: 'Pediatrics' } },
  { id: 's9', name: 'Skin Biopsy', description: 'Tissue sample analysis', status: 'active', averageDuration: 20, price: 2500, department: { id: '4', name: 'Dermatology' } },
  { id: 's10', name: 'Acne Treatment', description: 'Comprehensive acne care', status: 'active', averageDuration: 30, price: 1500, department: { id: '4', name: 'Dermatology' } },
  { id: 's11', name: 'Eye Examination', description: 'Comprehensive eye test', status: 'active', averageDuration: 40, price: 700, department: { id: '5', name: 'Ophthalmology' } },
  { id: 's12', name: 'Cataract Surgery', description: 'Lens replacement surgery', status: 'active', averageDuration: 60, price: 35000, department: { id: '5', name: 'Ophthalmology' } },
  { id: 's13', name: 'EEG', description: 'Brain wave monitoring', status: 'active', averageDuration: 45, price: 3000, department: { id: '6', name: 'Neurology' } },
  { id: 's14', name: 'Stroke Clinic', description: 'Stroke prevention and care', status: 'active', averageDuration: 60, price: 2500, department: { id: '6', name: 'Neurology' } },
  { id: 's15', name: 'Sinus Treatment', description: 'Chronic sinusitis care', status: 'active', averageDuration: 30, price: 1800, department: { id: '7', name: 'ENT' } },
  { id: 's16', name: 'Tonsillectomy', description: 'Tonsil removal surgery', status: 'active', averageDuration: 60, price: 25000, department: { id: '7', name: 'ENT' } },
  { id: 's17', name: 'Endoscopy', description: 'Upper GI endoscopy', status: 'active', averageDuration: 30, price: 5000, department: { id: '8', name: 'Gastroenterology' } },
  { id: 's18', name: 'Colonoscopy', description: 'Lower GI examination', status: 'active', averageDuration: 45, price: 8000, department: { id: '8', name: 'Gastroenterology' } },
  { id: 's19', name: 'Prenatal Care', description: 'Pregnancy monitoring', status: 'active', averageDuration: 30, price: 1500, department: { id: '9', name: 'Gynecology' } },
  { id: 's20', name: 'Fertility Counseling', description: 'Reproductive health consultation', status: 'active', averageDuration: 45, price: 2000, department: { id: '9', name: 'Gynecology' } },
  { id: 's21', name: 'Prostate Screening', description: 'Prostate health check', status: 'active', averageDuration: 30, price: 1800, department: { id: '10', name: 'Urology' } },
  { id: 's22', name: 'Kidney Stone Treatment', description: 'Stone removal procedures', status: 'active', averageDuration: 60, price: 40000, department: { id: '10', name: 'Urology' } },
  { id: 's23', name: 'Chemotherapy', description: 'Cancer treatment', status: 'active', averageDuration: 180, price: 50000, department: { id: '11', name: 'Oncology' } },
  { id: 's24', name: 'Radiation Therapy', description: 'Targeted cancer treatment', status: 'active', averageDuration: 30, price: 30000, department: { id: '11', name: 'Oncology' } },
  { id: 's25', name: 'X-Ray', description: 'Digital radiography', status: 'active', averageDuration: 20, price: 800, department: { id: '12', name: 'Radiology' } },
  { id: 's26', name: 'MRI Scan', description: 'Magnetic resonance imaging', status: 'active', averageDuration: 60, price: 8000, department: { id: '12', name: 'Radiology' } },
];

const ServicesNew: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [includeDemo, setIncludeDemo] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const deptId = searchParams.get('departmentId');
    if (deptId) setDepartmentFilter(deptId);
  }, [searchParams]);

  useEffect(() => {
    loadDepartments();
    loadServices();
  }, [includeDemo, departmentFilter, statusFilter]);

  const loadDepartments = async () => {
    try {
      const res = await api.get('/departments', {
        params: { page: 1, limit: 100 },
        suppressErrorToast: true
      } as any);
      const items = res.data?.data || res.data || [];
      setDepartments(items);
    } catch (error) {
      setDepartments([]);
    }
  };

  const loadServices = async () => {
    setLoading(true);
    try {
      const params: any = { page: 1, limit: 100 };
      if (departmentFilter) params.departmentId = departmentFilter;
      if (statusFilter) params.status = statusFilter;
      else params.isActive = 'true';

      const res = await api.get('/services', { params, suppressErrorToast: true } as any);
      const items = res.data?.data || res.data || [];
      
      if (items.length > 0) {
        setServices(items);
      } else if (includeDemo) {
        // Filter fallback services by department if filter is active
        let filtered = fallbackServices;
        if (departmentFilter) {
          filtered = fallbackServices.filter(s => s.department?.id === departmentFilter);
        }
        setServices(filtered);
      } else {
        setServices([]);
      }
    } catch (error) {
      if (includeDemo) {
        // Filter fallback services by department if filter is active
        let filtered = fallbackServices;
        if (departmentFilter) {
          filtered = fallbackServices.filter(s => s.department?.id === departmentFilter);
        }
        setServices(filtered);
      } else {
        setServices([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(query.toLowerCase()) ||
    (service.description || '').toLowerCase().includes(query.toLowerCase())
  );

  const pagedServices = filteredServices.slice((page - 1) * pageSize, page * pageSize);

  return (
    <PageContainer>
      <Hero>
        <HeroContent>
          <Tag color="pink" style={{ marginBottom: 12 }}>💊 Healthcare Services</Tag>
          <Title level={1} style={{ margin: '0 0 12px 0', fontSize: 42, fontWeight: 700, color: '#1a1a1a' }}>
            Our Services
          </Title>
          <Text style={{ fontSize: 16, color: '#666', display: 'block', lineHeight: 1.6 }}>
            Comprehensive medical services with state-of-the-art facilities and experienced healthcare professionals.
          </Text>
        </HeroContent>
        <HeroIcons>
          <IconFloat delay={0}><MedicineBoxOutlined style={{ fontSize: 32, color: '#ec407a' }} /></IconFloat>
          <IconFloat delay={0.3}><HeartOutlined style={{ fontSize: 28, color: '#ef4444' }} /></IconFloat>
          <IconFloat delay={0.6}><CheckCircleOutlined style={{ fontSize: 30, color: '#22c55e' }} /></IconFloat>
        </HeroIcons>
      </Hero>

      <StatsBar>
        <Text style={{ color: '#ec407a', fontWeight: 600 }}>
          📊 Showing {pagedServices.length} of {filteredServices.length} services
          {departmentFilter && departments.find(d => d.id === departmentFilter) && (
            <span style={{ marginLeft: 8, color: '#666' }}>
              • Filtered by: <strong>{departments.find(d => d.id === departmentFilter)?.name}</strong>
            </span>
          )}
        </Text>
      </StatsBar>

      <ControlPanel>
        <Input.Search
          placeholder="🔍 Search services by name or description"
          allowClear
          size="large"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={setQuery}
          style={{ flex: 1, maxWidth: 400 }}
        />
        <Space>
          <Select
            placeholder="Filter by department"
            allowClear
            style={{ width: 200 }}
            value={departmentFilter}
            onChange={setDepartmentFilter}
          >
            {departments.map(dept => (
              <Option key={dept.id} value={dept.id}>{dept.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="maintenance">Maintenance</Option>
          </Select>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text>Demo</Text>
            <Switch size="small" checked={includeDemo} onChange={setIncludeDemo} />
          </div>
        </Space>
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
              dataSource={pagedServices}
              renderItem={(service) => (
                <List.Item>
                  <ServiceCard>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', height: '100%' }}>
                      <Avatar
                        size={64}
                        style={{
                          backgroundColor: '#fff',
                          color: getServiceColor(service.name),
                          border: `2px solid ${getServiceColor(service.name)}`,
                          marginBottom: 16,
                          fontSize: 28
                        }}
                        icon={getServiceIcon(service.name)}
                      />
                      <Title level={5} style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>
                        {service.name}
                      </Title>
                      <Text style={{ fontSize: 13, color: '#666', marginBottom: 12, display: 'block', lineHeight: 1.5, minHeight: 40 }}>
                        {service.description || 'Professional medical service'}
                      </Text>

                      <Space size={4} wrap style={{ marginBottom: 16, justifyContent: 'center' }}>
                        {service.department && (
                          <Tag
                            style={{
                              borderColor: getDeptColor(service.department.name),
                              color: getDeptColor(service.department.name),
                              fontSize: 11,
                              padding: '2px 8px'
                            }}
                          >
                            {service.department.name}
                          </Tag>
                        )}
                        {service.status && (
                          <Tag color={service.status === 'active' ? 'green' : 'default'} style={{ fontSize: 11, padding: '2px 8px' }}>
                            {service.status}
                          </Tag>
                        )}
                      </Space>

                      {(service.averageDuration || service.price) && (
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                          {service.averageDuration && (
                            <div><ClockCircleOutlined /> {service.averageDuration} mins</div>
                          )}
                          {service.price && (
                            <div style={{ fontWeight: 600, color: '#ec407a', fontSize: 14, marginTop: 4 }}>
                              ₹{service.price}
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginTop: 'auto', width: '100%', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
                        <Space direction="vertical" style={{ width: '100%' }} size={6}>
                          <Button
                            type="primary"
                            size="small"
                            block
                            onClick={() => navigate('/appointments/book')}
                          >
                            Book Service
                          </Button>
                          <Button
                            size="small"
                            block
                            onClick={() => service.department && navigate(`/doctors?dept=${encodeURIComponent(service.department.name)}`)}
                          >
                            Find Doctors
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </ServiceCard>
                </List.Item>
              )}
            />
            <div className="bubbles">
              <span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
          </ListWrap>

          {filteredServices.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={filteredServices.length}
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

export default ServicesNew;

// Helper function for department colors
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
  if (n.includes('radio')) return '#6366f1';
  return '#ec407a';
};

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

const ServiceCard = styled.div`
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
