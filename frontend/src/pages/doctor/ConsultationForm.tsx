import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Divider, Row, Col, DatePicker, Space } from 'antd';
import { SaveOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;

interface ConsultationFormData {
  appointmentId: string;
  patientId: string;
  chiefComplaint?: string;
  historyPresentIllness?: string;
  pastMedicalHistory?: string;
  currentMedications?: string;
  physicalExamination?: string;
  assessment?: string;
  plan?: string;
  doctorNotes?: string;
  followUpDate?: string;
  followUpInstructions?: string;
}

const ConsultationForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [consultation, setConsultation] = useState<any>(null);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [appointmentInfo, setAppointmentInfo] = useState<any>(null);
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();

  useEffect(() => {
    if (appointmentId) {
      loadAppointmentData();
    } else if (location.state?.patientId) {
      setPatientInfo(location.state.patient);
    }
  }, [appointmentId]);

  const loadAppointmentData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/appointments/${appointmentId}`);
      const appointment = res.data;
      setAppointmentInfo(appointment);
      setPatientInfo(appointment.patient);

      // Check if consultation already exists
      try {
        const consultRes = await api.get(`/consultations/patient/${appointment.patient.id}`);
        const existingConsult = consultRes.data?.data?.find(
          (c: any) => c.appointment?.id === appointmentId
        );
        if (existingConsult) {
          setConsultation(existingConsult);
          form.setFieldsValue({
            chiefComplaint: existingConsult.chiefComplaint,
            historyPresentIllness: existingConsult.historyPresentIllness,
            pastMedicalHistory: existingConsult.pastMedicalHistory,
            currentMedications: existingConsult.currentMedications,
            physicalExamination: existingConsult.physicalExamination,
            assessment: existingConsult.assessment,
            plan: existingConsult.plan,
            doctorNotes: existingConsult.doctorNotes,
            followUpDate: existingConsult.followUpDate ? dayjs(existingConsult.followUpDate) : null,
            followUpInstructions: existingConsult.followUpInstructions
          });
        }
      } catch (err) {
        // No existing consultation
      }
    } catch (error: any) {
      message.error('Failed to load appointment data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const data: ConsultationFormData = {
        appointmentId: appointmentId || '',
        patientId: patientInfo?.id || location.state?.patientId,
        ...values,
        followUpDate: values.followUpDate ? values.followUpDate.toISOString() : undefined
      };

      if (consultation) {
        // Update existing
        await api.put(`/consultations/${consultation.id}`, data);
        message.success('Consultation updated successfully');
      } else {
        // Create new
        const res = await api.post('/consultations', data);
        setConsultation(res.data.data);
        message.success('Consultation saved successfully');
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to save consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleSign = async () => {
    if (!consultation) {
      message.error('Please save the consultation first');
      return;
    }

    try {
      setSigning(true);
      await api.post(`/consultations/${consultation.id}/sign`);
      message.success('Consultation signed successfully');
      navigate('/doctor/appointments');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to sign consultation');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return <Card loading />;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <div>
            <h2 style={{ margin: 0 }}>Consultation Note</h2>
            {patientInfo && (
              <div style={{ fontSize: 14, fontWeight: 'normal', marginTop: 8 }}>
                Patient: {patientInfo.firstName} {patientInfo.lastName} | 
                Age: {patientInfo.dateOfBirth ? dayjs().diff(dayjs(patientInfo.dateOfBirth), 'year') : 'N/A'} | 
                Gender: {patientInfo.gender || 'N/A'}
              </div>
            )}
          </div>
        }
        extra={
          consultation?.isSigned ? (
            <span style={{ color: '#52c41a' }}>
              <CheckOutlined /> Signed
            </span>
          ) : null
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          disabled={consultation?.isSigned}
        >
          <Divider orientation="left">Subjective</Divider>
          
          <Form.Item
            label="Chief Complaint"
            name="chiefComplaint"
            rules={[{ required: true, message: 'Please enter chief complaint' }]}
          >
            <TextArea rows={2} placeholder="Main reason for visit..." />
          </Form.Item>

          <Form.Item
            label="History of Present Illness"
            name="historyPresentIllness"
          >
            <TextArea rows={4} placeholder="Detailed history of current condition..." />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Past Medical History"
                name="pastMedicalHistory"
              >
                <TextArea rows={3} placeholder="Previous medical conditions..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Current Medications"
                name="currentMedications"
              >
                <TextArea rows={3} placeholder="Current medications and dosages..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Objective</Divider>

          <Form.Item
            label="Physical Examination"
            name="physicalExamination"
          >
            <TextArea rows={4} placeholder="Physical examination findings..." />
          </Form.Item>

          <Divider orientation="left">Assessment & Plan</Divider>

          <Form.Item
            label="Assessment"
            name="assessment"
          >
            <TextArea rows={3} placeholder="Clinical assessment and diagnosis..." />
          </Form.Item>

          <Form.Item
            label="Plan"
            name="plan"
          >
            <TextArea rows={4} placeholder="Treatment plan and recommendations..." />
          </Form.Item>

          <Form.Item
            label="Doctor's Notes"
            name="doctorNotes"
          >
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>

          <Divider orientation="left">Follow-up</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Follow-up Date"
                name="followUpDate"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Follow-up Instructions"
                name="followUpInstructions"
              >
                <TextArea rows={2} placeholder="Instructions for follow-up..." />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
                disabled={consultation?.isSigned}
              >
                Save Consultation
              </Button>
              {consultation && !consultation.isSigned && (
                <Button
                  type="default"
                  icon={<CheckOutlined />}
                  onClick={handleSign}
                  loading={signing}
                  style={{ background: '#52c41a', color: 'white' }}
                >
                  Sign & Complete
                </Button>
              )}
              <Button onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ConsultationForm;
