import React, { useEffect, useMemo, useState } from 'react';
import { Card, Table, Tag, Space, Button, Input, Select, Typography, Drawer, Form, InputNumber, App, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

interface Department { id: string; name: string }
interface ServiceRow {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'maintenance' | string;
  averageDuration?: number;
  department?: Department;
}

const ServicesAdmin: React.FC = () => {
  const [data, setData] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/services', { params: { page: 1, limit: 100, search: query || undefined, departmentId, status }, suppressErrorToast: true } as any);
      const items = res.data?.data || res.data || [];
      setData(items);
      setLoadError(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to load services';
      setLoadError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDeps = async () => {
      try {
        const res = await api.get('/departments', { params: { page: 1, limit: 100 }, suppressErrorToast: true } as any);
        setDepartments(res.data?.data || res.data || []);
      } catch {}
    };
    loadDeps();
  }, []);

  useEffect(() => { load(); }, [query, departmentId, status]);

  const openNew = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: ServiceRow) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      description: row.description,
      departmentId: row.department?.id,
      status: row.status || 'active',
      averageDuration: row.averageDuration,
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/services/${editing.id}`, values as any);
        message.success('Service updated');
      } else {
        await api.post('/services', values as any);
        message.success('Service created');
      }
      setOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return; // form validation errors
      message.error(e?.response?.data?.message || 'Failed to save service');
    }
  };

  const toggleStatus = async (row: ServiceRow) => {
    try {
      const next = (row.status === 'active') ? 'inactive' : 'active';
      await api.patch(`/services/${row.id}/status`, { status: next } as any);
      message.success(`Service ${next === 'active' ? 'activated' : 'deactivated'}`);
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update status');
    }
  };

  const bulkSetStatus = async (statusValue: 'active' | 'inactive') => {
    if (!selectedRowKeys.length) return;
    try {
      await Promise.all(selectedRowKeys.map(id => api.patch(`/services/${id}/status`, { status: statusValue } as any)));
      message.success(statusValue === 'active' ? 'Activated selected' : 'Deactivated selected');
      setSelectedRowKeys([]);
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update selected');
    }
  };

  const exportCsv = () => {
    try {
      const header = ['Name','Department','Status','Avg. Duration','Description'];
      const rows = data.map(r => [
        r.name,
        r.department?.name || '',
        r.status || '',
        r.averageDuration ? String(r.averageDuration) : '',
        (r.description || '').replace(/\n/g, ' ')
      ]);
      const csv = [header, ...rows]
        .map(row => row.map(v => String(v ?? '').replace(/"/g,'""')).map(v => `"${v}"`).join(','))
        .join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'services.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Failed to export');
    }
  };

  const columns: ColumnsType<ServiceRow> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Department', key: 'department', render: (_, r) => r.department?.name || '—' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'maintenance' ? 'orange' : 'red'}>{(s || '—').toUpperCase()}</Tag> },
    { title: 'Avg. Duration', dataIndex: 'averageDuration', render: (v: number) => v ? `${v} min` : '—' },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    { title: 'Actions', key: 'actions', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
        <Button size="small" danger={r.status === 'active'} onClick={() => toggleStatus(r)}>
          {r.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
      </Space>
    )}
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Manage Services</Title>
        <Space>
          <Input.Search placeholder="Search services" allowClear onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} />
          <Select placeholder="Department" allowClear style={{ minWidth: 220 }} value={departmentId} onChange={setDepartmentId} showSearch optionFilterProp="children">
            {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
          </Select>
          <Select placeholder="Status" allowClear style={{ minWidth: 160 }} value={status} onChange={setStatus}>
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
            <Option value="maintenance">Maintenance</Option>
          </Select>
          <Button type="primary" onClick={openNew}>New Service</Button>
        </Space>
      </div>
      {loadError && (
        <Alert type="error" message={loadError} showIcon style={{ marginBottom: 12 }} />
      )}
      <Card>
        <Space style={{ marginBottom: 8 }}>
          <Button disabled={!selectedRowKeys.length} onClick={() => bulkSetStatus('active')}>Activate Selected</Button>
          <Button disabled={!selectedRowKeys.length} onClick={() => bulkSetStatus('inactive')}>Deactivate Selected</Button>
          <Button onClick={exportCsv}>Export CSV</Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{ pageSize: 10 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        />
      </Card>

      <Drawer
        title={editing ? 'Edit Service' : 'New Service'}
        placement="right"
        width={480}
        onClose={() => setOpen(false)}
        open={open}
        extra={<Space><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={onSubmit}>{editing ? 'Save' : 'Create'}</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Department" name="departmentId" rules={[{ required: true, message: 'Please select a department' }]}>
            <Select showSearch optionFilterProp="children" placeholder="Select department">
              {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Status" name="status" initialValue="active">
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Average Duration (min)" name="averageDuration">
            <InputNumber style={{ width: '100%' }} min={1} max={600} />
          </Form.Item>
          <Form.Item label="Description" name="description" rules={[{ required: true, message: 'Please enter a short description' }] }>
            <Input.TextArea rows={4} placeholder="Describe this service" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default ServicesAdmin;
