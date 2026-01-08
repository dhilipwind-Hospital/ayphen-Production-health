import React from 'react';
import { Card, Row, Col, Typography, Space, Avatar, Divider } from 'antd';
import { 
  MailOutlined, 
  PhoneOutlined, 
  LinkedinOutlined,
  TwitterOutlined 
} from '@ant-design/icons';
import { colors } from '../../themes/publicTheme';

const { Title, Paragraph, Text } = Typography;

interface TeamMember {
  id: string;
  name: string;
  position: string;
  department: string;
  bio: string;
  qualifications: string[];
  email: string;
  phone: string;
  image?: string;
  specialties: string[];
}

const ManagementTeam: React.FC = () => {
  const leadership: TeamMember[] = [
    {
      id: '1',
      name: 'Dr. Rajesh Kumar',
      position: 'Chief Executive Officer',
      department: 'Administration',
      bio: 'Dr. Kumar brings over 25 years of healthcare leadership experience, having transformed multiple healthcare institutions across India.',
      qualifications: ['MBBS', 'MBA Healthcare Management', 'Fellow - Hospital Administration'],
      email: 'rajesh.kumar@ayphenhospital.com',
      phone: '+91 98765 43210',
      specialties: ['Healthcare Strategy', 'Operational Excellence', 'Quality Management'],
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&q=80'
    },
    {
      id: '2',
      name: 'Dr. Priya Sharma',
      position: 'Chief Medical Officer',
      department: 'Medical Affairs',
      bio: 'Leading medical excellence initiatives with 20+ years in clinical practice and healthcare quality improvement.',
      qualifications: ['MBBS', 'MD Internal Medicine', 'Fellowship Quality & Patient Safety'],
      email: 'priya.sharma@ayphenhospital.com',
      phone: '+91 98765 43211',
      specialties: ['Clinical Excellence', 'Patient Safety', 'Medical Education'],
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&q=80'
    },
    {
      id: '3',
      name: 'Mr. Arun Patel',
      position: 'Chief Financial Officer',
      department: 'Finance',
      bio: 'Strategic financial leader with expertise in healthcare economics and sustainable growth strategies.',
      qualifications: ['CA', 'MBA Finance', 'CFA'],
      email: 'arun.patel@ayphenhospital.com',
      phone: '+91 98765 43212',
      specialties: ['Financial Strategy', 'Healthcare Economics', 'Investment Planning'],
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80'
    },
    {
      id: '4',
      name: 'Dr. Meera Iyer',
      position: 'Chief Nursing Officer',
      department: 'Nursing',
      bio: 'Passionate advocate for nursing excellence and patient care quality with 18 years of clinical experience.',
      qualifications: ['BSc Nursing', 'MSc Nursing Administration', 'PhD Nursing Leadership'],
      email: 'meera.iyer@ayphenhospital.com',
      phone: '+91 98765 43213',
      specialties: ['Nursing Excellence', 'Patient Care Quality', 'Staff Development'],
      image: 'https://images.unsplash.com/photo-1594824713868-0e5b13a6c4f9?w=300&q=80'
    },
    {
      id: '5',
      name: 'Mr. Vikram Singh',
      position: 'Chief Technology Officer',
      department: 'Information Technology',
      bio: 'Digital transformation leader implementing cutting-edge healthcare care solutions and AI innovations.',
      qualifications: ['B.Tech Computer Science', 'MBA Technology Management', 'AI/ML Certification'],
      email: 'vikram.singh@ayphenhospital.com',
      phone: '+91 98765 43214',
      specialties: ['Digital Health', 'AI in Healthcare', 'Technology Strategy'],
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80'
    },
    {
      id: '6',
      name: 'Dr. Kavitha Reddy',
      position: 'Chief Quality Officer',
      department: 'Quality & Accreditation',
      bio: 'Quality champion with extensive experience in healthcare accreditation and continuous improvement.',
      qualifications: ['MBBS', 'Diploma Hospital Administration', 'Six Sigma Black Belt'],
      email: 'kavitha.reddy@ayphenhospital.com',
      phone: '+91 98765 43215',
      specialties: ['Quality Assurance', 'Accreditation', 'Process Improvement'],
      image: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&q=80'
    }
  ];

  return (
    <div style={{ padding: '64px 48px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <Title level={1} style={{ color: colors.maroon[500], marginBottom: 16 }}>
          Leadership Team
        </Title>
        <Paragraph style={{ fontSize: 18, color: colors.neutral.text, maxWidth: 800, margin: '0 auto' }}>
          Meet the visionary leaders driving excellence in healthcare delivery and 
          innovation at AyphenHospital. Our leadership team combines decades of 
          medical expertise with strategic business acumen.
        </Paragraph>
      </div>

      {/* Team Grid */}
      <Row gutter={[32, 48]}>
        {leadership.map((member) => (
          <Col key={member.id} xs={24} md={12} lg={8}>
            <Card
              style={{
                height: '100%',
                borderRadius: 16,
                overflow: 'hidden',
                border: `1px solid #e6eef2`,
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: 24 }}
              hoverable
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Avatar
                  size={120}
                  src={member.image}
                  style={{
                    background: `linear-gradient(135deg, ${colors.maroon[400]} 0%, ${colors.teal[400]} 100%)`,
                    marginBottom: 16
                  }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Title level={4} style={{ margin: 0, color: colors.maroon[500] }}>
                  {member.name}
                </Title>
                <Text style={{ 
                  color: colors.teal[500], 
                  fontWeight: 600, 
                  fontSize: 16 
                }}>
                  {member.position}
                </Text>
                <br />
                <Text style={{ color: '#64748b', fontSize: 14 }}>
                  {member.department}
                </Text>
              </div>

              <Paragraph style={{ 
                color: colors.neutral.text, 
                fontSize: 14, 
                lineHeight: 1.6,
                marginBottom: 16 
              }}>
                {member.bio}
              </Paragraph>

              <Divider style={{ margin: '16px 0' }} />

              {/* Qualifications */}
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ color: colors.maroon[500], fontSize: 13 }}>
                  QUALIFICATIONS:
                </Text>
                <div style={{ marginTop: 4 }}>
                  {member.qualifications.map((qual, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: colors.teal[50],
                        color: colors.teal[500],
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        marginRight: 6,
                        marginBottom: 4
                      }}
                    >
                      {qual}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specialties */}
              <div style={{ marginBottom: 20 }}>
                <Text strong style={{ color: colors.maroon[500], fontSize: 13 }}>
                  EXPERTISE:
                </Text>
                <div style={{ marginTop: 4 }}>
                  {member.specialties.map((specialty, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: 'inline-block',
                        background: colors.maroon[50],
                        color: colors.maroon[600],
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 500,
                        marginRight: 6,
                        marginBottom: 4
                      }}
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MailOutlined style={{ color: colors.teal[500] }} />
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    {member.email}
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <PhoneOutlined style={{ color: colors.teal[500] }} />
                  <Text style={{ fontSize: 12, color: '#64748b' }}>
                    {member.phone}
                  </Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Vision Statement */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.maroon[50]} 0%, ${colors.teal[50]} 100%)`,
        padding: 48,
        borderRadius: 16,
        marginTop: 64,
        textAlign: 'center'
      }}>
        <Title level={2} style={{ color: colors.maroon[500], marginBottom: 24 }}>
          Our Leadership Vision
        </Title>
        <Paragraph style={{ 
          fontSize: 16, 
          color: colors.neutral.text, 
          maxWidth: 800, 
          margin: '0 auto',
          lineHeight: 1.8
        }}>
          "To build a healthcare ecosystem that seamlessly integrates clinical excellence, 
          technological innovation, and compassionate care. Our leadership is committed to 
          creating an environment where every patient receives world-class treatment while 
          our staff thrives in their professional journey."
        </Paragraph>
        <Text style={{ 
          color: colors.teal[500], 
          fontWeight: 600, 
          fontSize: 14,
          fontStyle: 'italic',
          marginTop: 16,
          display: 'block'
        }}>
          — AyphenHospital Leadership Team
        </Text>
      </div>
    </div>
  );
};

export default ManagementTeam;
