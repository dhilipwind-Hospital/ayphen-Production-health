import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Button,
  message,
  Card,
  Rate,
  Checkbox,
  Select,
  Spin,
  Typography,
  Space,
  Divider
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

interface AppointmentDetails {
  id: string;
  doctor?: { id: string; firstName: string; lastName: string };
  service?: { id: string; name: string };
  startTime: string;
  endTime: string;
  status: string;
}

interface FeedbackFormData {
  doctorRating: number;
  facilityRating: number;
  staffRating: number;
  overallRating: number;
  doctorComment?: string;
  facilityComment?: string;
  overallComment?: string;
  wouldRecommend: boolean;
  followUpNeeded: boolean;
  followUpReason?: string;
}

const AppointmentFeedback: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm<FeedbackFormData>();
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      loadAppointment();
    }
  }, [id]);

  const loadAppointment = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/appointments/${id}`);
      setAppointment(res.data);
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to load appointment details');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: FeedbackFormData) => {
    if (!id) return;

    setSubmitting(true);
    try {
      await api.post(`/appointments/${id}/feedback`, values);
      msgApi.success('Feedback submitted successfully!');
      setTimeout(() => {
        navigate('/appointments');
      }, 1500);
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <Card style={{ maxWidth: 800, margin: '0 auto', marginTop: 30 }}>
        <Title level={2}>Appointment Feedback</Title>

        {appointment && (
          <Card type="inner" style={{ marginBottom: 20, backgroundColor: '#f5f5f5' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Doctor: </Text>
                <Text>
                  {appointment.doctor?.firstName} {appointment.doctor?.lastName}
                </Text>
              </div>
              <div>
                <Text strong>Service: </Text>
                <Text>{appointment.service?.name}</Text>
              </div>
              <div>
                <Text strong>Appointment Date: </Text>
                <Text>{new Date(appointment.startTime).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</Text>
              </div>
            </Space>
          </Card>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark="optional"
        >
          <Divider>Rating Section</Divider>

          {/* Doctor Rating */}
          <Form.Item
            name="doctorRating"
            label="How would you rate the doctor?"
            rules={[{ required: true, message: 'Please rate the doctor' }]}
          >
            <Rate tooltips={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']} />
          </Form.Item>

          <Form.Item
            name="doctorComment"
            label="Additional comments about the doctor (optional)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Share your experience with the doctor..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Facility Rating */}
          <Form.Item
            name="facilityRating"
            label="How would you rate the facility/clinic?"
            rules={[{ required: true, message: 'Please rate the facility' }]}
          >
            <Rate tooltips={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']} />
          </Form.Item>

          <Form.Item
            name="facilityComment"
            label="Additional comments about the facility (optional)"
          >
            <Input.TextArea
              rows={3}
              placeholder="Share your thoughts about the facility..."
              maxLength={500}
              showCount
            />
          </Form.Item>

          {/* Staff Rating */}
          <Form.Item
            name="staffRating"
            label="How would you rate the staff?"
            rules={[{ required: true, message: 'Please rate the staff' }]}
          >
            <Rate tooltips={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']} />
          </Form.Item>

          <Divider>Overall Assessment</Divider>

          {/* Overall Rating */}
          <Form.Item
            name="overallRating"
            label="Overall experience rating"
            rules={[{ required: true, message: 'Please provide an overall rating' }]}
          >
            <Rate tooltips={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']} />
          </Form.Item>

          <Form.Item
            name="overallComment"
            label="Overall feedback (optional)"
          >
            <Input.TextArea
              rows={4}
              placeholder="Tell us about your overall experience..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          {/* Recommendation */}
          <Form.Item
            name="wouldRecommend"
            valuePropName="checked"
          >
            <Checkbox>I would recommend this doctor/facility to others</Checkbox>
          </Form.Item>

          <Divider>Follow-up</Divider>

          {/* Follow-up */}
          <Form.Item
            name="followUpNeeded"
            valuePropName="checked"
          >
            <Checkbox>I need a follow-up appointment</Checkbox>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.followUpNeeded !== currentValues.followUpNeeded}
          >
            {({ getFieldValue }) =>
              getFieldValue('followUpNeeded') ? (
                <Form.Item
                  name="followUpReason"
                  label="Reason for follow-up"
                  rules={[{ required: true, message: 'Please specify the follow-up reason' }]}
                >
                  <Select
                    placeholder="Select follow-up reason"
                    options={[
                      { value: 'test-results', label: 'Waiting for test results' },
                      { value: 'prescription-review', label: 'Prescription review' },
                      { value: 'progress-check', label: 'Progress check-up' },
                      { value: 'treatment-review', label: 'Treatment review' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item style={{ marginTop: 30 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} size="large">
                Submit Feedback
              </Button>
              <Button onClick={() => navigate('/appointments')} size="large">
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </>
  );
};

export default AppointmentFeedback;
