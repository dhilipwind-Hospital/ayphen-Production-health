import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Row, Col, Typography, Input, Select, Modal, Form, message, Tabs, Statistic, Avatar, Badge } from 'antd';
import api from '../../services/api';
import { 
  VideoCameraOutlined, 
  PhoneOutlined, 
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  AudioOutlined,
  DesktopOutlined,
  FileTextOutlined,
  MedicineBoxOutlined,
  TeamOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface TelemedicineSession {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar?: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number; // in minutes
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show';
  sessionType: 'Video' | 'Audio' | 'Chat';
  reason: string;
  notes?: string;
  prescriptions?: string[];
  followUpRequired: boolean;
  recordingAvailable: boolean;
}

interface VirtualWaitingRoom {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  appointmentTime: string;
  waitingTime: number; // in minutes
  priority: 'Normal' | 'Urgent' | 'Emergency';
  deviceStatus: 'Ready' | 'Testing' | 'Issues';
  connectionQuality: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

const TelemedicineHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const [isSessionModalVisible, setIsSessionModalVisible] = useState(false);
  const [isCreateEditModalVisible, setIsCreateEditModalVisible] = useState(false);
  const [activeSession, setActiveSession] = useState<TelemedicineSession | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<TelemedicineSession[]>([]);

  // Load sessions from database on component mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/telemedicine/sessions');
      setSessions(response.data?.data || response.data || []);
    } catch (error: any) {
      console.error('Error loading sessions:', error);
      message.error(error.response?.data?.message || 'Failed to load telemedicine sessions');
      // No fallback data - display empty state
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const [waitingRoom, setWaitingRoom] = useState<VirtualWaitingRoom[]>([]);

  const sessionColumns = [
    {
      title: 'Session',
      key: 'session',
      render: (record: TelemedicineSession) => (
        <div>
          <div style={{ fontWeight: 600, color: '#e91e63' }}>{record.sessionId}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.appointmentDate} at {record.appointmentTime}
          </div>
        </div>
      ),
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (record: TelemedicineSession) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={record.patientAvatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.patientName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.reason}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (record: TelemedicineSession) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar src={record.doctorAvatar} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{record.doctorName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.duration} min session</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'sessionType',
      key: 'sessionType',
      render: (type: string) => {
        const icons = {
          Video: <VideoCameraOutlined />,
          Audio: <AudioOutlined />,
          Chat: <FileTextOutlined />
        };
        const colors = {
          Video: '#e91e63',
          Audio: '#52c41a',
          Chat: '#1890ff'
        };
        return (
          <Tag color={colors[type as keyof typeof colors]} icon={icons[type as keyof typeof icons]}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          Scheduled: '#1890ff',
          'In Progress': '#52c41a',
          Completed: '#722ed1',
          Cancelled: '#ff4d4f',
          'No Show': '#faad14'
        };
        const icons = {
          Scheduled: <ClockCircleOutlined />,
          'In Progress': <PlayCircleOutlined />,
          Completed: <CheckCircleOutlined />,
          Cancelled: <PauseCircleOutlined />,
          'No Show': <ClockCircleOutlined />
        };
        return (
          <Tag color={colors[status as keyof typeof colors]} icon={icons[status as keyof typeof icons]}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: TelemedicineSession) => (
        <Space>
          {record.status === 'Scheduled' && (
            <Button 
              type="primary" 
              icon={<VideoCameraOutlined />}
              onClick={() => handleStartSession(record)}
              style={{ background: '#e91e63', borderColor: '#e91e63' }}
            >
              Start
            </Button>
          )}
          {record.status === 'In Progress' && (
            <Button 
              type="primary" 
              icon={<DesktopOutlined />}
              onClick={() => handleJoinSession(record)}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Join
            </Button>
          )}
          {record.status === 'Completed' && (
            <Button 
              type="text" 
              icon={<FileTextOutlined />}
              onClick={() => handleViewNotes(record)}
            >
              Notes
            </Button>
          )}
          {record.status === 'Scheduled' && (
            <Button 
              type="text" 
              icon={<EditOutlined />}
              onClick={() => handleEditSession(record)}
            >
              Edit
            </Button>
          )}
          <Button 
            type="text" 
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteSession(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const waitingRoomColumns = [
    {
      title: 'Patient',
      key: 'patient',
      render: (record: VirtualWaitingRoom) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge 
            dot 
            color={record.priority === 'Emergency' ? '#ff4d4f' : record.priority === 'Urgent' ? '#faad14' : '#52c41a'}
          >
            <Avatar src={record.patientAvatar} icon={<UserOutlined />} />
          </Badge>
          <div>
            <div style={{ fontWeight: 500 }}>{record.patientName}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Appointment: {record.appointmentTime}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Waiting Time',
      dataIndex: 'waitingTime',
      key: 'waitingTime',
      render: (time: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 600, color: time > 10 ? '#ff4d4f' : '#52c41a' }}>
            {time}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>minutes</div>
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors = {
          Normal: '#52c41a',
          Urgent: '#faad14',
          Emergency: '#ff4d4f'
        };
        return (
          <Tag color={colors[priority as keyof typeof colors]}>
            {priority}
          </Tag>
        );
      },
    },
    {
      title: 'Device Status',
      dataIndex: 'deviceStatus',
      key: 'deviceStatus',
      render: (status: string) => {
        const colors = {
          Ready: '#52c41a',
          Testing: '#faad14',
          Issues: '#ff4d4f'
        };
        return (
          <Tag color={colors[status as keyof typeof colors]}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Connection',
      dataIndex: 'connectionQuality',
      key: 'connectionQuality',
      render: (quality: string) => {
        const colors = {
          Excellent: '#52c41a',
          Good: '#52c41a',
          Fair: '#faad14',
          Poor: '#ff4d4f'
        };
        return (
          <Tag color={colors[quality as keyof typeof colors]}>
            {quality}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: VirtualWaitingRoom) => (
        <Space>
          <Button 
            type="primary" 
            icon={<VideoCameraOutlined />}
            onClick={() => handleAdmitPatient(record)}
            style={{ background: '#e91e63', borderColor: '#e91e63' }}
          >
            Admit
          </Button>
          <Button 
            type="text" 
            onClick={() => handleSendMessage(record)}
          >
            Message
          </Button>
        </Space>
      ),
    },
  ];

  const handleStartSession = (session: TelemedicineSession) => {
    // Update session status to In Progress
    setSessions(sessions.map(s => 
      s.id === session.id 
        ? { ...s, status: 'In Progress' as const }
        : s
    ));
    setActiveSession({...session, status: 'In Progress'});
    setIsSessionModalVisible(true);
    message.success(`Starting telemedicine session with ${session.patientName}`);
    
    // Simulate video call initialization
    setTimeout(() => {
      message.info('Video connection established');
    }, 2000);
  };

  const handleJoinSession = (session: TelemedicineSession) => {
    message.success(`Joining session ${session.sessionId}`);
  };

  const handleViewNotes = (session: TelemedicineSession) => {
    Modal.info({
      title: `Session Notes - ${session.sessionId}`,
      width: 600,
      content: (
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Patient:</Text> {session.patientName}<br/>
            <Text strong>Doctor:</Text> {session.doctorName}<br/>
            <Text strong>Date:</Text> {session.appointmentDate} at {session.appointmentTime}<br/>
            <Text strong>Duration:</Text> {session.duration} minutes
          </div>
          
          {session.notes && (
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>Clinical Notes:</Title>
              <Text>{session.notes}</Text>
            </div>
          )}
          
          {session.prescriptions && session.prescriptions.length > 0 && (
            <div>
              <Title level={5}>Prescriptions:</Title>
              <ul>
                {session.prescriptions.map((prescription, index) => (
                  <li key={index}>{prescription}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
    });
  };

  // CRUD Operations
  const handleCreateSession = () => {
    setIsEditMode(false);
    setActiveSession(null);
    form.resetFields();
    setIsCreateEditModalVisible(true);
  };

  const handleEditSession = (session: TelemedicineSession) => {
    setIsEditMode(true);
    setActiveSession(session);
    form.setFieldsValue({
      patientName: session.patientName,
      doctorName: session.doctorName,
      appointmentDate: session.appointmentDate,
      appointmentTime: session.appointmentTime,
      duration: session.duration,
      sessionType: session.sessionType,
      reason: session.reason,
    });
    setIsCreateEditModalVisible(true);
  };

  const handleDeleteSession = (sessionId: string) => {
    Modal.confirm({
      title: 'Delete Session',
      content: 'Are you sure you want to delete this telemedicine session?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await api.delete(`/telemedicine/sessions/${sessionId}`);
          setSessions(sessions.filter(s => s.id !== sessionId));
          message.success('Session deleted from database successfully!');
        } catch (error: any) {
          console.error('Error deleting session:', error);
          message.error(error.response?.data?.message || 'Failed to delete session from database');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleSaveSession = async (values: any) => {
    try {
      setLoading(true);
      
      if (isEditMode && activeSession) {
        // Update existing session - API call
        const response = await api.put(`/telemedicine/sessions/${activeSession.id}`, {
          patientName: values.patientName,
          doctorName: values.doctorName,
          appointmentDate: values.appointmentDate,
          appointmentTime: values.appointmentTime,
          duration: values.duration,
          sessionType: values.sessionType,
          reason: values.reason,
        });
        
        // Update local state with response from server
        setSessions(sessions.map(s =>
          s.id === activeSession.id ? (response.data?.data || response.data) : s
        ));
        message.success('Session updated successfully in database!');
      } else {
        // Create new session - API call
        const response = await api.post('/telemedicine/sessions', {
          patientName: values.patientName,
          doctorName: values.doctorName,
          appointmentDate: values.appointmentDate,
          appointmentTime: values.appointmentTime,
          duration: values.duration,
          sessionType: values.sessionType,
          reason: values.reason,
          status: 'Scheduled',
          followUpRequired: false,
          recordingAvailable: false,
        });
        
        // Add new session from server response
        const newSession = response.data?.data || response.data;
        setSessions([...sessions, newSession]);
        message.success('Session created and saved to database!');
      }
      
      setIsCreateEditModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      console.error('Error saving session:', error);
      message.error(error.response?.data?.message || 'Failed to save session to database');
    } finally {
      setLoading(false);
    }
  };

  const handleAdmitPatient = (patient: VirtualWaitingRoom) => {
    message.success(`Admitting ${patient.patientName} to consultation`);
    setWaitingRoom(waitingRoom.filter(p => p.id !== patient.id));
  };

  const handleSendMessage = (patient: VirtualWaitingRoom) => {
    message.info(`Sending message to ${patient.patientName}`);
  };

  const handleEndSession = () => {
    if (activeSession) {
      // Update session status to Completed
      setSessions(sessions.map(s => 
        s.id === activeSession.id 
          ? { 
              ...s, 
              status: 'Completed' as const,
              notes: s.notes || 'Session completed successfully',
              recordingAvailable: true
            }
          : s
      ));
      message.success(`Session ${activeSession.sessionId} completed`);
      setIsSessionModalVisible(false);
      setActiveSession(null);
    }
  };

  const handleAddPrescription = () => {
    if (activeSession) {
      Modal.confirm({
        title: 'Add Prescription',
        content: (
          <div style={{ marginTop: 16 }}>
            <Input.TextArea 
              rows={4} 
              placeholder="Enter prescription details..."
              id="prescription-input"
            />
          </div>
        ),
        onOk: () => {
          const prescriptionInput = document.getElementById('prescription-input') as HTMLTextAreaElement;
          const prescription = prescriptionInput?.value;
          if (prescription) {
            setSessions(sessions.map(s => 
              s.id === activeSession.id 
                ? { 
                    ...s, 
                    prescriptions: [...(s.prescriptions || []), prescription]
                  }
                : s
            ));
            message.success('Prescription added successfully');
          }
        }
      });
    }
  };

  const handleAddNotes = () => {
    if (activeSession) {
      Modal.confirm({
        title: 'Add Session Notes',
        content: (
          <div style={{ marginTop: 16 }}>
            <Input.TextArea 
              rows={6} 
              placeholder="Enter clinical notes..."
              id="notes-input"
              defaultValue={activeSession.notes}
            />
          </div>
        ),
        onOk: () => {
          const notesInput = document.getElementById('notes-input') as HTMLTextAreaElement;
          const notes = notesInput?.value;
          if (notes) {
            setSessions(sessions.map(s => 
              s.id === activeSession.id 
                ? { ...s, notes }
                : s
            ));
            setActiveSession({...activeSession, notes});
            message.success('Notes saved successfully');
          }
        }
      });
    }
  };

  // Device Testing Functions
  const handleTestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Create a modal to show camera preview
      Modal.success({
        title: 'Camera Test Successful',
        content: (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <div>Your camera is working perfectly!</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Camera access granted and video stream active
            </div>
          </div>
        ),
        onOk: () => {
          // Stop the camera stream
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      // Stop the stream after a short preview
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 3000);
      
    } catch (error) {
      Modal.error({
        title: 'Camera Test Failed',
        content: (
          <div style={{ textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <div>Camera access denied or not available</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Please check your camera permissions and try again
            </div>
          </div>
        )
      });
    }
  };

  const handleTestMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      Modal.success({
        title: 'Microphone Test Successful',
        content: (
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
            <div>Your microphone is working perfectly!</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Microphone access granted and audio stream active
            </div>
          </div>
        ),
        onOk: () => {
          stream.getTracks().forEach(track => track.stop());
        }
      });
      
      // Stop the stream
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
      }, 2000);
      
    } catch (error) {
      Modal.error({
        title: 'Microphone Test Failed',
        content: (
          <div style={{ textAlign: 'center' }}>
            <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
            <div>Microphone access denied or not available</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
              Please check your microphone permissions and try again
            </div>
          </div>
        )
      });
    }
  };

  const handleTestConnection = () => {
    // Simulate connection test
    const testResults = {
      latency: Math.floor(Math.random() * 50) + 10, // 10-60ms
      bandwidth: Math.floor(Math.random() * 50) + 50, // 50-100 Mbps
      packetLoss: Math.random() * 2 // 0-2%
    };

    const quality = testResults.latency < 30 && testResults.bandwidth > 25 && testResults.packetLoss < 1 
      ? 'Excellent' 
      : testResults.latency < 50 && testResults.bandwidth > 10 && testResults.packetLoss < 2
      ? 'Good'
      : 'Fair';

    Modal.info({
      title: 'Connection Test Results',
      content: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '8px' }} />
            <div style={{ fontSize: '18px', fontWeight: 600 }}>Connection Quality: {quality}</div>
          </div>
          
          <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Latency:</span>
              <span style={{ fontWeight: 600, color: testResults.latency < 30 ? '#52c41a' : '#faad14' }}>
                {testResults.latency}ms
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Bandwidth:</span>
              <span style={{ fontWeight: 600, color: testResults.bandwidth > 25 ? '#52c41a' : '#faad14' }}>
                {testResults.bandwidth} Mbps
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Packet Loss:</span>
              <span style={{ fontWeight: 600, color: testResults.packetLoss < 1 ? '#52c41a' : '#faad14' }}>
                {testResults.packetLoss.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      )
    });
  };

  // Calculate statistics
  const todaySessions = sessions.filter(s => s.appointmentDate === '2024-10-21').length;
  const activeSessions = sessions.filter(s => s.status === 'In Progress').length;
  const completedSessions = sessions.filter(s => s.status === 'Completed').length;
  const waitingPatients = waitingRoom.length;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#e91e63', marginBottom: '8px' }}>
          <VideoCameraOutlined /> Telemedicine Hub
        </Title>
        <Text type="secondary">
          Manage virtual consultations and patient interactions
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Today's Sessions"
              value={todaySessions}
              prefix={<CalendarOutlined style={{ color: '#e91e63' }} />}
              valueStyle={{ color: '#e91e63' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Sessions"
              value={activeSessions}
              prefix={<PlayCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Today"
              value={completedSessions}
              prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Waiting Patients"
              value={waitingPatients}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><VideoCameraOutlined />Sessions</span>} key="sessions">
          <Card>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Search
                  placeholder="Search sessions..."
                  style={{ width: 300 }}
                />
                <Select defaultValue="all" style={{ width: 120 }}>
                  <Option value="all">All Status</Option>
                  <Option value="scheduled">Scheduled</Option>
                  <Option value="in-progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </Space>
              <Button 
                type="primary"
                icon={<CalendarOutlined />}
                onClick={handleCreateSession}
                style={{ background: '#e91e63', borderColor: '#e91e63' }}
              >
                Schedule Session
              </Button>
            </div>
            
            <Table
              columns={sessionColumns}
              dataSource={sessions}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} sessions`
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><TeamOutlined />Waiting Room</span>} key="waiting-room">
          <Card title="Virtual Waiting Room">
            <Table
              columns={waitingRoomColumns}
              dataSource={waitingRoom}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab={<span><DesktopOutlined />Device Testing</span>} key="device-testing">
          <Card title="Device & Connection Testing">
            <Row gutter={16}>
              <Col span={8}>
                <Card size="small" title="Camera Test">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <VideoCameraOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                    <div>Camera: Working</div>
                    <Button 
                      type="primary" 
                      style={{ marginTop: '8px', background: '#e91e63', borderColor: '#e91e63' }}
                      onClick={() => handleTestCamera()}
                    >
                      Test Camera
                    </Button>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Microphone Test">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <AudioOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                    <div>Microphone: Working</div>
                    <Button 
                      type="primary" 
                      style={{ marginTop: '8px', background: '#e91e63', borderColor: '#e91e63' }}
                      onClick={() => handleTestMicrophone()}
                    >
                      Test Microphone
                    </Button>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title="Connection Test">
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                    <div>Connection: Excellent</div>
                    <Button 
                      type="primary" 
                      style={{ marginTop: '8px', background: '#e91e63', borderColor: '#e91e63' }}
                      onClick={() => handleTestConnection()}
                    >
                      Test Connection
                    </Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Active Session Modal */}
      <Modal
        title={`Telemedicine Session - ${activeSession?.sessionId}`}
        visible={isSessionModalVisible}
        onCancel={() => setIsSessionModalVisible(false)}
        width={1000}
        footer={[
          <Button key="end" danger onClick={() => handleEndSession()}>
            End Session
          </Button>,
          <Button key="prescription" onClick={() => handleAddPrescription()}>
            Add Prescription
          </Button>,
          <Button key="notes" type="primary" style={{ background: '#e91e63', borderColor: '#e91e63' }} onClick={() => handleAddNotes()}>
            Add Notes
          </Button>
        ]}
      >
        {activeSession && (
          <div>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Card size="small" title="Patient Information">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar src={activeSession.patientAvatar} size={48} icon={<UserOutlined />} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{activeSession.patientName}</div>
                      <div style={{ color: '#666' }}>{activeSession.reason}</div>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Session Controls">
                  <Space>
                    <Button icon={<VideoCameraOutlined />}>Camera</Button>
                    <Button icon={<AudioOutlined />}>Microphone</Button>
                    <Button icon={<DesktopOutlined />}>Screen Share</Button>
                    <Button icon={<MedicineBoxOutlined />}>Prescribe</Button>
                  </Space>
                </Card>
              </Col>
            </Row>
            
            <Card size="small" title="Video Conference">
              <div style={{ 
                height: '300px', 
                background: '#f0f0f0', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '8px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <VideoCameraOutlined style={{ fontSize: '64px', color: '#e91e63', marginBottom: '16px' }} />
                  <div>Video conference would be displayed here</div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    Session Duration: 15:30
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Create/Edit Session Modal */}
      <Modal
        title={isEditMode ? 'Edit Telemedicine Session' : 'Schedule New Telemedicine Session'}
        open={isCreateEditModalVisible}
        onCancel={() => {
          setIsCreateEditModalVisible(false);
          setIsEditMode(false);
          setActiveSession(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveSession}
        >
          <Form.Item
            name="patientName"
            label="Patient Name"
            rules={[{ required: true, message: 'Please enter patient name' }]}
          >
            <Input placeholder="Enter patient name" prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item
            name="doctorName"
            label="Doctor Name"
            rules={[{ required: true, message: 'Please enter doctor name' }]}
          >
            <Input placeholder="Enter doctor name" prefix={<MedicineBoxOutlined />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="appointmentDate"
                label="Appointment Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="appointmentTime"
                label="Appointment Time"
                rules={[{ required: true, message: 'Please select time' }]}
              >
                <Input type="time" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="duration"
                label="Duration (minutes)"
                rules={[{ required: true, message: 'Please enter duration' }]}
              >
                <Input type="number" min={15} max={120} placeholder="30" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sessionType"
                label="Session Type"
                rules={[{ required: true, message: 'Please select session type' }]}
              >
                <Select placeholder="Select type">
                  <Option value="Video">Video</Option>
                  <Option value="Audio">Audio</Option>
                  <Option value="Chat">Chat</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="Reason for Consultation"
            rules={[{ required: true, message: 'Please enter reason' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter consultation reason" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                {isEditMode ? 'Update Session' : 'Schedule Session'}
              </Button>
              <Button onClick={() => {
                setIsCreateEditModalVisible(false);
                setIsEditMode(false);
                setActiveSession(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TelemedicineHub;
