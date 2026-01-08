import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Descriptions } from 'antd';
import { FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

interface Admission {
  id: string;
  admissionNumber: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  bed: {
    bedNumber: string;
    room: {
      roomNumber: string;
    };
  };
  admissionDateTime: string;
}

const DoctorRounds: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inpatient/doctor-rounds/patients');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      message.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (values: any) => {
    try {
      await api.post('/inpatient/doctor-notes', {
        admissionId: selectedAdmission,
        ...values
      });
      message.success('Doctor note added successfully');
      setNoteModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add doctor note');
    }
  };

  const columns = [
    {
      title: 'Admission #',
      dataIndex: 'admissionNumber',
      key: 'admissionNumber',
    },
    {
      title: 'Patient',
      key: 'patient',
      render: (record: Admission) => `${record.patient.firstName} ${record.patient.lastName}`,
    },
    {
      title: 'Bed',
      key: 'bed',
      render: (record: Admission) => `${record.bed.bedNumber} (Room ${record.bed.room.roomNumber})`,
    },
    {
      title: 'Admitted',
      dataIndex: 'admissionDateTime',
      key: 'admissionDateTime',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Admission) => (
        <>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedAdmission(record.id);
              setNoteModalVisible(true);
            }}
          >
            Add Note
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/inpatient/admissions/${record.id}`)}
          >
            View Details
          </Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Doctor Rounds - My Patients</h1>

      <Card>
        <Table
          columns={columns}
          dataSource={patients}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* SOAP Note Modal */}
      <Modal
        title="Add Doctor Note (SOAP)"
        open={noteModalVisible}
        onCancel={() => setNoteModalVisible(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleAddNote}>
          <Form.Item
            label="Note Type"
            name="noteType"
            rules={[{ required: true, message: 'Please select note type' }]}
          >
            <Select>
              <Option value="progress">Progress Note</Option>
              <Option value="admission">Admission Note</Option>
              <Option value="procedure">Procedure Note</Option>
              <Option value="consultation">Consultation</Option>
              <Option value="discharge">Discharge Note</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="Subjective (Patient's Complaints)"
            name="subjective"
            rules={[{ required: true, message: 'Please enter subjective findings' }]}
          >
            <TextArea rows={3} placeholder="What the patient says..." />
          </Form.Item>

          <Form.Item
            label="Objective (Examination Findings)"
            name="objective"
            rules={[{ required: true, message: 'Please enter objective findings' }]}
          >
            <TextArea rows={3} placeholder="What you observe..." />
          </Form.Item>

          <Form.Item
            label="Assessment (Diagnosis)"
            name="assessment"
            rules={[{ required: true, message: 'Please enter assessment' }]}
          >
            <TextArea rows={2} placeholder="Your diagnosis..." />
          </Form.Item>

          <Form.Item
            label="Plan (Treatment Plan)"
            name="plan"
            rules={[{ required: true, message: 'Please enter plan' }]}
          >
            <TextArea rows={3} placeholder="Treatment plan..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DoctorRounds;
