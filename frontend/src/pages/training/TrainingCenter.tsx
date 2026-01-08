import React, { useState } from 'react';
import { Card, Row, Col, Typography, Button, List, Avatar, Tag, Progress, Tabs, Modal, Form, Input, Select, DatePicker, TimePicker, message } from 'antd';
import { 
  PlayCircleOutlined,
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  DownloadOutlined,
  PhoneOutlined,
  MessageOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface LiveTrainingSession {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  instructor: string;
  attendees: number;
  maxAttendees: number;
  status: string;
}

const TrainingCenter: React.FC = () => {
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [form] = Form.useForm();

  const videoTutorials = [
    {
      id: '1',
      title: 'Getting Started with Ayphen Care',
      description: 'Complete overview of the hospital management system',
      duration: '15 min',
      category: 'Basics',
      difficulty: 'Beginner',
      views: 1250,
      rating: 4.8,
      thumbnail: 'https://via.placeholder.com/300x200/e91e63/ffffff?text=Getting+Started'
    },
    {
      id: '2',
      title: 'Patient Management Essentials',
      description: 'Learn to register, manage, and track patients effectively',
      duration: '20 min',
      category: 'Patient Care',
      difficulty: 'Beginner',
      views: 980,
      rating: 4.9,
      thumbnail: 'https://via.placeholder.com/300x200/52c41a/ffffff?text=Patient+Management'
    },
    {
      id: '3',
      title: 'Appointment Scheduling Mastery',
      description: 'Master the appointment booking and scheduling system',
      duration: '18 min',
      category: 'Scheduling',
      difficulty: 'Intermediate',
      views: 756,
      rating: 4.7,
      thumbnail: 'https://via.placeholder.com/300x200/1890ff/ffffff?text=Scheduling'
    },
    {
      id: '4',
      title: 'Telemedicine Setup & Best Practices',
      description: 'Complete guide to video consultations and remote care',
      duration: '25 min',
      category: 'Telemedicine',
      difficulty: 'Intermediate',
      views: 892,
      rating: 4.9,
      thumbnail: 'https://via.placeholder.com/300x200/722ed1/ffffff?text=Telemedicine'
    },
    {
      id: '5',
      title: 'Billing & Financial Management',
      description: 'Handle invoicing, payments, and financial reporting',
      duration: '22 min',
      category: 'Finance',
      difficulty: 'Intermediate',
      views: 634,
      rating: 4.6,
      thumbnail: 'https://via.placeholder.com/300x200/faad14/ffffff?text=Billing'
    },
    {
      id: '6',
      title: 'Advanced Analytics & Reporting',
      description: 'Generate insights and reports for better decision making',
      duration: '30 min',
      category: 'Analytics',
      difficulty: 'Advanced',
      views: 445,
      rating: 4.8,
      thumbnail: 'https://via.placeholder.com/300x200/f5222d/ffffff?text=Analytics'
    }
  ];

  const trainingResources = [
    {
      title: 'Complete User Manual',
      description: 'Comprehensive guide covering all features and workflows',
      type: 'PDF',
      size: '15.2 MB',
      downloads: 2340,
      icon: <FileTextOutlined />
    },
    {
      title: 'Quick Reference Guide',
      description: 'Essential shortcuts and tips for daily operations',
      type: 'PDF',
      size: '2.8 MB',
      downloads: 1890,
      icon: <BookOutlined />
    },
    {
      title: 'Setup Checklist',
      description: 'Step-by-step checklist for hospital setup',
      type: 'PDF',
      size: '1.2 MB',
      downloads: 1567,
      icon: <CheckCircleOutlined />
    },
    {
      title: 'Best Practices Guide',
      description: 'Industry best practices for hospital management',
      type: 'PDF',
      size: '8.7 MB',
      downloads: 1234,
      icon: <StarOutlined />
    }
  ];

  const liveTrainingSessions: LiveTrainingSession[] = [];

  const handleScheduleTraining = async () => {
    try {
      const values = await form.validateFields();
      console.log('Training scheduled:', values);
      
      message.success('Training session scheduled successfully! You will receive a confirmation email shortly.');
      setIsScheduleModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleWatchVideo = (videoId: string) => {
    message.info(`Opening video tutorial: ${videoId}`);
    // In a real implementation, this would open the video player
  };

  const handleDownloadResource = (resourceTitle: string) => {
    message.success(`Downloading: ${resourceTitle}`);
    // In a real implementation, this would trigger the download
  };

  const handleJoinSession = (sessionId: string) => {
    message.info(`Joining training session: ${sessionId}`);
    // In a real implementation, this would open the video conference
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          <BookOutlined /> Training Center
        </Title>
        <Paragraph>
          Master Ayphen Care with our comprehensive training resources and live sessions
        </Paragraph>
      </div>

      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: '32px' }}>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <PlayCircleOutlined style={{ fontSize: '32px', color: '#e91e63', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#e91e63' }}>
                {videoTutorials.length}
              </div>
              <div>Video Tutorials</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#52c41a' }}>
                {trainingResources.length}
              </div>
              <div>Resources</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CalendarOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#1890ff' }}>
                {liveTrainingSessions.length}
              </div>
              <div>Live Sessions</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />
              <div style={{ fontSize: '24px', fontWeight: 600, color: '#faad14' }}>
                24/7
              </div>
              <div>Support Available</div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="videos">
        {/* Video Tutorials */}
        <TabPane tab={<span><PlayCircleOutlined />Video Tutorials</span>} key="videos">
          <Row gutter={16}>
            {videoTutorials.map((video) => (
              <Col span={8} key={video.id} style={{ marginBottom: '16px' }}>
                <Card
                  hoverable
                  cover={
                    <div style={{ 
                      height: '200px', 
                      background: `url(${video.thumbnail})`,
                      backgroundSize: 'cover',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}>
                        <PlayCircleOutlined style={{ fontSize: '32px', color: 'white' }} />
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }}>
                        {video.duration}
                      </div>
                    </div>
                  }
                  actions={[
                    <Button 
                      type="primary" 
                      onClick={() => handleWatchVideo(video.id)}
                      style={{ background: '#e91e63', borderColor: '#e91e63' }}
                    >
                      Watch Now
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={video.title}
                    description={
                      <div>
                        <div style={{ marginBottom: '8px' }}>{video.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Tag color="blue">{video.category}</Tag>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StarOutlined style={{ color: '#faad14' }} />
                            <Text style={{ fontSize: '12px' }}>{video.rating}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              ({video.views} views)
                            </Text>
                          </div>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>

        {/* Resources */}
        <TabPane tab={<span><FileTextOutlined />Resources</span>} key="resources">
          <Row gutter={16}>
            <Col span={16}>
              <Card title="Training Materials">
                <List
                  dataSource={trainingResources}
                  renderItem={(resource) => (
                    <List.Item
                      actions={[
                        <Button 
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadResource(resource.title)}
                        >
                          Download
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={resource.icon} style={{ backgroundColor: '#e91e63' }} />}
                        title={resource.title}
                        description={
                          <div>
                            <div>{resource.description}</div>
                            <div style={{ marginTop: '4px' }}>
                              <Tag>{resource.type}</Tag>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {resource.size} • {resource.downloads} downloads
                              </Text>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card title="Quick Help">
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <MessageOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Title level={5}>Need Immediate Help?</Title>
                  <Paragraph style={{ fontSize: '14px' }}>
                    Our support team is available 24/7 to assist you with any questions.
                  </Paragraph>
                  <Button type="primary" block style={{ marginBottom: '8px' }}>
                    Start Live Chat
                  </Button>
                  <Button block>
                    <PhoneOutlined /> Call Support
                  </Button>
                </div>
              </Card>

              <Card title="Popular Topics" style={{ marginTop: '16px' }}>
                <List size="small">
                  <List.Item>
                    <Button type="link" style={{ padding: 0, height: 'auto' }}>
                      How to add a new patient?
                    </Button>
                  </List.Item>
                  <List.Item>
                    <Button type="link" style={{ padding: 0, height: 'auto' }}>
                      Setting up telemedicine
                    </Button>
                  </List.Item>
                  <List.Item>
                    <Button type="link" style={{ padding: 0, height: 'auto' }}>
                      Configuring billing rates
                    </Button>
                  </List.Item>
                  <List.Item>
                    <Button type="link" style={{ padding: 0, height: 'auto' }}>
                      Managing staff permissions
                    </Button>
                  </List.Item>
                  <List.Item>
                    <Button type="link" style={{ padding: 0, height: 'auto' }}>
                      Generating reports
                    </Button>
                  </List.Item>
                </List>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* Live Training */}
        <TabPane tab={<span><VideoCameraOutlined />Live Training</span>} key="live">
          <Row gutter={16}>
            <Col span={16}>
              <Card 
                title="Upcoming Training Sessions"
                extra={
                  <Button 
                    type="primary" 
                    onClick={() => setIsScheduleModalVisible(true)}
                    style={{ background: '#e91e63', borderColor: '#e91e63' }}
                  >
                    Schedule Private Session
                  </Button>
                }
              >
                <List
                  dataSource={liveTrainingSessions}
                  renderItem={(session) => (
                    <List.Item
                      actions={[
                        <Button 
                          type="primary"
                          onClick={() => handleJoinSession(session.id)}
                          disabled={session.attendees >= session.maxAttendees}
                        >
                          {session.attendees >= session.maxAttendees ? 'Full' : 'Register'}
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar icon={<VideoCameraOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{session.title}</span>
                            <Tag color="green">{session.duration}</Tag>
                          </div>
                        }
                        description={
                          <div>
                            <div>{session.description}</div>
                            <div style={{ marginTop: '8px' }}>
                              <CalendarOutlined style={{ marginRight: '4px' }} />
                              <Text style={{ marginRight: '16px' }}>{session.date} at {session.time}</Text>
                              <UserOutlined style={{ marginRight: '4px' }} />
                              <Text style={{ marginRight: '16px' }}>
                                {session.attendees}/{session.maxAttendees} attendees
                              </Text>
                              <Text type="secondary">Instructor: {session.instructor}</Text>
                            </div>
                            <Progress 
                              percent={(session.attendees / session.maxAttendees) * 100}
                              size="small"
                              style={{ marginTop: '8px' }}
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            <Col span={8}>
              <Card title="Training Benefits">
                <List size="small">
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Faster system adoption
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Reduced support tickets
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Improved efficiency
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Best practice guidance
                  </List.Item>
                  <List.Item>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    Personalized support
                  </List.Item>
                </List>
              </Card>

              <Card title="Training Statistics" style={{ marginTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 600, color: '#e91e63' }}>95%</div>
                    <div>Completion Rate</div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '32px', fontWeight: 600, color: '#52c41a' }}>4.9</div>
                    <div>Average Rating</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: 600, color: '#1890ff' }}>2.5hrs</div>
                    <div>Average Duration</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Schedule Training Modal */}
      <Modal
        title="Schedule Private Training Session"
        visible={isScheduleModalVisible}
        onOk={handleScheduleTraining}
        onCancel={() => setIsScheduleModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="contactName" label="Contact Name" rules={[{ required: true }]}>
                <Input placeholder="Your name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="your.email@hospital.com" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="preferredDate" label="Preferred Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="preferredTime" label="Preferred Time" rules={[{ required: true }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item name="attendees" label="Number of Attendees" rules={[{ required: true }]}>
            <Select placeholder="How many people will attend?">
              <Option value="1-5">1-5 people</Option>
              <Option value="6-10">6-10 people</Option>
              <Option value="11-20">11-20 people</Option>
              <Option value="20+">20+ people</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="topics" label="Training Topics" rules={[{ required: true }]}>
            <Select mode="multiple" placeholder="Select areas you'd like to focus on">
              <Option value="basic-navigation">Basic Navigation</Option>
              <Option value="patient-management">Patient Management</Option>
              <Option value="appointment-scheduling">Appointment Scheduling</Option>
              <Option value="telemedicine">Telemedicine</Option>
              <Option value="billing">Billing & Payments</Option>
              <Option value="reports">Reports & Analytics</Option>
              <Option value="staff-management">Staff Management</Option>
              <Option value="system-configuration">System Configuration</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea 
              rows={3} 
              placeholder="Any specific requirements or questions you'd like to cover?" 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TrainingCenter;
