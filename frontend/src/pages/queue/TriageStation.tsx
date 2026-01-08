import React, { useEffect, useMemo, useState } from 'react';
import { Card, Button, Table, Space, Typography, Tag, Form, InputNumber, Input, Select, message } from 'antd';
import { callNext, getQueue, getTriage, saveTriage, advanceVisit, serveQueueItem, skipQueueItem, getAvailableDoctors, callQueueItem } from '../../services/queue.service';

const { Title } = Typography;

const TriageStation: React.FC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [triage, setTriage] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [doctors, setDoctors] = useState<any[]>([]);

  const fetchQueue = async () => {
    try {
      const items = await getQueue('triage');
      setQueue(items || []);
    } catch (_) {}
  };

  useEffect(() => {
    fetchQueue();
    // Load doctors for optional assignment
    getAvailableDoctors().then(setDoctors).catch(() => setDoctors([]));
    const t = setInterval(fetchQueue, 5000);
    return () => clearInterval(t);
  }, []);

  const onCallNext = async () => {
    try {
      const item = await callNext('triage');
      if (!item) {
        message.info('No patients waiting');
        return;
      }
      setCurrent(item);
      const tri = await getTriage(item.visitId);
      setTriage(tri);
      form.setFieldsValue({
        temperature: tri?.vitals?.temperature,
        systolic: tri?.vitals?.systolic,
        diastolic: tri?.vitals?.diastolic,
        heartRate: tri?.vitals?.heartRate,
        spo2: tri?.vitals?.spo2,
        weight: tri?.vitals?.weight,
        height: tri?.vitals?.height,
        symptoms: tri?.symptoms,
        allergies: tri?.allergies,
        currentMeds: tri?.currentMeds,
        painScale: tri?.painScale,
        priority: tri?.priority,
        notes: tri?.notes,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call next');
    }
  };

  const onSave = async (vals: any) => {
    if (!current?.visitId) return;
    try {
      setSaving(true);
      const payload = {
        vitals: {
          temperature: vals.temperature,
          systolic: vals.systolic,
          diastolic: vals.diastolic,
          heartRate: vals.heartRate,
          spo2: vals.spo2,
          weight: vals.weight,
          height: vals.height,
        },
        symptoms: vals.symptoms,
        allergies: vals.allergies,
        currentMeds: vals.currentMeds,
        painScale: vals.painScale,
        priority: vals.priority,
        notes: vals.notes,
      };
      await saveTriage(current.visitId, payload);
      await advanceVisit(current.visitId, 'doctor', vals?.doctorId);
      // mark current queue item served
      try { await serveQueueItem(current.id); } catch {}
      message.success('Triage saved and sent to Doctor');
      setCurrent(null);
      setTriage(null);
      form.resetFields();
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to save triage');
    } finally {
      setSaving(false);
    }
  };

  const onSkip = async () => {
    if (!current?.id) return;
    try {
      await skipQueueItem(current.id);
      message.info('Skipped current token');
      setCurrent(null);
      setTriage(null);
      form.resetFields();
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to skip');
    }
  };

  const onCallThis = async (r: any) => {
    try {
      const item = await callQueueItem(r.id);
      if (!item) { message.info('Item not available'); return; }
      setCurrent(item);
      const tri = await getTriage(item.visitId);
      setTriage(tri);
      form.setFieldsValue({
        temperature: tri?.vitals?.temperature,
        systolic: tri?.vitals?.systolic,
        diastolic: tri?.vitals?.diastolic,
        heartRate: tri?.vitals?.heartRate,
        spo2: tri?.vitals?.spo2,
        weight: tri?.vitals?.weight,
        height: tri?.vitals?.height,
        symptoms: tri?.symptoms,
        allergies: tri?.allergies,
        currentMeds: tri?.currentMeds,
        painScale: tri?.painScale,
        priority: tri?.priority,
        notes: tri?.notes,
      });
      fetchQueue();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to call this patient');
    }
  };

  const statusColor = (s: string) => (s === 'served' ? 'green' : s === 'called' ? 'gold' : s === 'skipped' ? 'volcano' : 'blue');
  const columns = useMemo(() => [
    { title: 'Token', dataIndex: 'tokenNumber', key: 'token', render: (t: string) => <Tag color="magenta">{t}</Tag> },
    { title: 'Patient', key: 'patient', render: (_: any, r: any) => {
        const p = r?.visit?.patient || {};
        const name = `${p.firstName || ''} ${p.lastName || ''}`.trim();
        return name || '-';
      }
    },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', render: (p: string) => <Tag color={p==='emergency'?'red':p==='urgent'?'orange':'blue'}>{p}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status',
      filters: [
        { text: 'Waiting', value: 'waiting' },
        { text: 'Called', value: 'called' },
        { text: 'Served', value: 'served' },
        { text: 'Skipped', value: 'skipped' },
      ],
      onFilter: (v: any, r: any) => r.status === v,
      render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag>
    },
    { title: 'Action', key: 'action', render: (_: any, r: any) => (
        <Button size="small" onClick={() => onCallThis(r)} disabled={r.status === 'called'}>
          Call This
        </Button>
      )
    },
  ], []);

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={4}>Triage Station</Title>

      <Card title="Waiting List" extra={<Button onClick={onCallNext} type="primary">Call Next</Button>}>
        <Table rowKey="id" dataSource={queue} columns={columns} pagination={{ pageSize: 8 }} />
      </Card>

      {current && (
        <Card title={`Current: ${current.tokenNumber}`}>
          <Form layout="vertical" form={form} onFinish={onSave}>
            <Space size="large" wrap>
              <Form.Item label="Temperature (°C)" name="temperature"><InputNumber min={30} max={45} step={0.1} /></Form.Item>
              <Form.Item label="Systolic" name="systolic"><InputNumber min={60} max={220} /></Form.Item>
              <Form.Item label="Diastolic" name="diastolic"><InputNumber min={40} max={140} /></Form.Item>
              <Form.Item label="Heart Rate" name="heartRate"><InputNumber min={30} max={220} /></Form.Item>
              <Form.Item label="SpO2 (%)" name="spo2"><InputNumber min={50} max={100} /></Form.Item>
              <Form.Item label="Weight (kg)" name="weight"><InputNumber min={1} max={400} /></Form.Item>
              <Form.Item label="Height (cm)" name="height"><InputNumber min={30} max={250} /></Form.Item>
            </Space>
            <Form.Item label="Symptoms" name="symptoms"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item label="Allergies" name="allergies"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item label="Current Medications" name="currentMeds"><Input.TextArea rows={2} /></Form.Item>
            <Space>
              <Form.Item label="Pain Scale" name="painScale"><InputNumber min={0} max={10} /></Form.Item>
              <Form.Item label="Priority" name="priority"><Select options={[{value:'standard',label:'Standard'},{value:'urgent',label:'Urgent'},{value:'emergency',label:'Emergency'}]} style={{ width: 160 }} /></Form.Item>
            </Space>
            <Form.Item label="Assign Doctor (optional)" name="doctorId">
              <Select
                placeholder="Select doctor"
                allowClear
                options={(doctors || []).map((d: any) => ({ value: d.id, label: `${d.firstName || ''} ${d.lastName || ''}${d.department ? ' — ' + d.department : ''}`.trim() }))}
                style={{ maxWidth: 360 }}
              />
            </Form.Item>
            <Form.Item label="Notes" name="notes"><Input.TextArea rows={3} /></Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>Save & Send to Doctor</Button>
              <Button onClick={onSkip}>Skip</Button>
              <Button onClick={() => { setCurrent(null); setTriage(null); form.resetFields(); }}>Cancel</Button>
            </Space>
          </Form>
        </Card>
      )}
    </Space>
  );
};

export default TriageStation;
