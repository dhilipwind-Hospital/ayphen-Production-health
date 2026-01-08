import React, { useState, useEffect } from 'react';
import { Layout, Menu, theme, Button, Input, Dropdown, Space } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  PhoneOutlined, 
  SearchOutlined, 
  EnvironmentOutlined,
  DownOutlined 
} from '@ant-design/icons';
import Logo from './Logo';
import ChatWidget from './ChatWidget';
import { useSettings } from '../contexts/SettingsContext';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { colors } from '../themes/publicTheme';

const { Header, Content, Footer } = Layout;
const { Search } = Input;

const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const selected = location.pathname;
  const { settings } = useSettings();
  
  // Use keyboard shortcuts
  useKeyboardShortcuts();
  
  // Apply settings when component mounts or settings change
  useEffect(() => {
    // Apply theme class to layout
    const layoutElement = document.querySelector('.public-layout');
    if (layoutElement) {
      // Remove existing theme classes
      layoutElement.classList.remove('theme-light', 'theme-dark');
      
      // Apply new theme class
      layoutElement.classList.add(`theme-${settings.theme}`);
      
      // Apply font size
      layoutElement.classList.remove('font-small', 'font-medium', 'font-large');
      layoutElement.classList.add(`font-${settings.fontSize}`);
      
      // Apply accessibility settings
      if (settings.accessibility.highContrastMode) {
        layoutElement.classList.add('high-contrast');
      } else {
        layoutElement.classList.remove('high-contrast');
      }
      
      if (settings.accessibility.reducedMotion) {
        layoutElement.classList.add('reduced-motion');
      } else {
        layoutElement.classList.remove('reduced-motion');
      }
      
      if (settings.accessibility.largeText) {
        layoutElement.classList.add('large-text');
      } else {
        layoutElement.classList.remove('large-text');
      }
    }
  }, [settings]);

  const keyFromPath = () => {
    const p = location.pathname;
    if (p.startsWith('/about')) return 'about';
    if (p.startsWith('/departments')) return 'departments';
    if (p.startsWith('/doctors') || p.startsWith('/find-doctor')) return 'find-doctor';
    if (p.startsWith('/appointments')) return 'appointments';
    if (p.startsWith('/emergency')) return 'emergency';
    if (p.startsWith('/request-callback')) return 'request-callback';
    if (p.startsWith('/health-packages')) return 'health-packages';
    if (p.startsWith('/services')) return 'services';
    if (p.startsWith('/insurance')) return 'insurance';
    if (p.startsWith('/announcements')) return 'announcements';
    if (p.startsWith('/register')) return 'register';
    return 'home';
  };

  // Emergency locations dropdown
  const emergencyLocations = [
    { name: 'Chennai - Vadapalani', phone: '+91 44 1234 5678' },
    { name: 'Chennai - T Nagar', phone: '+91 44 2345 6789' },
    { name: 'Bangalore - Koramangala', phone: '+91 80 3456 7890' },
    { name: 'Hyderabad - Banjara Hills', phone: '+91 40 4567 8901' },
    { name: 'Dublin - Ireland', phone: '+353 1 234 5678' },
    { name: 'Cork - Ireland', phone: '+353 21 456 7890' },
  ];

  const emergencyMenuItems = emergencyLocations.map((loc, idx) => ({
    key: `emergency-${idx}`,
    label: (
      <div style={{ padding: '12px 16px', minWidth: 250 }}>
        <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: 15, marginBottom: 6 }}>{loc.name}</div>
        <a 
          href={`tel:${loc.phone.replace(/\s/g, '')}`}
          style={{ color: '#ec407a', fontSize: 16, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <PhoneOutlined style={{ fontSize: 14 }} /> {loc.phone}
        </a>
      </div>
    ),
  }));

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(value)}`);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
          
          @keyframes ripple {
            0% { transform: scale(0); opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
          }
          
          .enhanced-button {
            position: relative;
            overflow: hidden;
          }
          
          .enhanced-button::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.5);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }
          
          .enhanced-button:active::before {
            width: 300px;
            height: 300px;
          }
          
          .emergency-button {
            color: #ec407a !important;
          }
          
          .emergency-button span {
            color: #ec407a !important;
          }
          
          .emergency-button .anticon {
            color: #ec407a !important;
          }
        `}
      </style>
      <Layout className="public-layout" style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Header matching reference image */}
      <Header 
        className="public-header" 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          background: '#fff', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          padding: '0 64px',
          height: 'auto',
          lineHeight: 'normal'
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 32,
          padding: '16px 0',
          maxWidth: 1600,
          margin: '0 auto'
        }}>
          {/* Logo with Brand Name */}
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${colors.pink[400]} 0%, ${colors.teal[400]} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: 24,
              fontWeight: 700
            }}>
              A
            </div>
            <div>
              <div style={{ 
                fontSize: 20, 
                fontWeight: 700, 
                color: colors.pink[400],
                lineHeight: 1.2
              }}>
                AyphenHospital
              </div>
              <div style={{ 
                fontSize: 11, 
                color: colors.teal[400],
                fontWeight: 500,
                letterSpacing: '0.5px'
              }}>
                Excellence in Healthcare
              </div>
            </div>
          </Link>

          {/* Search Bar */}
          <Search
            placeholder="Search doctors, specialties, or locations"
            onSearch={handleSearch}
            style={{ 
              maxWidth: 450, 
              flex: 1,
            }}
            size="large"
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            styles={{
              input: {
                borderRadius: 24,
              }
            }}
          />

          {/* Action Buttons */}
          <Space size={10}>
            <Link to="/doctors">
              <Button 
                type="primary" 
                size="large"
                style={{ 
                  background: colors.pink[400],
                  borderColor: colors.pink[400],
                  fontWeight: 600,
                  borderRadius: 24,
                  padding: '0 24px',
                  height: 44,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(236, 64, 122, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(236, 64, 122, 0.4)';
                  e.currentTarget.style.background = colors.pink[600];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 64, 122, 0.3)';
                  e.currentTarget.style.background = colors.pink[400];
                }}
              >
                🩺 Find Doctor
              </Button>
            </Link>

            <Link to="/appointments/book">
              <Button 
                type="primary" 
                size="large"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.pink[400]} 0%, ${colors.pink[600]} 100%)`,
                  borderColor: colors.pink[400],
                  fontWeight: 600,
                  borderRadius: 24,
                  padding: '0 24px',
                  height: 44,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 12px rgba(236, 64, 122, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 64, 122, 0.4)';
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colors.pink[600]} 0%, ${colors.pink[700]} 100%)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 64, 122, 0.3)';
                  e.currentTarget.style.background = `linear-gradient(135deg, ${colors.pink[400]} 0%, ${colors.pink[600]} 100%)`;
                }}
              >
                📅 Book Appointment
              </Button>
            </Link>

            <Dropdown 
              menu={{ items: emergencyMenuItems }}
              placement="bottomRight"
              overlayStyle={{
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                borderRadius: 12,
                overflow: 'hidden'
              }}
            >
              <Button 
                size="large"
                className="emergency-button"
                icon={<PhoneOutlined style={{ fontSize: 16, color: '#ec407a' }} />}
                style={{
                  borderColor: '#ec407a',
                  color: '#ec407a',
                  fontWeight: 600,
                  borderRadius: 24,
                  padding: '0 20px',
                  height: 44,
                  background: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 8px rgba(236, 64, 122, 0.2)',
                  border: '2px solid #ec407a',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = '#ec407a';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = '#ec407a';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(236, 64, 122, 0.4)';
                  // Change icon color on hover
                  const icon = e.currentTarget.querySelector('.anticon-phone') as HTMLElement;
                  if (icon) {
                    icon.style.color = 'white';
                    icon.style.animation = 'pulse 0.6s ease-in-out';
                  }
                  // Change span color on hover
                  const span = e.currentTarget.querySelector('span') as HTMLElement;
                  if (span) span.style.color = 'white';
                  // Change dropdown icon color
                  const dropdown = e.currentTarget.querySelector('.anticon-down') as HTMLElement;
                  if (dropdown) dropdown.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#ec407a';
                  e.currentTarget.style.borderColor = '#ec407a';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(236, 64, 122, 0.2)';
                  // Reset icon color
                  const icon = e.currentTarget.querySelector('.anticon-phone') as HTMLElement;
                  if (icon) icon.style.color = '#ec407a';
                  // Reset span color
                  const span = e.currentTarget.querySelector('span') as HTMLElement;
                  if (span) span.style.color = '#ec407a';
                  // Reset dropdown icon color
                  const dropdown = e.currentTarget.querySelector('.anticon-down') as HTMLElement;
                  if (dropdown) dropdown.style.color = '#ec407a';
                }}
              >
                <span style={{ color: '#ec407a !important' }}>🚨 Emergency</span> <DownOutlined style={{ fontSize: 12, marginLeft: 4, color: '#ec407a !important' }} />
              </Button>
            </Dropdown>

            <Link to="/request-callback">
              <Button 
                size="large"
                style={{
                  borderColor: '#e1e5e9',
                  color: '#64748b',
                  fontWeight: 600,
                  borderRadius: 24,
                  padding: '0 24px',
                  height: 44,
                  background: 'white',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  border: '2px solid #e1e5e9'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.borderColor = colors.pink[400];
                  e.currentTarget.style.color = colors.pink[400];
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(236, 64, 122, 0.15)';
                  e.currentTarget.style.background = colors.pink[50];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e1e5e9';
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.background = 'white';
                }}
              >
                💬 Contact Us
              </Button>
            </Link>

            {/* Enterprise SaaS CTA and Login only */}
            <Link to="/signup">
              <Button 
                size="large"
                style={{
                  borderColor: colors.teal[400],
                  color: colors.teal[400],
                  fontWeight: 600,
                  borderRadius: 24,
                  padding: '0 24px',
                  height: 44,
                  background: 'transparent',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.background = colors.teal[400];
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(78, 205, 196, 0.3)';
                  e.currentTarget.style.backgroundImage = 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = colors.teal[400];
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundImage = 'none';
                }}
              >
                🚀 Enterprise Demo
              </Button>
            </Link>

            <Link to="/login">
              <Button 
                type="primary"
                size="large"
                style={{ 
                  background: colors.pink[500],
                  borderColor: colors.pink[500],
                  fontWeight: 700,
                  borderRadius: 24,
                  padding: '0 24px',
                  height: 44
                }}
              >
                Login
              </Button>
            </Link>
          </Space>
        </div>
      </Header>
      <Content style={{ padding: '0', background: '#fff' }}>
        {children}
        {/* Global floating AI chat widget */}
        <ChatWidget />
      </Content>
      
      {/* New Figma Footer Design */}
      <Footer 
        style={{ 
          background: `linear-gradient(180deg, ${colors.pink[700]} 0%, ${colors.pink[600]} 100%)`,
          color: '#fff',
          padding: '48px 48px 24px'
        }}
      >
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Four Column Structure */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
            marginBottom: 32
          }}>
            {/* About Column */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>About</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 8 }}><Link to="/about" style={{ color: 'rgba(255,255,255,0.85)' }}>Overview</Link></li>
                <li style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Management Team</a></li>
                <li style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Careers</a></li>
                <li style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Press Releases</a></li>
              </ul>
            </div>

            {/* Centres of Excellence Column */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>Centres of Excellence</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 8 }}><Link to="/departments" style={{ color: 'rgba(255,255,255,0.85)' }}>Cardiology</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/departments" style={{ color: 'rgba(255,255,255,0.85)' }}>Neurology</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/departments" style={{ color: 'rgba(255,255,255,0.85)' }}>Orthopedics</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/departments" style={{ color: 'rgba(255,255,255,0.85)' }}>Oncology</Link></li>
              </ul>
            </div>

            {/* Specialties Column */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>Specialties</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 8 }}><Link to="/services" style={{ color: 'rgba(255,255,255,0.85)' }}>Fertility</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/services" style={{ color: 'rgba(255,255,255,0.85)' }}>Pediatrics</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/services" style={{ color: 'rgba(255,255,255,0.85)' }}>Dermatology</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/services" style={{ color: 'rgba(255,255,255,0.85)' }}>Ophthalmology</Link></li>
              </ul>
            </div>

            {/* Patients & Visitors Column */}
            <div>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>Patients & Visitors</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 8 }}><Link to="/appointments/book" style={{ color: 'rgba(255,255,255,0.85)' }}>Appointments</Link></li>
                <li style={{ marginBottom: 8 }}><Link to="/insurance" style={{ color: 'rgba(255,255,255,0.85)' }}>Insurance</Link></li>
                <li style={{ marginBottom: 8 }}><a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Visitor Guide</a></li>
                <li style={{ marginBottom: 8 }}><Link to="/emergency" style={{ color: 'rgba(255,255,255,0.85)' }}>Emergency</Link></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div style={{ 
            borderTop: '1px solid rgba(255,255,255,0.2)', 
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}>
            {/* Copyright & Links */}
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
              © {new Date().getFullYear()} Hospital Management System. All rights reserved.
              <span style={{ margin: '0 8px' }}>|</span>
              <a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Disclaimer</a>
              <span style={{ margin: '0 8px' }}>|</span>
              <a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Privacy Policy</a>
              <span style={{ margin: '0 8px' }}>|</span>
              <a href="#" style={{ color: 'rgba(255,255,255,0.85)' }}>Terms & Conditions</a>
            </div>

            {/* Social Icons */}
            <div>
              <span style={{ marginRight: 12, color: 'rgba(255,255,255,0.85)' }}>Stay Connected:</span>
              <Space size={12}>
                <a href="#" style={{ color: '#fff', fontSize: 18 }}>📘</a>
                <a href="#" style={{ color: '#fff', fontSize: 18 }}>🐦</a>
                <a href="#" style={{ color: '#fff', fontSize: 18 }}>📷</a>
                <a href="#" style={{ color: '#fff', fontSize: 18 }}>▶️</a>
              </Space>
            </div>
          </div>
        </div>
      </Footer>

      {/* Floating Chat Icon (Teal) */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: colors.teal[400],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        zIndex: 1000,
        color: '#fff',
        fontSize: 24
      }}>
        💬
      </div>
    </Layout>
    </>
  );
};

export default PublicLayout;
