import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Table, Space, Typography, Tag, message, Descriptions } from 'antd';
import { callNext, getQueue, getTriage, advanceVisit, serveQueueItem, skipQueueItem } from '../../services/queue.service';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;

const DoctorConsole: React.FC = () => {
  const { user } = useAuth();
  const doctorId = (user as any)?.id as string | undefined;
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [triage, setTriage] = useState<any | null>(null);

  const fetchQueue = async () => {
    try {
      const items = await getQueue('doctor', doctorId);
      setQueue(items || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchQueue();
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const onCallNext = async () => {
    try {
      const item = await callNext('doctor', doctorId);
      if (!item) {
        message.info('No patients waiting');
        return;
      }
      setCurrent(item);
      const tri = await getTriage(item.visitId);
      setTriage(tri);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call next');
    }
  };

  const onSendToBilling = async () => {
    if (!current?.visitId) return;
    try {
      await advanceVisit(current.visitId, 'billing');
      // mark current served
      try { await serveQueueItem(current.id); } catch {}
      message.success('Sent to Billing');
      setCurrent(null);
      setTriage(null);
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to advance');
    }
  };

  const onSkip = async () => {
    if (!current?.id) return;
    try {
      await skipQueueItem(current.id);
      message.info('Skipped current token');
      setCurrent(null);
      setTriage(null);
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to skip');
    }
  };

  const columns = useMemo(() => [
    { title: 'Token', dataIndex: 'tokenNumber', key: 'token', render: (t: string) => <Tag color="magenta">{t}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: string) => <Tag color={p==='emergency'?'red':p==='urgent'?'orange':'blue'}>{p}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status' },
  ], []);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={4}>Doctor Console</Title>

      <Card title="Waiting List" extra={<Button onClick={onCallNext} type="primary">Call Next</Button>}>
        <Table rowKey="id" dataSource={queue} columns={columns} pagination={{ pageSize: 8 }} />
      </Card>

      {current && (
        <Card title={`Current: ${current.tokenNumber}`} extra={<Space><Button onClick={onSkip}>Skip</Button><Button onClick={onSendToBilling} type="primary">Send to Billing</Button></Space>}>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Token">{current.tokenNumber}</Descriptions.Item>
            <Descriptions.Item label="Priority"><Tag color={current.priority==='emergency'?'red':current.priority==='urgent'?'orange':'blue'}>{current.priority}</Tag></Descriptions.Item>
          </Descriptions>
          <div style={{ height: 12 }} />
          {triage ? (
            <Descriptions bordered size="small" column={2} title="Triage">
              <Descriptions.Item label="Temp">{triage?.vitals?.temperature ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="BP">{triage?.vitals?.systolic ?? '-'} / {triage?.vitals?.diastolic ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="HR">{triage?.vitals?.heartRate ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="SpO2">{triage?.vitals?.spo2 ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Weight">{triage?.vitals?.weight ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Height">{triage?.vitals?.height ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Symptoms" span={2}>{triage?.symptoms || '-'}</Descriptions.Item>
              <Descriptions.Item label="Allergies" span={2}>{triage?.allergies || '-'}</Descriptions.Item>
              <Descriptions.Item label="Current Meds" span={2}>{triage?.currentMeds || '-'}</Descriptions.Item>
              <Descriptions.Item label="Pain Scale">{triage?.painScale ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Priority"><Tag color={triage?.priority==='emergency'?'red':triage?.priority==='urgent'?'orange':'blue'}>{triage?.priority || '-'}</Tag></Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{triage?.notes || '-'}</Descriptions.Item>
            </Descriptions>
          ) : (
            <div>No triage data</div>
          )}
        </Card>
      )}
    </Space>
  );
};

export default DoctorConsole;
