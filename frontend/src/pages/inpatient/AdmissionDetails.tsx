import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tabs, Table, Tag, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { FileTextOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TabPane } = Tabs;

const AdmissionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [admission, setAdmission] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAdmission(id);
    }
  }, [id]);

  const fetchAdmission = async (admissionId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/inpatient/admissions/${admissionId}`);
      setAdmission(response.data.admission);
    } catch (error) {
      console.error('Error fetching admission:', error);
      message.error('Failed to fetch admission details');
    } finally {
      setLoading(false);
    }
  };

  if (!admission) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  const nursingNotesColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'noteDateTime',
      key: 'noteDateTime',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Type',
      dataIndex: 'noteType',
      key: 'noteType',
      render: (type: string) => <Tag>{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: 'Nurse',
      key: 'nurse',
      render: (record: any) => `${record.nurse?.firstName} ${record.nurse?.lastName}`,
    },
  ];

  const vitalSignsColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'recordedAt',
      key: 'recordedAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Temp (°C)',
      dataIndex: 'temperature',
      key: 'temperature',
    },
    {
      title: 'HR (BPM)',
      dataIndex: 'heartRate',
      key: 'heartRate',
    },
    {
      title: 'BP',
      key: 'bp',
      render: (record: any) => record.systolicBP && record.diastolicBP ? 
        `${record.systolicBP}/${record.diastolicBP}` : '-',
    },
    {
      title: 'SpO2 (%)',
      dataIndex: 'oxygenSaturation',
      key: 'oxygenSaturation',
    },
    {
      title: 'Recorded By',
      key: 'recordedBy',
      render: (record: any) => `${record.recordedBy?.firstName} ${record.recordedBy?.lastName}`,
    },
  ];

  const medicationsColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'administeredAt',
      key: 'administeredAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Medication',
      dataIndex: 'medication',
      key: 'medication',
    },
    {
      title: 'Dosage',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (route: string) => <Tag color="blue">{route}</Tag>,
    },
    {
      title: 'Administered By',
      key: 'administeredBy',
      render: (record: any) => `${record.administeredBy?.firstName} ${record.administeredBy?.lastName}`,
    },
  ];

  const doctorNotesColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'noteDateTime',
      key: 'noteDateTime',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Type',
      dataIndex: 'noteType',
      key: 'noteType',
      render: (type: string) => <Tag color="green">{type.toUpperCase()}</Tag>,
    },
    {
      title: 'Assessment',
      dataIndex: 'assessment',
      key: 'assessment',
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
    },
    {
      title: 'Doctor',
      key: 'doctor',
      render: (record: any) => `Dr. ${record.doctor?.firstName} ${record.doctor?.lastName}`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Admission Details">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Admission Number">{admission.admissionNumber}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={admission.status === 'admitted' ? 'green' : 'default'}>
              {admission.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Patient">
            {admission.patient?.firstName} {admission.patient?.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Doctor">
            Dr. {admission.admittingDoctor?.firstName} {admission.admittingDoctor?.lastName}
          </Descriptions.Item>
          <Descriptions.Item label="Bed">
            {admission.bed?.bedNumber} - Room {admission.bed?.room?.roomNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Ward">
            {admission.bed?.room?.ward?.name}
          </Descriptions.Item>
          <Descriptions.Item label="Admitted">
            {new Date(admission.admissionDateTime).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Emergency">
            <Tag color={admission.isEmergency ? 'red' : 'default'}>
              {admission.isEmergency ? 'YES' : 'NO'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Admission Reason" span={2}>
            {admission.admissionReason}
          </Descriptions.Item>
          {admission.allergies && (
            <Descriptions.Item label="Allergies" span={2}>
              <Tag color="red">{admission.allergies}</Tag>
            </Descriptions.Item>
          )}
        </Descriptions>

        {admission.status === 'admitted' && !admission.dischargeSummary && (
          <Button
            type="primary"
            icon={<FileTextOutlined />}
            style={{ marginTop: '16px' }}
            onClick={() => navigate(`/inpatient/discharge/${admission.id}`)}
          >
            Create Discharge Summary
          </Button>
        )}
      </Card>

      <Card style={{ marginTop: '24px' }}>
        <Tabs defaultActiveKey="vitals">
          <TabPane tab="Vital Signs" key="vitals">
            <Table
              columns={vitalSignsColumns}
              dataSource={admission.vitalSigns || []}
              rowKey="id"
              size="small"
            />
          </TabPane>
          <TabPane tab="Medications" key="medications">
            <Table
              columns={medicationsColumns}
              dataSource={admission.medications || []}
              rowKey="id"
              size="small"
            />
          </TabPane>
          <TabPane tab="Nursing Notes" key="nursing">
            <Table
              columns={nursingNotesColumns}
              dataSource={admission.nursingNotes || []}
              rowKey="id"
              size="small"
            />
          </TabPane>
          <TabPane tab="Doctor Notes" key="doctor">
            <Table
              columns={doctorNotesColumns}
              dataSource={admission.doctorNotes || []}
              rowKey="id"
              size="small"
            />
          </TabPane>
          {admission.dischargeSummary && (
            <TabPane tab="Discharge Summary" key="discharge">
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Discharge Date">
                  {new Date(admission.dischargeSummary.dischargeDateTime).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Admission Diagnosis">
                  {admission.dischargeSummary.admissionDiagnosis}
                </Descriptions.Item>
                <Descriptions.Item label="Discharge Diagnosis">
                  {admission.dischargeSummary.dischargeDiagnosis}
                </Descriptions.Item>
                <Descriptions.Item label="Summary">
                  {admission.dischargeSummary.briefSummary}
                </Descriptions.Item>
                <Descriptions.Item label="Treatment Given">
                  {admission.dischargeSummary.treatmentGiven}
                </Descriptions.Item>
                <Descriptions.Item label="Condition at Discharge">
                  {admission.dischargeSummary.conditionAtDischarge}
                </Descriptions.Item>
                <Descriptions.Item label="Follow-up Instructions">
                  {admission.dischargeSummary.followUpInstructions}
                </Descriptions.Item>
                <Descriptions.Item label="Medications">
                  {admission.dischargeSummary.medicationsAtDischarge}
                </Descriptions.Item>
              </Descriptions>
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
};

export default AdmissionDetails;
