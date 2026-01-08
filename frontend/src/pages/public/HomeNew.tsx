import React, { useEffect, useState, useRef } from 'react';
import { Button, Card, Row, Col, Typography, Space, Avatar, Rate, Carousel } from 'antd';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import {
  HeartOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  SmileOutlined,
  CheckCircleOutlined,
  RightOutlined,
  LeftOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import { colors } from '../../themes/publicTheme';

const { Title, Paragraph, Text } = Typography;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
`;

// Hero Section with Gradient Overlay
const HeroSection = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  background: linear-gradient(135deg, ${colors.maroon[500]} 0%, transparent 70%),
              url('https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&q=80') center/cover;
  border-radius: 0;
  overflow: hidden;
  margin-bottom: 0;
  display: flex;
  align-items: center;
  animation: ${fadeIn} 1s ease-out;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, ${colors.maroon[700]} 0%, transparent 100%);
    opacity: 0.9;
  }

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 600px;
    padding: 0 64px;
    color: white;
    animation: ${slideIn} 1s ease-out 0.3s both;
  }

  h1 {
    font-size: 48px;
    font-weight: 700;
    color: white !important;
    margin-bottom: 16px;
    line-height: 1.2;
  }

  p {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.95);
    margin-bottom: 32px;
  }

  .hero-links {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 24px;
  }

  @media (max-width: 768px) {
    height: 100vh;
    min-height: 500px;
    .hero-content {
      padding: 0 24px;
    }
    h1 {
      font-size: 36px;
    }
  }
`;

// Department Card with Hover Effect
const DepartmentCard = styled(Card)`
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 24px rgba(220, 1, 89, 0.15);
  }

  .ant-card-cover {
    height: 200px;
    overflow: hidden;
    
    img {
      height: 100%;
      width: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
  }

  &:hover .ant-card-cover img {
    transform: scale(1.1);
  }

  .department-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0,0,0,0.7));
    padding: 16px;
    color: white;
    transform: translateY(100%);
    transition: transform 0.3s ease;
  }

  &:hover .department-overlay {
    transform: translateY(0);
  }
`;

// Location Card
const LocationCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px ${colors.teal[100]};
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
`;

// Testimonial Card
const TestimonialCard = styled(Card)`
  border-radius: 16px;
  background: linear-gradient(135deg, ${colors.maroon[50]} 0%, ${colors.teal[50]} 100%);
  border: none;
  height: 100%;
  min-height: 200px;
`;

// Statistics Section
const StatsSection = styled.section`
  background: linear-gradient(135deg, ${colors.teal[50]} 0%, ${colors.maroon[50]} 100%);
  padding: 64px 32px;
  border-radius: 16px;
  margin: 64px 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${colors.teal[400]};
  }
`;

const StatItem = styled.div`
  text-align: center;
  
  .stat-icon {
    font-size: 48px;
    color: ${colors.teal[400]};
    margin-bottom: 16px;
  }

  .stat-number {
    font-size: 42px;
    font-weight: 700;
    color: ${colors.maroon[500]};
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 16px;
    color: ${colors.neutral.text};
    font-weight: 500;
  }
`;

// Carousel Arrow Buttons
const CarouselArrow = styled.div<{ direction: 'left' | 'right' }>`
  position: absolute;
  top: 50%;
  ${props => props.direction}: 16px;
  transform: translateY(-50%);
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${colors.maroon[500]};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${colors.maroon[500]};
    transform: translateY(-50%) scale(1.1);
  }
`;

interface Department {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

interface Location {
  id: string;
  name: string;
  city: string;
  imageUrl?: string;
}

interface Testimonial {
  id: string;
  name: string;
  quote: string;
  rating: number;
  avatarUrl?: string;
}

const HomeNew: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const departmentCarouselRef = useRef<any>(null);
  const testimonialCarouselRef = useRef<any>(null);

  // Fallback data
  const fallbackDepartments: Department[] = [
    { id: '1', name: 'Cardiology', description: 'Heart care specialists', imageUrl: 'https://images.unsplash.com/photo-1628348068343-c6a848d2b6dd?w=400&q=80' },
    { id: '2', name: 'Neurology', description: 'Brain & nervous system', imageUrl: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=400&q=80' },
    { id: '3', name: 'Orthopedics', description: 'Bone & joint care', imageUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80' },
    { id: '4', name: 'Pediatrics', description: 'Child healthcare', imageUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&q=80' },
    { id: '5', name: 'Oncology', description: 'Cancer treatment', imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&q=80' },
    { id: '6', name: 'Dermatology', description: 'Skin care specialists', imageUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80' },
  ];

  const fallbackLocations: Location[] = [
    { id: '1', name: 'City Centre', city: 'Dublin', imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80' },
    { id: '2', name: 'Ballsbridge', city: 'Dublin', imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&q=80' },
    { id: '3', name: 'City Centre', city: 'Cork', imageUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80' },
    { id: '4', name: 'Eyre Square', city: 'Galway', imageUrl: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=400&q=80' },
  ];

  const fallbackTestimonials: Testimonial[] = [
    { id: '1', name: 'Rajesh Kumar', quote: 'From Ventilator to Recovery in 6 Weeks. The care I received was exceptional!', rating: 5 },
    { id: '2', name: 'Priya Sharma', quote: 'The doctors were attentive and the facilities are world-class. Highly recommend!', rating: 5 },
    { id: '3', name: 'Arun Patel', quote: 'Quick diagnosis and effective treatment. Thank you for saving my life!', rating: 5 },
    { id: '4', name: 'Meera Iyer', quote: 'Professional staff and modern equipment. Best hospital experience ever!', rating: 4 },
    { id: '5', name: 'Vikram Singh', quote: 'Compassionate care during my recovery. Forever grateful to the team!', rating: 5 },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes] = await Promise.all([
          api.get('/departments', { params: { page: 1, limit: 12, isActive: 'true' }, suppressErrorToast: true } as any),
        ]);
        
        const deptData = (deptRes.data?.data || deptRes.data || []) as Department[];
        setDepartments(deptData.length > 0 ? deptData : fallbackDepartments);
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

  return (
    <div style={{ background: '#fff' }}>
      {/* Hero Section */}
      <HeroSection>
        <div className="hero-content">
          <Title level={1}>Trusted Care. Globally Certified Hospital.</Title>
          <Paragraph>
            Delivering world-class treatment with compassion and innovation.
          </Paragraph>
          <div className="hero-links">
            <Link to="/doctors">
              <Text style={{ color: colors.teal[500], textDecoration: 'underline', fontSize: 16, fontWeight: 600 }}>
                Find a Doctor →
              </Text>
            </Link>
            <Link to="/appointments/book">
              <Button 
                type="primary" 
                size="large"
                style={{ 
                  background: colors.maroon[500],
                  borderColor: colors.maroon[500],
                  fontWeight: 600
                }}
              >
                Book Appointment
              </Button>
            </Link>
            <Link to="/emergency">
              <Text style={{ color: colors.teal[400], textDecoration: 'underline', fontSize: 16, fontWeight: 600 }}>
                Emergency Care →
              </Text>
            </Link>
          </div>
        </div>
      </HeroSection>

      {/* Departments / Centres of Excellence */}
      <section style={{ marginBottom: 64, position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: colors.maroon[500] }}>Centres of Excellence</Title>
          <Space>
            <CarouselArrow direction="left" onClick={() => departmentCarouselRef.current?.prev()}>
              <LeftOutlined />
            </CarouselArrow>
            <CarouselArrow direction="right" onClick={() => departmentCarouselRef.current?.next()}>
              <RightOutlined />
            </CarouselArrow>
          </Space>
        </div>
        
        <Carousel
          ref={departmentCarouselRef}
          autoplay
          autoplaySpeed={3000}
          dots={false}
          slidesToShow={4}
          slidesToScroll={1}
          responsive={[
            { breakpoint: 1200, settings: { slidesToShow: 3 } },
            { breakpoint: 768, settings: { slidesToShow: 2 } },
            { breakpoint: 480, settings: { slidesToShow: 1 } },
          ]}
        >
          {departments.map((dept) => (
            <div key={dept.id} style={{ padding: '0 8px' }}>
              <Link to={`/services?departmentId=${dept.id}`}>
                <DepartmentCard
                  hoverable
                  cover={
                    <div style={{ position: 'relative' }}>
                      <img alt={dept.name} src={dept.imageUrl || 'https://via.placeholder.com/400x200'} />
                      <div className="department-overlay">
                        <Text style={{ color: 'white', fontSize: 14 }}>{dept.description || 'Learn more'}</Text>
                        <div style={{ marginTop: 8 }}>
                          <Button 
                            size="small" 
                            style={{ 
                              background: colors.teal[500],
                              borderColor: colors.teal[500],
                              color: 'white'
                            }}
                          >
                            View Services
                          </Button>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <Card.Meta
                    title={<span style={{ color: colors.maroon[500], fontWeight: 600 }}>{dept.name}</span>}
                  />
                </DepartmentCard>
              </Link>
            </div>
          ))}
        </Carousel>
      </section>

      {/* Locations Section */}
      <section style={{ marginBottom: 64 }}>
        <Title level={2} style={{ marginBottom: 32, color: colors.maroon[500] }}>Our Locations</Title>
        <Row gutter={[24, 24]}>
          {locations.map((location) => (
            <Col key={location.id} xs={24} sm={12} md={6}>
              <LocationCard
                hoverable
                cover={<img alt={location.name} src={location.imageUrl || 'https://via.placeholder.com/300x180'} />}
              >
                <Card.Meta
                  title={<span style={{ fontWeight: 600 }}>{location.city} – {location.name}</span>}
                  avatar={<EnvironmentOutlined style={{ color: colors.teal[500], fontSize: 20 }} />}
                />
              </LocationCard>
            </Col>
          ))}
        </Row>
      </section>

      {/* Testimonials Section */}
      <section style={{ 
        marginBottom: 64, 
        background: `linear-gradient(135deg, ${colors.maroon[50]} 0%, ${colors.teal[50]} 100%)`,
        padding: '64px 32px',
        borderRadius: 16,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0, color: colors.maroon[500] }}>Patient Stories</Title>
          <Space>
            <CarouselArrow direction="left" onClick={() => testimonialCarouselRef.current?.prev()}>
              <LeftOutlined />
            </CarouselArrow>
            <CarouselArrow direction="right" onClick={() => testimonialCarouselRef.current?.next()}>
              <RightOutlined />
            </CarouselArrow>
          </Space>
        </div>

        <Carousel
          ref={testimonialCarouselRef}
          autoplay
          autoplaySpeed={4000}
          dots={true}
          slidesToShow={3}
          slidesToScroll={1}
          responsive={[
            { breakpoint: 1024, settings: { slidesToShow: 2 } },
            { breakpoint: 640, settings: { slidesToShow: 1 } },
          ]}
        >
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} style={{ padding: '0 12px' }}>
              <TestimonialCard>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Space>
                    <Avatar 
                      size={56} 
                      src={testimonial.avatarUrl} 
                      icon={!testimonial.avatarUrl && <UserOutlined />}
                      style={{ background: colors.teal[400] }}
                    />
                    <div>
                      <Text strong style={{ fontSize: 16 }}>{testimonial.name}</Text>
                      <div><Rate disabled value={testimonial.rating} style={{ fontSize: 14 }} /></div>
                    </div>
                  </Space>
                  <Paragraph style={{ margin: 0, fontStyle: 'italic', color: colors.neutral.text }}>
                    "{testimonial.quote}"
                  </Paragraph>
                  <Button 
                    type="link" 
                    style={{ padding: 0, color: colors.maroon[500], fontWeight: 600 }}
                  >
                    Read Full Story →
                  </Button>
                </Space>
              </TestimonialCard>
            </div>
          ))}
        </Carousel>
      </section>

      {/* Statistics Section */}
      <StatsSection>
        <Row gutter={[32, 32]}>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon">🏥</div>
              <div className="stat-number">12</div>
              <div className="stat-label">Hospitals</div>
            </StatItem>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-number">500+</div>
              <div className="stat-label">Doctors</div>
            </StatItem>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon">💉</div>
              <div className="stat-number">50,000+</div>
              <div className="stat-label">Successful Surgeries</div>
            </StatItem>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatItem>
              <div className="stat-icon">😊</div>
              <div className="stat-number">10,00,000+</div>
              <div className="stat-label">Happy Patients per Year</div>
            </StatItem>
          </Col>
        </Row>
      </StatsSection>
    </div>
  );
};

export default HomeNew;
