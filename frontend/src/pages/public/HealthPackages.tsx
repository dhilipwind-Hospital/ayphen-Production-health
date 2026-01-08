import React from 'react';
import { Card, Typography, List, Tag, Button, Row, Col } from 'antd';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { HeartOutlined, MedicineBoxOutlined, SmileOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

type Package = {
  id: string;
  name: string;
  price: string;
  tag?: string;
  highlights: string[];
};

const packages: Package[] = [
  {
    id: 'pkg-basic',
    name: 'Basic Health Check',
    price: '₹ 1,999',
    highlights: ['CBC', 'Fasting Blood Sugar', 'Lipid Profile', 'Urine Routine', 'Consultation']
  },
  {
    id: 'pkg-advanced',
    name: 'Advanced Wellness',
    price: '₹ 4,999',
    tag: 'Popular',
    highlights: ['CBC', 'Liver & Kidney Function', 'Thyroid Profile', 'Vitamin D & B12', 'ECG', 'Chest X-Ray']
  },
  {
    id: 'pkg-executive',
    name: 'Executive Package',
    price: '₹ 9,999',
    tag: 'Comprehensive',
    highlights: ['Complete Blood Work', 'Liver/Kidney/Thyroid', 'Cardiac Risk Markers', 'Stress Test (TMT)', 'Ultrasound Abdomen', 'Diet Counselling']
  },
  {
    id: 'pkg-heart',
    name: 'Heart Checkup',
    price: '₹ 5,999',
    tag: 'Cardiac',
    highlights: ['ECG', 'Echo', 'TMT', 'Lipid Profile', 'Cardiology Consult']
  },
  {
    id: 'pkg-diabetes',
    name: 'Diabetes Care',
    price: '₹ 3,499',
    tag: 'Chronic Care',
    highlights: ['Fasting/PP Sugar', 'HbA1c', 'Kidney Function', 'Foot Exam', 'Diet Counselling']
  },
  {
    id: 'pkg-senior',
    name: 'Senior Citizen Package',
    price: '₹ 6,999',
    tag: 'Age 60+',
    highlights: ['CBC', 'Thyroid', 'Vitamin D & B12', 'ECG', 'Bone Density (DEXA)', 'Physician Consult']
  },
];

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
  background: radial-gradient(1200px 600px at 10% -10%, rgba(14,165,233,0.18), transparent),
              radial-gradient(1000px 500px at 90% 0%, rgba(34,197,94,0.12), transparent),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px 20px;
  margin-bottom: 16px;
  display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; align-items: center;
  .art { position: relative; height: 90px; }
  .art span { position: absolute; font-size: 26px; opacity: 0.95; }
  .art .heart { left: 10px; top: 18px; color: #ef4444; animation: ${pulse} 2.2s ease-in-out infinite; }
  .art .box { left: 64px; top: 40px; color: #0ea5e9; animation: ${float} 3s ease-in-out infinite; }
  .art .smile { left: 116px; top: 14px; color: #22c55e; animation: ${float} 3.4s ease-in-out infinite; }
`;

const PkgCard = styled(Card)`
  transition: transform 160ms ease, box-shadow 160ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  }
`;

const HealthPackages: React.FC = () => {
  return (
    <div>
      <Hero>
        <div>
          <Title level={2} style={{ margin: 0 }}>Health Packages</Title>
          <Paragraph style={{ marginTop: 6 }}>Choose from curated preventive health packages designed by our experts.</Paragraph>
        </div>
        <div className="art" aria-hidden>
          <span className="heart"><HeartOutlined /></span>
          <span className="box"><MedicineBoxOutlined /></span>
          <span className="smile"><SmileOutlined /></span>
        </div>
      </Hero>
      <Row gutter={[16, 16]}>
        {packages.map((p) => (
          <Col key={p.id} xs={24} sm={12} md={8}>
            <PkgCard hoverable title={
              <>
                <Text strong>{p.name}</Text>
                {p.tag && <Tag color="blue" style={{ marginLeft: 8 }}>{p.tag}</Tag>}
              </>
            } extra={<Text strong>{p.price}</Text>}>
              <List
                size="small"
                dataSource={p.highlights}
                renderItem={(h) => <List.Item style={{ padding: '4px 0' }}>• {h}</List.Item>}
              />
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <Link to={`/appointments/book?package=${encodeURIComponent(p.name)}`}>
                  <Button type="primary">Book Now</Button>
                </Link>
                <Link to={`/request-callback?department=${encodeURIComponent('Health Packages')}&message=${encodeURIComponent('Enquiry about ' + p.name + ' package')}`}>
                  <Button>Enquire</Button>
                </Link>
              </div>
            </PkgCard>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default HealthPackages;
