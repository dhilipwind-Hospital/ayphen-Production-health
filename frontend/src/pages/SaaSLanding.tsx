import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MedicineBoxOutlined, 
  SafetyOutlined, 
  TeamOutlined, 
  CloudOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  GlobalOutlined,
  LockOutlined,
  ThunderboltOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { Button, Card, Row, Col, Typography, Space, Statistic } from 'antd';
import './SaaSLanding.css';

const { Title, Paragraph, Text } = Typography;

const SaaSLanding: React.FC = () => {
  useEffect(() => {
    // Simple inline scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all elements with scroll animation classes
    const animateElements = document.querySelectorAll(
      '.scroll-animate, .scroll-animate-card, .scroll-animate-stagger'
    );
    
    animateElements.forEach((element) => {
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="saas-landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <MedicineBoxOutlined style={{ fontSize: '32px', color: '#e91e63' }} />
            <span className="logo-text">Ayphen Care</span>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
            <Link to="/signup">
              <Button type="primary" size="large">Get Started</Button>
            </Link>
            <Link to="/login">
              <Button size="large">Login</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <RocketOutlined /> Trusted by 1000+ Hospitals Worldwide
            </div>
            <Title level={1} className="hero-title">
              Modern Hospital Management
              <br />
              <span className="gradient-text">Built for Scale</span>
            </Title>
            <Paragraph className="hero-description">
              Complete multi-tenant SaaS platform for hospitals. Manage patients, 
              doctors, appointments, pharmacy, laboratory, and more - all in one place.
            </Paragraph>
            <Space size="large" className="hero-buttons">
              <Link to="/signup">
                <Button type="primary" size="large" icon={<RocketOutlined />}>
                  Start Free Trial
                </Button>
              </Link>
              <Button size="large" ghost>
                Watch Demo
              </Button>
            </Space>
            <div className="hero-stats">
              <Statistic title="Active Hospitals" value={1000} suffix="+" />
              <Statistic title="Patients Served" value={500000} suffix="+" />
              <Statistic title="Uptime" value={99.9} suffix="%" />
            </div>
          </div>
          <div className="hero-image">
            <div className="floating-card card-1">
              <MedicineBoxOutlined style={{ fontSize: '48px', color: '#e91e63' }} />
              <Text strong>Multi-Tenant</Text>
            </div>
            <div className="floating-card card-2">
              <SafetyOutlined style={{ fontSize: '48px', color: '#f48fb1' }} />
              <Text strong>Secure & Compliant</Text>
            </div>
            <div className="floating-card card-3">
              <ThunderboltOutlined style={{ fontSize: '48px', color: '#ad1457' }} />
              <Text strong>Lightning Fast</Text>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}>Everything You Need to Run a Modern Hospital</Title>
            <Paragraph>
              Comprehensive features designed for healthcare excellence
            </Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <TeamOutlined className="feature-icon" />
                <Title level={4}>Patient Management</Title>
                <Paragraph>
                  Complete patient records, medical history, appointments, and more.
                  HIPAA compliant and secure.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <MedicineBoxOutlined className="feature-icon" />
                <Title level={4}>Multi-Department</Title>
                <Paragraph>
                  Manage multiple departments, services, and specializations with ease.
                  Complete workflow automation.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <SafetyOutlined className="feature-icon" />
                <Title level={4}>Pharmacy & Lab</Title>
                <Paragraph>
                  Integrated pharmacy management, lab orders, and results tracking.
                  Real-time inventory.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <CloudOutlined className="feature-icon" />
                <Title level={4}>Cloud-Based</Title>
                <Paragraph>
                  Access from anywhere, anytime. Automatic backups and 99.9% uptime
                  guarantee.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <LockOutlined className="feature-icon" />
                <Title level={4}>Data Security</Title>
                <Paragraph>
                  Enterprise-grade security with encryption, role-based access, and
                  audit logs.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="feature-card scroll-animate-card" hoverable>
                <GlobalOutlined className="feature-icon" />
                <Title level={4}>Multi-Tenant</Title>
                <Paragraph>
                  Each hospital gets their own isolated environment with custom
                  branding.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="section-container">
          <div className="section-header scroll-animate">
            <Title level={2}>Simple, Transparent Pricing</Title>
            <Paragraph>
              Choose the plan that's right for your hospital
            </Paragraph>
          </div>
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card scroll-animate-card">
                <div className="pricing-header">
                  <Title level={4}>Basic</Title>
                  <div className="pricing-price">
                    <span className="currency">$</span>
                    <span className="amount">99</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Up to 5 doctors</li>
                  <li><CheckCircleOutlined /> Up to 100 patients</li>
                  <li><CheckCircleOutlined /> Basic features</li>
                  <li><CheckCircleOutlined /> Email support</li>
                  <li><CheckCircleOutlined /> 5 GB storage</li>
                </ul>
                <Link to="/signup?plan=basic">
                  <Button type="default" size="large" block>
                    Start Free Trial
                  </Button>
                </Link>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card featured scroll-animate-card">
                <div className="popular-badge">Most Popular</div>
                <div className="pricing-header">
                  <Title level={4}>Professional</Title>
                  <div className="pricing-price">
                    <span className="currency">$</span>
                    <span className="amount">299</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Up to 20 doctors</li>
                  <li><CheckCircleOutlined /> Up to 1000 patients</li>
                  <li><CheckCircleOutlined /> All features</li>
                  <li><CheckCircleOutlined /> Priority support</li>
                  <li><CheckCircleOutlined /> 50 GB storage</li>
                  <li><CheckCircleOutlined /> Custom branding</li>
                </ul>
                <Link to="/signup?plan=professional">
                  <Button type="primary" size="large" block>
                    Start Free Trial
                  </Button>
                </Link>
              </Card>
            </Col>
            <Col xs={24} md={8} className="scroll-animate-stagger">
              <Card className="pricing-card scroll-animate-card">
                <div className="pricing-header">
                  <Title level={4}>Enterprise</Title>
                  <div className="pricing-price">
                    <span className="currency">$</span>
                    <span className="amount">999</span>
                    <span className="period">/month</span>
                  </div>
                </div>
                <ul className="pricing-features">
                  <li><CheckCircleOutlined /> Unlimited doctors</li>
                  <li><CheckCircleOutlined /> Unlimited patients</li>
                  <li><CheckCircleOutlined /> All features</li>
                  <li><CheckCircleOutlined /> Dedicated support</li>
                  <li><CheckCircleOutlined /> Unlimited storage</li>
                  <li><CheckCircleOutlined /> Custom domain</li>
                  <li><CheckCircleOutlined /> SLA guarantee</li>
                </ul>
                <Link to="/signup?plan=enterprise">
                  <Button type="default" size="large" block>
                    Contact Sales
                  </Button>
                </Link>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container scroll-animate">
          <Title level={2}>Ready to Transform Your Hospital?</Title>
          <Paragraph>
            Join 1000+ hospitals already using our platform. Start your free 30-day trial today.
          </Paragraph>
          <Space size="large">
            <Link to="/signup">
              <Button type="primary" size="large" icon={<RocketOutlined />}>
                Start Free Trial
              </Button>
            </Link>
            <Button size="large" icon={<CustomerServiceOutlined />}>
              Talk to Sales
            </Button>
          </Space>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <Row gutter={[32, 32]}>
            <Col xs={24} md={6}>
              <div className="footer-logo">
                <MedicineBoxOutlined style={{ fontSize: '32px', color: '#e91e63' }} />
                <span>Ayphen Care</span>
              </div>
              <Paragraph>
                Modern hospital management platform built for scale.
              </Paragraph>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Product</Title>
              <ul className="footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><Link to="/signup">Sign Up</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Company</Title>
              <ul className="footer-links">
                <li><a href="#about">About Us</a></li>
                <li><a href="#contact">Contact</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#blog">Blog</a></li>
              </ul>
            </Col>
            <Col xs={24} md={6}>
              <Title level={5}>Legal</Title>
              <ul className="footer-links">
                <li><a href="#privacy">Privacy Policy</a></li>
                <li><a href="#terms">Terms of Service</a></li>
                <li><a href="#security">Security</a></li>
                <li><a href="#compliance">Compliance</a></li>
              </ul>
            </Col>
          </Row>
          <div className="footer-bottom">
            <Text>© 2025 Ayphen Care. All rights reserved.</Text>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SaaSLanding;
