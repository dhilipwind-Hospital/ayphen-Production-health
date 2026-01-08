import React from 'react';
import { Typography, Card, Row, Col, List, Tag, Divider, Statistic, Avatar } from 'antd';
import styled from 'styled-components';
import { HeartOutlined, SafetyCertificateOutlined, TeamOutlined, StarFilled, LikeOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const Hero = styled.section`
  position: relative;
  background: radial-gradient(1200px 600px at 10% -10%, rgba(14,165,233,0.18), transparent),
              radial-gradient(1000px 500px at 90% 0%, rgba(34,197,94,0.15), transparent),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  overflow: hidden;
  padding: 40px 28px;
  margin-bottom: 24px;
  .title { display: flex; align-items: center; gap: 12px; }
  .subtitle { color: #334155; }
`;

const About: React.FC = () => {
  return (
    <div>
      <Hero>
        <div className="title">
          <HeartOutlined style={{ color: '#ef4444', fontSize: 28 }} />
          <Title level={2} style={{ margin: 0 }}>Compassionate Care. Trusted Outcomes.</Title>
        </div>
        <Paragraph className="subtitle" style={{ marginTop: 8 }}>
          A modern, patient-first hospital combining clinical excellence with heartfelt compassion. We’re here for you 24/7.
        </Paragraph>
      </Hero>

      <Card>
        <Title level={2}>About Our Hospital</Title>
        <Paragraph>
          We are a patient-first, research-driven healthcare system delivering high-quality care with compassion, integrity, and innovation.
          Our teams bring together leading specialists, modern technology, and evidence-based protocols to help you and your family live healthier lives.
        </Paragraph>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Title level={4}>Our Mission</Title>
            <List
              size="small"
              dataSource={[
                'Deliver safe, reliable, and accessible care to every patient, every time.',
                'Advance medicine through research, innovation, and education.',
                'Partner with our communities to promote preventive health.',
              ]}
              renderItem={(i) => <List.Item style={{ paddingLeft: 0 }}>• {i}</List.Item>}
            />
          </Col>
          <Col xs={24} md={8}>
            <Title level={4}>Vision & Values</Title>
            <List
              size="small"
              dataSource={[
                'Compassion and respect for every individual',
                'Clinical excellence and continuous improvement',
                'Integrity, transparency, and accountability',
                'Innovation and teamwork',
                'Equity, diversity, and inclusion',
              ]}
              renderItem={(i) => <List.Item style={{ paddingLeft: 0 }}>• {i}</List.Item>}
            />
          </Col>
          <Col xs={24} md={8}>
            <Title level={4}>Accreditations</Title>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="blue">NABH</Tag>
              <Tag color="geekblue">ISO 9001:2015</Tag>
              <Tag color="purple">HIPAA-ready</Tag>
              <Tag color="green">NABL (Diagnostics)</Tag>
            </div>
          </Col>
        </Row>

        <Divider />

        <Title level={4}>Centers of Excellence</Title>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={[
            'Cardiology & Heart Failure Clinic',
            'Orthopedics & Sports Medicine',
            'Mother & Child (Obstetrics, Pediatrics, NICU)',
            'Oncology (Day-care Chemo, Radiation Planning)',
            'Neurology & Stroke Program',
            'Gastroenterology & Liver Clinic',
          ]}
          renderItem={(name) => (
            <List.Item>
              <Card size="small"><Text strong>{name}</Text></Card>
            </List.Item>
          )}
        />

        <Divider />

        <Title level={4}>Why Patients Trust Us</Title>
        <List
          dataSource={[
            'Multidisciplinary teams for complex conditions',
            '24/7 Emergency, ICU, Pharmacy, and Lab services',
            'Digital medical records and seamless patient portal',
            'Strict infection control and medication safety protocols',
            'Personalized care plans and dedicated patient coordinators',
          ]}
          renderItem={(i) => <List.Item style={{ paddingLeft: 0 }}>• {i}</List.Item>}
        />

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Card><Statistic title="Specialists" value={200} suffix="+" /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="Surgeries / Year" value={5000} suffix="+" /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="Patient Satisfaction" value={98} suffix="%" /></Card>
          </Col>
          <Col xs={12} md={6}>
            <Card><Statistic title="ER Triage (Avg)" value={15} suffix="min" /></Card>
          </Col>
        </Row>

        <Divider />

        <Title level={4}>Awards & Recognitions</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card size="small">
              <SpaceBetween>
                <SafetyCertificateOutlined style={{ color: '#10b981' }} />
                <Text strong>Quality Excellence Award (2024)</Text>
              </SpaceBetween>
              <Paragraph style={{ marginTop: 8 }}>Recognized for patient safety, infection control, and clinical quality indicators.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <SpaceBetween>
                <StarFilled style={{ color: '#f59e0b' }} />
                <Text strong>Top Patient Experience</Text>
              </SpaceBetween>
              <Paragraph style={{ marginTop: 8 }}>Consistently rated among the best hospitals for compassionate, coordinated care.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <SpaceBetween>
                <LikeOutlined style={{ color: '#3b82f6' }} />
                <Text strong>Community Impact Award</Text>
              </SpaceBetween>
              <Paragraph style={{ marginTop: 8 }}>Honored for outreach, screenings, and health education initiatives.</Paragraph>
            </Card>
          </Col>
        </Row>

        <Divider />

        <Title level={4}>Leadership Team</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Card>
              <Avatar size={48} style={{ backgroundColor: '#0ea5e9' }}>AK</Avatar>
              <Title level={5} style={{ marginTop: 12 }}>Dr. Ananya Kapoor</Title>
              <Text type="secondary">Chief Medical Officer</Text>
              <Paragraph style={{ marginTop: 8 }}>Leads clinical excellence, safety, and quality improvement across specialties.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Avatar size={48} style={{ backgroundColor: '#22c55e' }}>RS</Avatar>
              <Title level={5} style={{ marginTop: 12 }}>Rahul Sen</Title>
              <Text type="secondary">Chief Operating Officer</Text>
              <Paragraph style={{ marginTop: 8 }}>Oversees day-to-day operations and patient experience initiatives.</Paragraph>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Avatar size={48} style={{ backgroundColor: '#a855f7' }}>NM</Avatar>
              <Title level={5} style={{ marginTop: 12 }}>Neha Mehta</Title>
              <Text type="secondary">Director, Nursing</Text>
              <Paragraph style={{ marginTop: 8 }}>Champions compassionate nursing care and evidence-based practice.</Paragraph>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

const SpaceBetween = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export default About;
