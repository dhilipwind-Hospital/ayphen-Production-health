import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, InputNumber, Select, message, Tabs, Tag } from 'antd';
import { PlusOutlined, HeartOutlined, MedicineBoxOutlined, FileTextOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

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
}

const NursingCare: React.FC = () => {
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<string>('');
  const [vitalsModalVisible, setVitalsModalVisible] = useState(false);
  const [medicationModalVisible, setMedicationModalVisible] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vitalsForm] = Form.useForm();
  const [medicationForm] = Form.useForm();
  const [notesForm] = Form.useForm();

  useEffect(() => {
    fetchCurrentAdmissions();
  }, []);

  const fetchCurrentAdmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inpatient/admissions/current');
      setAdmissions(response.data.admissions || []);
    } catch (error) {
      console.error('Error fetching admissions:', error);
      message.error('Failed to fetch admissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVitals = async (values: any) => {
    try {
      await api.post('/inpatient/vital-signs', {
        admissionId: selectedAdmission,
        ...values
      });
      message.success('Vital signs recorded successfully');
      setVitalsModalVisible(false);
      vitalsForm.resetFields();
    } catch (error) {
      console.error('Error recording vitals:', error);
      message.error('Failed to record vital signs');
    }
  };

  const handleAdministerMedication = async (values: any) => {
    try {
      await api.post('/inpatient/medications', {
        admissionId: selectedAdmission,
        ...values
      });
      message.success('Medication administered successfully');
      setMedicationModalVisible(false);
      medicationForm.resetFields();
    } catch (error) {
      console.error('Error administering medication:', error);
      message.error('Failed to administer medication');
    }
  };

  const handleAddNursingNote = async (values: any) => {
    try {
      await api.post('/inpatient/nursing-notes', {
        admissionId: selectedAdmission,
        ...values
      });
      message.success('Nursing note added successfully');
      setNotesModalVisible(false);
      notesForm.resetFields();
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add nursing note');
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
      title: 'Actions',
      key: 'actions',
      render: (record: Admission) => (
        <>
          <Button
            type="link"
            icon={<HeartOutlined />}
            onClick={() => {
              setSelectedAdmission(record.id);
              setVitalsModalVisible(true);
            }}
          >
            Vitals
          </Button>
          <Button
            type="link"
            icon={<MedicineBoxOutlined />}
            onClick={() => {
              setSelectedAdmission(record.id);
              setMedicationModalVisible(true);
            }}
          >
            Medication
          </Button>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => {
              setSelectedAdmission(record.id);
              setNotesModalVisible(true);
            }}
          >
            Notes
          </Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <h1>Nursing Care</h1>

      <Card>
        <Table
          columns={columns}
          dataSource={admissions}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* Vital Signs Modal */}
      <Modal
        title="Record Vital Signs"
        open={vitalsModalVisible}
        onCancel={() => setVitalsModalVisible(false)}
        onOk={() => vitalsForm.submit()}
        width={600}
      >
        <Form form={vitalsForm} layout="vertical" onFinish={handleRecordVitals}>
          <Form.Item label="Temperature (°C)" name="temperature">
            <InputNumber min={35} max={42} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Heart Rate (BPM)" name="heartRate">
            <InputNumber min={40} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Respiratory Rate" name="respiratoryRate">
            <InputNumber min={10} max={40} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Systolic BP" name="systolicBP">
            <InputNumber min={70} max={200} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Diastolic BP" name="diastolicBP">
            <InputNumber min={40} max={130} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Oxygen Saturation (%)" name="oxygenSaturation">
            <InputNumber min={70} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Pain Score (0-10)" name="painScore">
            <Input placeholder="e.g., 5/10" />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Medication Modal */}
      <Modal
        title="Administer Medication"
        open={medicationModalVisible}
        onCancel={() => setMedicationModalVisible(false)}
        onOk={() => medicationForm.submit()}
      >
        <Form form={medicationForm} layout="vertical" onFinish={handleAdministerMedication}>
          <Form.Item
            label="Medication"
            name="medication"
            rules={[{ required: true, message: 'Please enter medication name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Dosage"
            name="dosage"
            rules={[{ required: true, message: 'Please enter dosage' }]}
          >
            <Input placeholder="e.g., 500mg" />
          </Form.Item>
          <Form.Item
            label="Route"
            name="route"
            rules={[{ required: true, message: 'Please select route' }]}
          >
            <Select>
              <Option value="Oral">Oral</Option>
              <Option value="IV">IV</Option>
              <Option value="IM">IM</Option>
              <Option value="SC">SC</Option>
              <Option value="Topical">Topical</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Nursing Notes Modal */}
      <Modal
        title="Add Nursing Note"
        open={notesModalVisible}
        onCancel={() => setNotesModalVisible(false)}
        onOk={() => notesForm.submit()}
      >
        <Form form={notesForm} layout="vertical" onFinish={handleAddNursingNote}>
          <Form.Item
            label="Note Type"
            name="noteType"
            rules={[{ required: true, message: 'Please select note type' }]}
          >
            <Select>
              <Option value="routine">Routine</Option>
              <Option value="medication">Medication</Option>
              <Option value="procedure">Procedure</Option>
              <Option value="assessment">Assessment</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Notes"
            name="notes"
            rules={[{ required: true, message: 'Please enter notes' }]}
          >
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NursingCare;
