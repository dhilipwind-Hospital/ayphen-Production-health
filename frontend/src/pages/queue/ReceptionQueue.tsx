import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Tag, message, Select } from 'antd';
import { createVisit, getQueue, advanceVisit, serveQueueItem } from '../../services/queue.service';
import patientService from '../../services/patientService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const ReceptionQueue: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [lastToken, setLastToken] = useState<string | null>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<number | null>(null);
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);

  const fetchQueue = async () => {
    try {
      const items = await getQueue('reception');
      setQueue(items || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchQueue();
    fetchPatients();
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const onCreate = async (values: any) => {
    try {
      setLoading(true);
      const res = await createVisit(values.patientId);
      const token = res?.queueItem?.tokenNumber;
      if (token) {
        setLastToken(token);
        message.success(`Token issued: ${token}`);
      }
      form.resetFields();
      fetchQueue();
      fetchPatients();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to create visit');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      setPatientLoading(true);
      const { data } = await patientService.getPatients({ limit: 10, sortBy: 'user.createdAt', sortOrder: 'desc' as any });
      setPatients(Array.isArray(data) ? data : []);
    } catch (_) {
      setPatients([]);
    } finally {
      setPatientLoading(false);
    }
  };

  const doSearch = async (q: string) => {
    if (!q || q.length < 2) { setOptions([]); return; }
    try {
      setSearching(true);
      const { data } = await patientService.getPatients({ search: q, limit: 10 });
      const opts = (data || []).map((p: any) => ({
        label: `${p.firstName} ${p.lastName} — ${p.email || ''} — ${p.phone || ''}`.trim(),
        value: p.id,
        pid: p.displayPatientId || '',
      }));
      setOptions(opts);
    } catch (_) {
      setOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const onSearch = (text: string) => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => doSearch(text), 250) as any;
  };

  const columns = useMemo(() => [
    { title: 'Token', dataIndex: 'tokenNumber', key: 'token', render: (t: string) => <Tag color="magenta">{t}</Tag> },
    { title: 'Stage', dataIndex: 'stage', key: 'stage' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: string) => <Tag color={p==='emergency'?'red':p==='urgent'?'orange':'blue'}>{p}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status' },
    { title: 'Action', key: 'action', render: (_: any, r: any) => (
      <Space>
        <Button size="small" type="primary" onClick={async () => {
          try {
            setLoading(true);
            await advanceVisit(r.visitId, 'triage');
            // Mark current queue item served in reception
            await serveQueueItem(r.id);
            message.success('Sent to Triage');
            fetchQueue();
          } catch (e: any) {
            message.error(e?.response?.data?.message || 'Failed to advance to triage');
          } finally {
            setLoading(false);
          }
        }}>Advance to Triage</Button>
      </Space>
    ) },
  ], []);

  const patientCols = useMemo(() => [
    { title: 'Name', key: 'name', render: (_: any, r: any) => `${r.firstName || ''} ${r.lastName || ''}`.trim() },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Action', key: 'action', render: (_: any, r: any) => (
      <Button size="small" onClick={async () => {
        try {
          setLoading(true);
          const res = await createVisit(r.id);
          const token = res?.queueItem?.tokenNumber;
          if (token) {
            setLastToken(token);
            message.success(`Token issued: ${token}`);
          }
          fetchQueue();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to create visit');
        } finally {
          setLoading(false);
        }
      }}>Create Visit</Button>
    ) }
  ], [loading]);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={4}>Reception Queue</Title>
      <Card>
        <Form layout="inline" form={form} onFinish={onCreate}>
          <Form.Item name="patientId" rules={[{ required: true, message: 'Select a patient or enter patient code' }]}>
            <Select
              showSearch
              placeholder="Search patient by name/phone/email or enter PID/UUID"
              filterOption={false}
              onSearch={onSearch}
              loading={searching}
              options={options}
              style={{ width: 420 }}
              allowClear
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  <div style={{ padding: 8 }}>
                    <Input
                      placeholder="Or paste PID/UUID here and press Enter"
                      onPressEnter={(e: any) => {
                        const v = String(e.target.value || '').trim();
                        if (v) { form.setFieldsValue({ patientId: v }); (e.target as any).value=''; }
                      }}
                    />
                  </div>
                </div>
              )}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Create Visit</Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={() => navigate('/patients/new')}>+ Add Patient</Button>
          </Form.Item>
          {lastToken && (
            <Form.Item>
              <Text type="success">Last token: <Tag color="green">{lastToken}</Tag></Text>
            </Form.Item>
          )}
        </Form>
      </Card>

      <Card title="Waiting List">
        <Table rowKey="id" dataSource={queue} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>

      <Card title="Patients">
        <Table rowKey="id" dataSource={patients} columns={patientCols} loading={patientLoading} pagination={false} />
      </Card>
    </Space>
  );
};

export default ReceptionQueue;
