import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, Row, Col, Typography, Space, Avatar, Carousel } from 'antd';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  LeftOutlined,
  RightOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { colors } from '../../themes/publicTheme';

const { Title, Paragraph, Text } = Typography;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Hero Section matching reference image
const HeroSection = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  background: ${colors.maroon[500]};
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  animation: ${fadeIn} 1s ease-out;

  .hero-left {
    padding: 64px 80px;
    color: white;
    z-index: 2;
  }

  .hero-right {
    position: relative;
    height: 100%;
    min-height: 100%;
    background: url('https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&q=80') center/cover;
    
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, ${colors.maroon[500]} 0%, transparent 30%);
    }
  }

  h1 {
    font-size: 42px;
    font-weight: 700;
    color: white !important;
    margin-bottom: 16px;
    line-height: 1.3;
  }

  p {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 32px;
    line-height: 1.6;
  }

  .hero-buttons {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 600px;
    .hero-right {
      min-height: 400px;
    }
    .hero-left {
      padding: 48px 32px;
    }
  }
`;

// AI-inspired Centre Card with glassmorphism
const CentreCard = styled(Card)<{ index?: number; accentColor?: string }>`
  border-radius: 24px;
  overflow: visible;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  opacity: 0;
  animation: fadeInUp 0.8s ease-out forwards;
  animation-delay: ${props => (props.index || 0) * 0.12}s;
  position: relative;
  height: 280px;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(60px) scale(0.85) rotateX(10deg);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1) rotateX(0deg);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes glow {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  @keyframes scan {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(300%);
    }
  }

  &:hover {
    transform: translateY(-20px) scale(1.03);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.15);
    
    .dept-icon {
      transform: scale(1.15) rotate(5deg);
      filter: drop-shadow(0 8px 16px ${props => props.accentColor}40);
    }
    
    .dept-name {
      color: ${props => props.accentColor || '#d91f5e'};
      transform: translateY(-5px);
    }

    .glow-orb {
      opacity: 1;
      animation: glow 2s ease-in-out infinite;
    }

    .scan-line {
      animation: scan 2s ease-in-out infinite;
    }

    .ai-particles {
      opacity: 1;
    }

    &::after {
      opacity: 1;
    }
  }

  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 24px;
    padding: 2px;
    background: linear-gradient(135deg, ${props => props.accentColor || '#d91f5e'}40, transparent, ${props => props.accentColor || '#d91f5e'}20);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0;
    transition: opacity 0.5s;
    z-index: -1;
  }

  &:hover::before {
    opacity: 1;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 24px;
    background: linear-gradient(135deg, ${props => props.accentColor || '#d91f5e'}08, transparent);
    opacity: 0;
    transition: opacity 0.5s;
    pointer-events: none;
  }

  .ant-card-body {
    padding: 32px 24px;
    height: 100%;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    border-radius: 24px;
  }

  .glow-orb {
    position: absolute;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: radial-gradient(circle, ${props => props.accentColor || '#d91f5e'}15, transparent 70%);
    top: -100px;
    right: -100px;
    opacity: 0;
    transition: opacity 0.5s;
    pointer-events: none;
  }

  .scan-line {
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${props => props.accentColor || '#d91f5e'}60, transparent);
    top: 0;
    left: 0;
    opacity: 0;
    pointer-events: none;
  }

  .ai-particles {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.5s;
    pointer-events: none;
    
    &::before, &::after {
      content: '';
      position: absolute;
      width: 4px;
      height: 4px;
      background: ${props => props.accentColor || '#d91f5e'};
      border-radius: 50%;
      animation: float 3s ease-in-out infinite;
    }
    
    &::before {
      top: 20%;
      left: 15%;
      animation-delay: 0s;
    }
    
    &::after {
      bottom: 30%;
      right: 20%;
      animation-delay: 1.5s;
    }
  }

  .dept-icon {
    font-size: 80px;
    margin-bottom: 24px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.1));
    z-index: 2;
    position: relative;
  }

  .dept-name {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    text-align: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 2;
    letter-spacing: 0.3px;
    position: relative;
    }
  }

  &:hover .ant-card-cover::before {
    opacity: 1;
  }

  &:hover .ant-card-cover img {
    transform: scale(1.15) rotate(2deg);
  }

  .ant-card-body {
    padding: 16px;
    text-align: center;
    background: ${colors.maroon[500]};
    color: white;
    font-weight: 600;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s ease;
    }
  }

  &:hover .ant-card-body {
    background: ${colors.maroon[600]};
    letter-spacing: 0.5px;
  }

  &:hover .ant-card-body::before {
    left: 100%;
  }
`;

// Location Card
const LocationCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e8e8e8;

  &:hover {
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
    transform: translateY(-4px);
  }

  .ant-card-cover {
    height: 180px;
    overflow: hidden;

    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
    }
  }

  .ant-card-body {
    padding: 16px;
  }

  .location-title {
    font-weight: 600;
    font-size: 15px;
    margin-bottom: 4px;
  }

  .location-subtitle {
    color: #666;
    font-size: 13px;
  }
`;

// Testimonial Section
const TestimonialSection = styled.section`
  background: linear-gradient(135deg, #FFF5F8 0%, #F0F9FF 100%);
  padding: 64px 48px;
  border-radius: 16px;
  margin: 64px 0;
  position: relative;
`;

const TestimonialCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  position: relative;
  max-width: 800px;
  margin: 0 auto;

  .quote-mark {
    position: absolute;
    top: 24px;
    right: 24px;
    font-size: 64px;
    color: ${colors.maroon[100]};
    font-family: Georgia, serif;
    line-height: 1;
  }

  .testimonial-content {
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }

  .testimonial-text {
    flex: 1;
  }

  .testimonial-title {
    font-size: 20px;
    font-weight: 700;
    color: ${colors.maroon[500]};
    margin-bottom: 16px;
  }

  .testimonial-quote {
    font-size: 15px;
    line-height: 1.8;
    color: #333;
    margin-bottom: 16px;
  }
`;

// Statistics Section
const StatsSection = styled.section`
  background: linear-gradient(135deg, ${colors.teal[50]} 0%, #F0F9FF 100%);
  padding: 64px 32px;
  border-radius: 16px;
  margin: 64px 0;
`;

const StatItem = styled.div`
  text-align: center;
  
  .stat-icon-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: ${colors.teal[400]};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    font-size: 36px;
  }

  .stat-number {
    font-size: 36px;
    font-weight: 700;
    color: ${colors.maroon[500]};
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    color: #666;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

// Navigation Arrows
const NavArrow = styled.div<{ direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${props => props.direction}: -60px;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: white;
  border: 2px solid ${colors.maroon[500]};
  color: ${colors.maroon[500]};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;

  &:hover {
    background: ${colors.maroon[500]};
    color: white;
  }

  @media (max-width: 1200px) {
    ${props => props.direction}: 16px;
  }
`;

interface Department {
  id: string;
  name: string;
  imageUrl?: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
  address?: string;
  imageUrl?: string;
}

interface Testimonial {
  id: string;
  title: string;
  name: string;
  quote: string;
  avatarUrl?: string;
}

const HomeReference: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Fallback data matching reference image
  const fallbackDepartments: Department[] = [
    { id: '1', name: 'Neurology', imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80' },
    { id: '2', name: 'Oncology', imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80' },
    { id: '3', name: 'Paediatrics', imageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&q=80' },
    { id: '4', name: 'Emergency Medicine', imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80' },
  ];

  const fallbackLocations: Location[] = [
    { id: '1', name: 'City Centre', city: 'Dublin', address: '1 O\'Connell Street', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80' },
    { id: '2', name: 'Ballsbridge', city: 'Dublin', address: '52 Merrion Road', imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80' },
    { id: '3', name: 'City Centre', city: 'Cork', address: '154 Patrick Street', imageUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80' },
    { id: '4', name: 'Eyre Square', city: 'Galway', address: 'University Road', imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400&q=80' },
    { id: '5', name: 'Blackrock', city: 'Dublin', address: 'Main Street', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80' },
    { id: '6', name: 'City Centre', city: 'Limerick', address: 'O\'Connell Avenue', imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80' },
  ];

  const fallbackTestimonials: Testimonial[] = [
    { 
      id: '1', 
      title: 'From Ventilator to Recovery in 6 Weeks',
      name: 'Rajesh Kumar', 
      quote: 'I was admitted with severe respiratory issues and the doctors here saved my life. The care, attention, and expertise of the medical team was exceptional. Within 6 weeks, I went from being on a ventilator to walking out of the hospital completely recovered. Forever grateful!',
      avatarUrl: 'https://i.pravatar.cc/150?img=12'
    },
    { 
      id: '2', 
      title: 'Successful Heart Surgery at 75',
      name: 'Meera Iyer', 
      quote: 'At 75, I was scared about heart surgery. But the cardiology team here made me feel safe and confident. The surgery was successful and the post-operative care was outstanding. I\'m now living a healthy, active life thanks to this wonderful hospital.',
      avatarUrl: 'https://i.pravatar.cc/150?img=45'
    },
    { 
      id: '3', 
      title: 'Cancer-Free After Treatment',
      name: 'Arun Patel', 
      quote: 'Being diagnosed with cancer was devastating, but the oncology department gave me hope. The doctors, nurses, and support staff were with me every step of the way. Today, I\'m cancer-free and grateful for the world-class treatment I received here.',
      avatarUrl: 'https://i.pravatar.cc/150?img=33'
    },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes] = await Promise.all([
          api.get('/departments', { params: { page: 1, limit: 4, isActive: 'true' }, suppressErrorToast: true } as any),
        ]);
        
        const deptData = (deptRes.data?.data || deptRes.data || []) as Department[];
        setDepartments(deptData.length > 0 ? deptData.slice(0, 4) : fallbackDepartments);
        setLocations(fallbackLocations);
        setTestimonials(fallbackTestimonials);
      } catch (error) {
        setDepartments(fallbackDepartments);
        setLocations(fallbackLocations);
        setTestimonials(fallbackTestimonials);
      }
    };
    loadData();
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTest = testimonials[currentTestimonial] || fallbackTestimonials[0];

  return (
    <div style={{ background: '#fff' }}>
      {/* Hero Section */}
      <HeroSection>
        <div className="hero-left">
          <Title level={1}>Trusted Care. Globally Certified Hospital.</Title>
          <Paragraph>
            We are committed to providing world-class healthcare services with compassion, 
            innovation, and excellence. Your health and well-being are our top priorities.
          </Paragraph>
          <div className="hero-buttons">
            <Link to="/appointments/book">
              <Button 
                type="primary" 
                size="large"
                style={{ 
                  background: 'white',
                  borderColor: 'white',
                  color: colors.maroon[500],
                  fontWeight: 600,
                  minWidth: 160
                }}
              >
                Book Appointment
              </Button>
            </Link>
            <Link to="/emergency">
              <Button 
                size="large"
                className="hero-emergency-btn"
                style={{
                  borderColor: 'white',
                  color: colors.maroon[500],
                  background: 'white',
                  fontWeight: 600,
                  minWidth: 140,
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.maroon[500];
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = colors.maroon[500];
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(217, 31, 94, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = colors.maroon[500];
                  e.currentTarget.style.borderColor = 'white';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🚨 Emergency
              </Button>
            </Link>
            <Link to="/doctors">
              <Button 
                type="link"
                size="large"
                style={{
                  color: 'white',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Find a Doctor
              </Button>
            </Link>
          </div>
        </div>
        <div className="hero-right"></div>
      </HeroSection>

      {/* Content Container */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '64px 24px' }}>
        {/* Centres of Excellence */}
        <section style={{ marginBottom: 64 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2} style={{ color: colors.maroon[500], marginBottom: 8 }}>
            Centres of Excellence
          </Title>
          <Text style={{ color: '#666', fontSize: 15 }}>
            World-class medical care across specialties
          </Text>
        </div>
        
        <Row gutter={[24, 24]}>
          {departments.map((dept, index) => {
            const deptName = dept.name.toLowerCase();
            let icon = '🏥';
            let accentColor = '#d91f5e';
            
            // Department-specific icons and accent colors
            if (deptName.includes('cardio')) {
              icon = '❤️';
              accentColor = '#ef4444';
            } else if (deptName.includes('neuro')) {
              icon = '🧠';
              accentColor = '#8b5cf6';
            } else if (deptName.includes('ortho') || deptName.includes('bone')) {
              icon = '🦴';
              accentColor = '#f59e0b';
            } else if (deptName.includes('pediatric') || deptName.includes('child')) {
              icon = '👶';
              accentColor = '#06b6d4';
            } else if (deptName.includes('gynec') || deptName.includes('obstetric')) {
              icon = '👩‍⚕️';
              accentColor = '#ec4899';
            } else if (deptName.includes('oncology') || deptName.includes('cancer')) {
              icon = '🎗️';
              accentColor = '#6366f1';
            } else if (deptName.includes('gastro') || deptName.includes('digest')) {
              icon = '🫁';
              accentColor = '#10b981';
            } else if (deptName.includes('derma') || deptName.includes('skin')) {
              icon = '✨';
              accentColor = '#f472b6';
            } else if (deptName.includes('ent') || deptName.includes('ear')) {
              icon = '👂';
              accentColor = '#14b8a6';
            } else if (deptName.includes('ophthal') || deptName.includes('eye')) {
              icon = '👁️';
              accentColor = '#3b82f6';
            } else if (deptName.includes('dental') || deptName.includes('dent')) {
              icon = '🦷';
              accentColor = '#06b6d4';
            } else if (deptName.includes('emergency') || deptName.includes('trauma')) {
              icon = '🚑';
              accentColor = '#dc2626';
            }
            
            return (
              <Col key={dept.id} xs={24} sm={12} md={6}>
                <Link to={`/services?departmentId=${dept.id}`}>
                  <CentreCard index={index} accentColor={accentColor}>
                    <div className="glow-orb"></div>
                    <div className="scan-line"></div>
                    <div className="ai-particles"></div>
                    <div className="dept-icon">{icon}</div>
                    <div className="dept-name">{dept.name}</div>
                  </CentreCard>
                </Link>
              </Col>
            );
          })}
        </Row>
      </section>

      {/* Our Locations */}
      <section style={{ marginBottom: 64 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2} style={{ color: colors.maroon[500], marginBottom: 8 }}>
            Our Locations
          </Title>
          <Text style={{ color: '#666', fontSize: 15 }}>
            Find us across multiple cities
          </Text>
        </div>
        
        <Row gutter={[24, 24]}>
          {locations.map((location) => (
            <Col key={location.id} xs={24} sm={12} md={8}>
              <LocationCard hoverable>
                <div style={{ position: 'relative' }}>
                  <img alt={location.name} src={location.imageUrl || 'https://via.placeholder.com/400x180'} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
                </div>
                <div style={{ padding: 16 }}>
                  <div className="location-title">
                    <EnvironmentOutlined style={{ color: colors.maroon[500], marginRight: 8 }} />
                    {location.city} - {location.name}
                  </div>
                  {location.address && (
                    <div className="location-subtitle">{location.address}</div>
                  )}
                </div>
              </LocationCard>
            </Col>
          ))}
        </Row>
      </section>

      {/* Patient Stories */}
      <TestimonialSection>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2} style={{ color: colors.maroon[500], marginBottom: 8 }}>
            Patient Stories
          </Title>
          <Text style={{ color: '#666', fontSize: 15 }}>
            Real stories from real patients
          </Text>
        </div>

        <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto' }}>
          <NavArrow direction="left" onClick={prevTestimonial}>
            <LeftOutlined />
          </NavArrow>
          
          <TestimonialCard>
            <div className="quote-mark">"</div>
            <div className="testimonial-content">
              <Avatar 
                size={80} 
                src={currentTest.avatarUrl}
                style={{ flexShrink: 0, border: `3px solid ${colors.maroon[100]}` }}
              />
              <div className="testimonial-text">
                <div className="testimonial-title">{currentTest.title}</div>
                <div className="testimonial-quote">{currentTest.quote}</div>
                <Button 
                  type="primary" 
                  size="small"
                  style={{ 
                    background: colors.maroon[500],
                    borderColor: colors.maroon[500]
                  }}
                >
                  Read Full Story
                </Button>
              </div>
            </div>
          </TestimonialCard>

          <NavArrow direction="right" onClick={nextTestimonial}>
            <RightOutlined />
          </NavArrow>
        </div>

        {/* Dots indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {testimonials.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentTestimonial ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: idx === currentTestimonial ? colors.maroon[500] : '#ddd',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onClick={() => setCurrentTestimonial(idx)}
            />
          ))}
        </div>
      </TestimonialSection>

      {/* Our Impact */}
      <StatsSection>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={2} style={{ color: colors.maroon[500], marginBottom: 8 }}>
            Our Impact
          </Title>
          <Text style={{ color: '#666', fontSize: 15 }}>
            Making a difference in healthcare
          </Text>
        </div>

        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon-circle">🏥</div>
              <div className="stat-number">12</div>
              <div className="stat-label">Hospitals</div>
            </StatItem>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon-circle">👨‍⚕️</div>
              <div className="stat-number">500+</div>
              <div className="stat-label">Doctors</div>
            </StatItem>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon-circle">💉</div>
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Successful Surgeries</div>
            </StatItem>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon-circle">😊</div>
              <div className="stat-number">1,000,000+</div>
              <div className="stat-label">Happy Patients</div>
            </StatItem>
          </Col>
        </Row>
      </StatsSection>
      </div>
    </div>
  );
};

export default HomeReference;
