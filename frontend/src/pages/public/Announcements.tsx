import React, { useState, useEffect } from 'react';
import { Card, Typography, List, Tag, Row, Col, Divider, Timeline } from 'antd';
import styled, { keyframes } from 'styled-components';
import { NotificationOutlined, SoundOutlined, BulbOutlined, SafetyCertificateOutlined, HeartOutlined, SmileOutlined, MedicineBoxOutlined, UserOutlined, ScheduleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

// Daily rotating health tips
const healthTipsPool: { title: string; color: string; icon?: React.ReactNode }[] = [
  { title: 'Stay hydrated and maintain a balanced diet.', color: 'blue', icon: <HeartOutlined /> },
  { title: 'Get 7–8 hours of sleep for better immunity.', color: 'green', icon: <SmileOutlined /> },
  { title: 'Regular check-ups can prevent complications.', color: 'purple', icon: <SafetyCertificateOutlined /> },
  { title: 'Take medications exactly as prescribed by your doctor.', color: 'red', icon: <BulbOutlined /> },
  { title: 'Wash hands regularly and wear masks when unwell.', color: 'geekblue', icon: <BulbOutlined /> },
  { title: 'Exercise for at least 30 minutes daily to stay fit.', color: 'cyan', icon: <UserOutlined /> },
  { title: 'Avoid smoking and limit alcohol consumption.', color: 'orange', icon: <MedicineBoxOutlined /> },
  { title: 'Schedule regular dental check-ups every 6 months.', color: 'magenta', icon: <ScheduleOutlined /> },
  { title: 'Practice deep breathing exercises to reduce stress.', color: 'lime', icon: <SmileOutlined /> },
  { title: 'Maintain good posture while working at a desk.', color: 'gold', icon: <UserOutlined /> },
  { title: 'Eat plenty of fruits and vegetables for vitamins.', color: 'volcano', icon: <HeartOutlined /> },
  { title: 'Protect your skin from UV rays with sunscreen.', color: 'purple', icon: <SafetyCertificateOutlined /> },
];

// Daily rotating announcements
const announcementsPool: { title: string; detail: string; level: 'info' | 'warning' | 'urgent' }[] = [
  { title: 'Flu vaccination drive starts next week', detail: 'Walk-in between 9 AM – 5 PM at OPD Block A. Limited slots per day.', level: 'info' },
  { title: 'Heat advisory', detail: 'Avoid direct sun 12–3 PM. Keep hydrated; check on elderly and children.', level: 'warning' },
  { title: 'Blood donation camp', detail: 'Register at the front desk or call 1800-000-000. Healthy donors 18–60 years.', level: 'info' },
  { title: 'Dengue precautions', detail: 'Use mosquito repellents, wear full sleeves, and avoid water stagnation.', level: 'urgent' },
  { title: 'New cardiology wing opening', detail: 'State-of-the-art cardiac care facility now available. Book appointments online.', level: 'info' },
  { title: 'Emergency contact update', detail: 'New emergency helpline: +91-800-200-3000. Available 24/7 for urgent medical assistance.', level: 'warning' },
  { title: 'Diabetes screening camp', detail: 'Free diabetes check-up for patients above 40. No appointment needed.', level: 'info' },
  { title: 'Monsoon health advisory', detail: 'Prevent water-borne diseases. Drink boiled water and avoid street food.', level: 'warning' },
  { title: 'Mental health awareness week', detail: 'Free counseling sessions available. Contact our psychology department.', level: 'info' },
  { title: 'COVID-19 booster shots available', detail: 'Updated vaccines for all age groups. Check eligibility at reception.', level: 'urgent' },
];

// Function to get daily content based on current date
const getDailyContent = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // Select 5 tips and 4 announcements for today
  const tipStartIndex = dayOfYear % healthTipsPool.length;
  const announcementStartIndex = dayOfYear % announcementsPool.length;
  
  const dailyTips = [];
  const dailyAnnouncements = [];
  
  // Get 5 tips
  for (let i = 0; i < 5; i++) {
    dailyTips.push(healthTipsPool[(tipStartIndex + i) % healthTipsPool.length]);
  }
  
  // Get 4 announcements with dates
  for (let i = 0; i < 4; i++) {
    const announcement = announcementsPool[(announcementStartIndex + i) % announcementsPool.length];
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dailyAnnouncements.push({
      ...announcement,
      date: date.toISOString().split('T')[0]
    });
  }
  
  return { dailyTips, dailyAnnouncements };
};

type Notice = { date: string; title: string; detail: string; level: 'info' | 'warning' | 'urgent' };

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.1); opacity: 1; }
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
              radial-gradient(1000px 500px at 90% 0%, rgba(34,197,94,0.15), transparent),
              linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 28px 24px;
  margin-bottom: 16px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;

  .art { position: relative; height: 90px; }
  .art span { position: absolute; font-size: 28px; opacity: 0.95; }
  .art .bell { left: 12px; top: 10px; color: #0ea5e9; animation: ${pulse} 2.2s ease-in-out infinite; }
  .art .sound { left: 64px; top: 40px; color: #22c55e; animation: ${float} 3.2s ease-in-out infinite; }
  .art .idea { left: 116px; top: 16px; color: #f59e0b; animation: ${float} 2.6s ease-in-out infinite; }
`;

const Announcements: React.FC = () => {
  const [dailyContent, setDailyContent] = useState<{
    dailyTips: { title: string; color: string; icon?: React.ReactNode }[];
    dailyAnnouncements: Notice[];
  }>({ dailyTips: [], dailyAnnouncements: [] });

  useEffect(() => {
    setDailyContent(getDailyContent());
  }, []);

  return (
    <div>
      <Hero>
        <div>
          <Title level={2} style={{ margin: 0 }}>Announcements & Tips</Title>
          <Paragraph style={{ marginTop: 6 }}>Latest advisories from our clinicians and helpful tips for everyday health.</Paragraph>
        </div>
        <div className="art" aria-hidden>
          <span className="bell"><NotificationOutlined /></span>
          <span className="sound"><SoundOutlined /></span>
          <span className="idea"><BulbOutlined /></span>
        </div>
      </Hero>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="Latest Announcements">
            <Timeline
              items={dailyContent.dailyAnnouncements.map((n: Notice) => ({
                color: n.level === 'urgent' ? 'red' : n.level === 'warning' ? 'orange' : 'blue',
                children: (
                  <div>
                    <Text strong>{n.title}</Text>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{n.date}</div>
                    <Paragraph style={{ marginTop: 4, marginBottom: 0 }}>{n.detail}</Paragraph>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} md={10}>
          <Card title="Health Tips">
            <List
              dataSource={dailyContent.dailyTips}
              renderItem={(t: { title: string; color: string; icon?: React.ReactNode }) => (
                <List.Item>
                  <Tag color={t.color} style={{ marginRight: 8 }} />
                  <SpaceRow>
                    <span className="icon">{t.icon}</span>
                    <Text>{t.title}</Text>
                  </SpaceRow>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Divider />
      <Card>
        <Paragraph style={{ marginBottom: 0 }}>
          For urgent matters, please contact our emergency helpline immediately. For non-urgent queries, visit our
          <Text strong> Request Callback</Text> page and our care coordinator will get in touch.
        </Paragraph>
      </Card>
    </div>
  );
};

const SpaceRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  .icon { color: #0ea5e9; }
`;

export default Announcements;
