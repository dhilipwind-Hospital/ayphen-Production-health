import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Select, Space, Tag, Modal, Form, Input } from 'antd';
import { 
  ClockCircleOutlined, 
  UserOutlined, 
  MedicineBoxOutlined,
  FastForwardOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

interface QueueItem {
  id: string;
  visitId: string;
  stage: string;
  priority: string;
  tokenNumber: string;
  status: string;
  assignedDoctorId?: string;
  visit: {
    id: string;
    visitNumber: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  assignedDoctor?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

const QueueManagement: React.FC = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [skipTriageModal, setSkipTriageModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<QueueItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, [selectedStage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load queue items
      const queueParams = selectedStage !== 'all' ? { stage: selectedStage } : {};
      const queueResponse = await api.get('/queue', { params: queueParams });
      setQueueItems(queueResponse.data?.data || []);

      // Load doctors
      const doctorsResponse = await api.get('/users', { 
        params: { role: 'doctor', limit: 100 } 
      });
      setDoctors(doctorsResponse.data?.data || []);
    } catch (error) {
      message.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTriage = async (queueItem: QueueItem) => {
    setSelectedVisit(queueItem);
    setSkipTriageModal(true);
  };

  const confirmSkipTriage = async () => {
    if (!selectedVisit) return;

    try {
      const values = await form.validateFields();
      await api.patch(`/visits/${selectedVisit.visitId}/skip-triage`, {
        doctorId: values.doctorId,
        priority: 'urgent'
      });
      
      message.success('Patient moved directly to doctor queue');
      setSkipTriageModal(false);
      form.resetFields();
      setSelectedVisit(null);
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to skip triage');
    }
  };

  const callNextPatient = async (stage: string, doctorId?: string) => {
    try {
      const params = doctorId ? { stage, doctorId } : { stage };
      await api.post('/queue/call-next', params);
      message.success('Next patient called');
      loadData();
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Failed to call next patient');
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      reception: 'blue',
      triage: 'orange',
      doctor: 'green',
      pharmacy: 'purple',
      lab: 'cyan',
      billing: 'red'
    };
    return colors[stage] || 'default';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      emergency: 'red',
      urgent: 'orange',
      standard: 'blue'
    };
    return colors[priority] || 'default';
  };

  const columns = [
    {
      title: 'Token',
      dataIndex: 'tokenNumber',
      key: 'tokenNumber',
      width: 120,
      render: (token: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {token}
        </Tag>
      )
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (record: QueueItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>
            {record.visit.patient.firstName} {record.visit.patient.lastName}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>
            Visit: {record.visit.visitNumber}
          </div>
        </div>
      )
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      key: 'stage',
      render: (stage: string) => (
        <Tag color={getStageColor(stage)}>
          {stage.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'waiting' ? 'gold' : status === 'called' ? 'green' : 'default'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Assigned Doctor',
      key: 'assignedDoctor',
      render: (record: QueueItem) => (
        record.assignedDoctor ? (
          <span>
            Dr. {record.assignedDoctor.firstName} {record.assignedDoctor.lastName}
          </span>
        ) : (
          <span style={{ color: '#999' }}>Not assigned</span>
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: QueueItem) => (
        <Space>
          {record.stage === 'triage' && (
            <Button
              type="primary"
              size="small"
              icon={<FastForwardOutlined />}
              onClick={() => handleSkipTriage(record)}
            >
              Skip to Doctor
            </Button>
          )}
          {record.stage === 'doctor' && (
            <Button
              type="default"
              size="small"
              onClick={() => callNextPatient('doctor', record.assignedDoctorId)}
            >
              Call Next
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Queue Management"
        extra={
          <Space>
            <Select
              value={selectedStage}
              onChange={setSelectedStage}
              style={{ width: 150 }}
            >
              <Option value="all">All Stages</Option>
              <Option value="reception">Reception</Option>
              <Option value="triage">Triage</Option>
              <Option value="doctor">Doctor</Option>
              <Option value="pharmacy">Pharmacy</Option>
              <Option value="lab">Laboratory</Option>
              <Option value="billing">Billing</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={queueItems}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} patients in queue`
          }}
        />
      </Card>

      <Modal
        title="Skip Triage - Direct to Doctor"
        open={skipTriageModal}
        onOk={confirmSkipTriage}
        onCancel={() => {
          setSkipTriageModal(false);
          form.resetFields();
          setSelectedVisit(null);
        }}
        okText="Skip Triage"
        cancelText="Cancel"
      >
        {selectedVisit && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Patient:</strong> {selectedVisit.visit.patient.firstName} {selectedVisit.visit.patient.lastName}
            </p>
            <p>
              <strong>Token:</strong> {selectedVisit.tokenNumber}
            </p>
            <p>
              <strong>Current Stage:</strong> {selectedVisit.stage}
            </p>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="doctorId"
            label="Assign to Doctor (Optional)"
            rules={[{ required: false }]}
          >
            <Select
              placeholder="Select a doctor"
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {doctors.map(doctor => (
                <Option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.firstName} {doctor.lastName}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: 12, marginTop: 16 }}>
          <p style={{ margin: 0, color: '#389e0d' }}>
            ✅ This patient will skip the triage station and go directly to the doctor queue with urgent priority.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default QueueManagement;
