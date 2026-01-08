import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import { SaveOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { TextArea } = Input;

const DischargeSummary: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [admission, setAdmission] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchAdmission(id);
    }
  }, [id]);

  const fetchAdmission = async (admissionId: string) => {
    try {
      const response = await api.get(`/inpatient/admissions/${admissionId}`);
      setAdmission(response.data.admission);
    } catch (error) {
      console.error('Error fetching admission:', error);
      message.error('Failed to fetch admission details');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await api.post('/inpatient/discharge-summary', {
        admissionId: id,
        ...values
      });
      message.success('Discharge summary created successfully');
      navigate(`/inpatient/admissions/${id}`);
    } catch (error) {
      console.error('Error creating discharge summary:', error);
      message.error('Failed to create discharge summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <Card title="Discharge Summary">
        {admission && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f2f5', borderRadius: '8px' }}>
            <p><strong>Patient:</strong> {admission.patient?.firstName} {admission.patient?.lastName}</p>
            <p><strong>Admission #:</strong> {admission.admissionNumber}</p>
            <p><strong>Admitted:</strong> {new Date(admission.admissionDateTime).toLocaleString()}</p>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="Admission Diagnosis"
            name="admissionDiagnosis"
            rules={[{ required: true, message: 'Please enter admission diagnosis' }]}
          >
            <TextArea rows={2} placeholder="Diagnosis at admission" />
          </Form.Item>

          <Form.Item
            label="Discharge Diagnosis"
            name="dischargeDiagnosis"
            rules={[{ required: true, message: 'Please enter discharge diagnosis' }]}
          >
            <TextArea rows={2} placeholder="Final diagnosis at discharge" />
          </Form.Item>

          <Form.Item
            label="Brief Summary of Hospital Stay"
            name="briefSummary"
            rules={[{ required: true, message: 'Please enter summary' }]}
          >
            <TextArea rows={4} placeholder="Summary of patient's hospital stay" />
          </Form.Item>

          <Form.Item
            label="Treatment Given"
            name="treatmentGiven"
            rules={[{ required: true, message: 'Please enter treatment details' }]}
          >
            <TextArea rows={4} placeholder="Details of treatment provided" />
          </Form.Item>

          <Form.Item
            label="Condition at Discharge"
            name="conditionAtDischarge"
            rules={[{ required: true, message: 'Please enter condition' }]}
          >
            <TextArea rows={2} placeholder="Patient's condition at discharge" />
          </Form.Item>

          <Form.Item
            label="Follow-up Instructions"
            name="followUpInstructions"
            rules={[{ required: true, message: 'Please enter follow-up instructions' }]}
          >
            <TextArea rows={3} placeholder="Follow-up appointments and instructions" />
          </Form.Item>

          <Form.Item
            label="Medications at Discharge"
            name="medicationsAtDischarge"
            rules={[{ required: true, message: 'Please enter medications' }]}
          >
            <TextArea rows={4} placeholder="List of medications with dosage and duration" />
          </Form.Item>

          <Form.Item
            label="Dietary Instructions"
            name="dietaryInstructions"
          >
            <TextArea rows={2} placeholder="Diet recommendations (optional)" />
          </Form.Item>

          <Form.Item
            label="Activity Instructions"
            name="activityInstructions"
          >
            <TextArea rows={2} placeholder="Activity and exercise guidelines (optional)" />
          </Form.Item>

          <Form.Item
            label="Special Instructions"
            name="specialInstructions"
          >
            <TextArea rows={2} placeholder="Any special care instructions (optional)" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              Create Discharge Summary
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DischargeSummary;
