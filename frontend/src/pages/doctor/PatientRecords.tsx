import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Table, Tag, Button, Modal, Form, Input, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title } = Typography;

interface ReportRow {
  id: string;
  type: 'lab' | 'imaging' | 'prescription' | 'note' | 'discharge' | 'other';
  title: string;
  content?: string | null;
  createdAt: string;
}

const PatientRecords: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [msgApi, contextHolder] = message.useMessage();
  const [referrals, setReferrals] = useState<{ id: string; name: string }[]>([]);
  const [accessDenied, setAccessDenied] = useState(false);

  const load = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await api.get(`/patients/${patientId}/reports`);
      setData(res.data || []);
      setAccessDenied(false);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) {
        setAccessDenied(true);
        msgApi.error('Access restricted by department policy (FR-001)');
      } else {
        msgApi.error(e?.response?.data?.message || 'Failed to load records');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [patientId]);

  useEffect(() => {
    const fetchRefs = async () => {
      if (!patientId) return;
      try {
        const r = await api.get(`/patients/${patientId}/referrals/doctor`, { suppressErrorToast: true } as any);
        const items = (r.data || []) as Array<{ department?: { id: string; name: string }; departmentId?: string; }>; 
        const mapped = items.map(x => ({ id: x.department?.id || x.departmentId || '', name: x.department?.name || '—' })).filter(x => x.id);
        setReferrals(mapped);
      } catch { /* ignore */ }
    };
    fetchRefs();
  }, [patientId]);

  const columns: ColumnsType<ReportRow> = [
    { title: 'Title', dataIndex: 'title' },
    { title: 'Type', dataIndex: 'type', render: (t) => <Tag>{String(t).toUpperCase()}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ];

  const onCreate = async (values: any) => {
    if (!patientId) return;
    if (accessDenied) {
      msgApi.error('You cannot add a note. Access is restricted by department policy (FR-001).');
      return;
    }
    try {
      await api.post('/reports', {
        patientId,
        type: 'note',
        title: values.title,
        content: values.content || ''
      });
      msgApi.success('Note added');
      setModalOpen(false);
      form.resetFields();
      load();
    } catch (e: any) {
      msgApi.error(e?.response?.data?.message || 'Failed to add note');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Patient Records</Title>
          <div style={{ marginTop: 8 }}>
            <Space size={4} wrap>
              {referrals.map(dep => <Tag key={dep.id}>{dep.name}</Tag>)}
              {!referrals.length && <span style={{ color: '#999' }}>No referrals</span>}
            </Space>
          </div>
        </div>
        <Button type="primary" onClick={() => setModalOpen(true)} disabled={accessDenied}>Add Note</Button>
      </div>

      {contextHolder}
      {accessDenied ? (
        <Card>
          <Title level={4} style={{ marginTop: 0 }}>Access restricted</Title>
          <p style={{ color: '#64748b' }}>
            You do not currently have permission to view this patient's records. Access is granted to doctors in the
            patient's primary department or via referral to your department, as per FR-001.
          </p>
          <Space>
            <Button
              type="primary"
              onClick={async () => {
                try {
                  if (!patientId) return;
                  // Get doctor's department via /users/me
                  const me = await api.get('/users/me', { suppressErrorToast: true } as any);
                  const departmentId = me?.data?.department?.id;
                  if (!departmentId) {
                    msgApi.error('Your profile is missing a department. Contact admin.');
                    return;
                  }
                  // Create referral as doctor
                  await api.post(`/patients/${patientId}/referrals/doctor`, { departmentId } as any);
                  msgApi.success('Referral created. Access granted.');
                  // Reload reports
                  setAccessDenied(false);
                  load();
                } catch (e: any) {
                  msgApi.error(e?.response?.data?.message || 'Failed to request access');
                }
              }}
            >
              Request Access
            </Button>
            <Button onClick={() => navigate('/doctor/my-patients')}>Back to My Patients</Button>
          </Space>
        </Card>
      ) : (
        <Card>
          <Table
            loading={loading}
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      <Modal
        title="Add Note"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form layout="vertical" form={form} onFinish={onCreate}>
          <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="e.g. Follow-up notes" />
          </Form.Item>
          <Form.Item label="Content" name="content">
            <Input.TextArea rows={4} placeholder="Enter details..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PatientRecords;
