import React, { useEffect, useMemo, useState } from 'react';
import { Card, List, Typography, Tag, Space, Input, Select, Spin, Alert, Button, Skeleton, Pagination } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { MedicineBoxOutlined, HeartOutlined, SolutionOutlined, EyeOutlined, SmileOutlined } from '@ant-design/icons';
import styled, { keyframes } from 'styled-components';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// Subtle float-up animation for bubbles
const floatUp = keyframes`
  0% { transform: translateY(0) translateX(0); opacity: .5; }
  50% { transform: translateY(-50px) translateX(6px); opacity: .9; }
  100% { transform: translateY(-100px) translateX(-6px); opacity: .15; }
`;

const GlowCard = styled(Card)`
  position: relative;
  transition: transform .15s ease, box-shadow .15s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(15,23,42,0.08); }
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    padding: 1px;
    background: linear-gradient(90deg, rgba(14,165,233,.45), rgba(34,197,94,.45));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor; mask-composite: exclude;
    pointer-events: none;
  }
`;

// Styled components must be defined outside of render to avoid dynamic creation warnings
const Page = styled.div`
  position: relative;
  [data-reveal] { opacity: 0; transform: translateY(12px); transition: opacity .6s ease, transform .6s ease; }
  [data-reveal].is-visible { opacity: 1; transform: none; }
  /* Stagger list items a bit */
  [data-reveal].is-visible .ant-list-item:nth-child(2) { transition-delay: .05s; }
  [data-reveal].is-visible .ant-list-item:nth-child(3) { transition-delay: .1s; }

  /* Floating soft bubbles background */
  .bubbles { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
  .bubbles span {
    position: absolute; width: 10px; height: 10px; border-radius: 9999px;
    background: rgba(19,194,194,0.12); filter: blur(0.2px);
    animation: ${floatUp} 12s ease-in-out infinite;
  }
  .bubbles span:nth-child(1) { left: 12%; bottom: -10px; animation-duration: 13s; animation-delay: 0s; }
  .bubbles span:nth-child(2) { left: 28%; bottom: -16px; width: 8px; height: 8px; animation-duration: 14s; animation-delay: .6s; }
  .bubbles span:nth-child(3) { left: 44%; bottom: -12px; width: 12px; height: 12px; animation-duration: 11s; animation-delay: .3s; }
  .bubbles span:nth-child(4) { left: 60%; bottom: -18px; width: 9px; height: 9px; animation-duration: 13s; animation-delay: .9s; }
  .bubbles span:nth-child(5) { left: 76%; bottom: -10px; width: 7px; height: 7px; animation-duration: 12s; animation-delay: 1.2s; }
  .bubbles span:nth-child(6) { left: 88%; bottom: -14px; width: 11px; height: 11px; animation-duration: 15s; animation-delay: .3s; }

  @media (prefers-reduced-motion: reduce) {
    .bubbles span { animation: none !important; }
  }
`;

interface Department { id: string; name: string; }
interface Service {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance' | string;
  averageDuration?: number;
  department?: Department;
}

const Services: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 9;

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(() => params.get('q') || '');
  const [departmentId, setDepartmentId] = useState<string | undefined>(() => params.get('departmentId') || undefined);
  const [status, setStatus] = useState<string | undefined>(() => params.get('status') || undefined);

  useEffect(() => {
    const loadDeps = async () => {
      try {
        const res = await api.get('/departments', { 
          params: { page: 1, limit: 100 }, 
          suppressErrorToast: true,
          timeout: 5000 // 5 second timeout
        } as any);
        const items = res.data?.data || res.data || [];
        if (items.length > 0) {
          setDepartments(items);
        } else {
          console.log('API returned empty departments array, using fallback data');
          setDepartments(fallbackDepartments);
        }
      } catch (e) {
        console.error('Failed to load departments:', e);
        setDepartments(fallbackDepartments);
      }
    };
    loadDeps();
  }, []);

  // Fallback services data
  const fallbackServices: Service[] = [
    { 
      id: 'svc-ecg', 
      name: 'ECG', 
      description: 'Electrocardiogram to monitor heart activity',
      status: 'active',
      averageDuration: 15,
      department: { id: 'cardiology', name: 'Cardiology' }
    },
    { 
      id: 'svc-echo', 
      name: 'Echocardiography', 
      description: 'Ultrasound imaging of the heart',
      status: 'active',
      averageDuration: 30,
      department: { id: 'cardiology', name: 'Cardiology' }
    },
    { 
      id: 'svc-xray', 
      name: 'X-Ray', 
      description: 'Diagnostic imaging using X-ray radiation',
      status: 'active',
      averageDuration: 20,
      department: { id: 'radiology', name: 'Radiology' }
    },
    { 
      id: 'svc-mri', 
      name: 'MRI Scan', 
      description: 'Magnetic resonance imaging for detailed internal views',
      status: 'active',
      averageDuration: 45,
      department: { id: 'radiology', name: 'Radiology' }
    },
    { 
      id: 'svc-ct', 
      name: 'CT Scan', 
      description: 'Computerized tomography for cross-sectional images',
      status: 'active',
      averageDuration: 30,
      department: { id: 'radiology', name: 'Radiology' }
    },
    { 
      id: 'svc-bloodtest', 
      name: 'Blood Test', 
      description: 'Complete blood count and analysis',
      status: 'active',
      averageDuration: 10,
      department: { id: 'laboratory', name: 'Laboratory' }
    },
    { 
      id: 'svc-physio', 
      name: 'Physiotherapy', 
      description: 'Physical therapy for recovery and rehabilitation',
      status: 'active',
      averageDuration: 60,
      department: { id: 'rehabilitation', name: 'Rehabilitation' }
    },
    { 
      id: 'svc-dental', 
      name: 'Dental Checkup', 
      description: 'Comprehensive dental examination',
      status: 'active',
      averageDuration: 30,
      department: { id: 'dental', name: 'Dental' }
    },
    { 
      id: 'svc-eye', 
      name: 'Eye Examination', 
      description: 'Complete vision and eye health assessment',
      status: 'active',
      averageDuration: 25,
      department: { id: 'ophthalmology', name: 'Ophthalmology' }
    },
  ];

  // Fallback departments
  const fallbackDepartments: Department[] = [
    { id: 'cardiology', name: 'Cardiology' },
    { id: 'radiology', name: 'Radiology' },
    { id: 'laboratory', name: 'Laboratory' },
    { id: 'rehabilitation', name: 'Rehabilitation' },
    { id: 'dental', name: 'Dental' },
    { id: 'ophthalmology', name: 'Ophthalmology' },
    { id: 'neurology', name: 'Neurology' },
    { id: 'orthopedics', name: 'Orthopedics' },
    { id: 'pediatrics', name: 'Pediatrics' },
  ];

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/services', {
          params: {
            page: 1,
            limit: 100,
            search: query || undefined,
            departmentId: departmentId || undefined,
            status: status || undefined,
            isActive: status ? undefined : 'true', // Default to active services only when no specific status filter
          },
          suppressErrorToast: true,
          timeout: 5000, // 5 second timeout
        } as any);
        const items: Service[] = res.data?.data || res.data || [];
        
        if (items.length > 0) {
          setServices(items);
        } else {
          // If API returns empty array, use filtered fallback data
          console.log('API returned empty services array, using fallback data');
          let filtered = [...fallbackServices];
          
          if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(s => 
              s.name.toLowerCase().includes(q) || 
              s.description?.toLowerCase().includes(q) ||
              s.department?.name.toLowerCase().includes(q)
            );
          }
          
          if (departmentId) {
            filtered = filtered.filter(s => s.department?.id === departmentId);
          }
          
          if (status) {
            filtered = filtered.filter(s => s.status === status);
          } else {
            // Default to active services only
            filtered = filtered.filter(s => s.status === 'active');
          }
          
          setServices(filtered);
          setError('Using demo services data (API returned empty result)');
        }
      } catch (e: any) {
        console.error('Failed to load services:', e);
        setError('Unable to connect to services API. Using demo data.');
        
        // Use fallback data on error
        let filtered = [...fallbackServices];
        
        if (query) {
          const q = query.toLowerCase();
          filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(q) || 
            s.description?.toLowerCase().includes(q) ||
            s.department?.name.toLowerCase().includes(q)
          );
        }
        
        if (departmentId) {
          filtered = filtered.filter(s => s.department?.id === departmentId);
        }
        
        if (status) {
          filtered = filtered.filter(s => s.status === status);
        } else {
          // Default to active services only
          filtered = filtered.filter(s => s.status === 'active');
        }
        
        setServices(filtered);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query, departmentId, status]);

  // Reflect filters in URL
  useEffect(() => {
    const p = new URLSearchParams();
    if (query) p.set('q', query);
    if (departmentId) p.set('departmentId', departmentId);
    if (status) p.set('status', status);
    const qs = p.toString();
    navigate(`/services${qs ? `?${qs}` : ''}`, { replace: true });
  }, [query, departmentId, status]);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  // Reveal on scroll for this page
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]')) as HTMLElement[];
    if (!nodes.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) (e.target as HTMLElement).classList.add('is-visible'); });
    }, { threshold: 0.1 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // (moved Page styled component to module scope above)

  const iconFor = (svc: Service) => {
    const key = `${svc.name || ''} ${svc.department?.name || ''}`.toLowerCase();
    const style: React.CSSProperties = { color: '#13c2c2' };
    if (key.includes('cardio') || key.includes('heart')) return <HeartOutlined style={style} />;
    if (key.includes('ortho') || key.includes('bone')) return <SolutionOutlined style={style} />;
    if (key.includes('ophthal') || key.includes('eye') || key.includes('vision')) return <EyeOutlined style={style} />;
    if (key.includes('pedia') || key.includes('child')) return <SmileOutlined style={style} />;
    return <MedicineBoxOutlined style={style} />;
  };

  return (
    <Page>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div data-reveal style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>Our Services</Title>
            <Paragraph style={{ marginTop: 6 }}>Search and filter services. You can book an appointment directly from a service.</Paragraph>
          </div>
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

      <Space style={{ display: 'flex', marginBottom: 12 }} wrap>
        <Input.Search
          placeholder="Search services"
          allowClear
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={setQuery}
          style={{ maxWidth: 360 }}
        />
        <Select
          placeholder="Filter by department"
          allowClear
          showSearch
          value={departmentId}
          onChange={(v) => setDepartmentId(v)}
          style={{ minWidth: 220 }}
          optionFilterProp="children"
        >
          {departments.map(d => (
            <Option key={d.id} value={d.id}>{d.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Status"
          allowClear
          value={status}
          onChange={(v) => setStatus(v)}
          style={{ minWidth: 160 }}
        >
          {statusOptions.map(o => (
            <Option key={o.value} value={o.value}>{o.label}</Option>
          ))}
        </Select>
      </Space>

      {loading && <Spin />}
      {error && (
        <Alert 
          type="info" 
          showIcon 
          message="Demo Mode" 
          description={error}
          style={{ marginBottom: 12 }} 
        />
      )}

      {loading && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={[...Array(6)].map((_, i) => i)}
          renderItem={(i) => (
            <List.Item>
              <GlowCard>
                <Skeleton active paragraph={{ rows: 2 }} />
              </GlowCard>
            </List.Item>
          )}
        />
      )}

      {!loading && (
        <>
          <List
            grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
            dataSource={services.slice((page - 1) * pageSize, page * pageSize)}
            locale={{ emptyText: 'No services found' }}
            renderItem={(svc) => (
              <List.Item>
                <GlowCard
                  title={
                    <Space>
                      {iconFor(svc)}
                      <span>{svc.name}</span>
                      {svc.status && (
                        <Tag color={svc.status === 'active' ? 'green' : svc.status === 'maintenance' ? 'orange' : 'red'}>
                          {svc.status}
                        </Tag>
                      )}
                    </Space>
                  }
                >
                  <Paragraph italic type="secondary" style={{ minHeight: 44 }}>
                    {svc.description || 'No description provided.'}
                  </Paragraph>
                  <Space style={{ marginBottom: 8 }}>
                    {typeof svc.averageDuration === 'number' && (
                      <Tag color="blue">Avg. {svc.averageDuration} min</Tag>
                    )}
                    {svc.department && (
                      <Tag>{svc.department.name}</Tag>
                    )}
                  </Space>
                  <Space>
                    <Link to={`/appointments/book?serviceId=${encodeURIComponent(svc.id)}`}>
                      <Button type="primary">Book this service</Button>
                    </Link>
                    {svc.department?.id && (
                      <Link to={`/doctors?dept=${encodeURIComponent(svc.department.name)}`}>
                        <Button>Find doctors</Button>
                      </Link>
                    )}
                  </Space>
                </GlowCard>
              </List.Item>
            )}
          />
          {services.length > pageSize && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={services.length}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </Page>
  );
};

export default Services;
