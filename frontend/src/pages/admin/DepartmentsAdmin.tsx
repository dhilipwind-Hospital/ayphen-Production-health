import React, { useEffect, useState } from 'react';
import { Card, Table, Space, Button, Input, Typography, Tag, Drawer, Form, Select, App, Modal } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../services/api';

const { Title } = Typography;

type Department = {
  id: string;
  name: string;
  description?: string;
  status?: string;
  servicesCount?: number;
};

const DepartmentsAdmin: React.FC = () => {
  const [data, setData] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      // Add cache-busting parameter to force fresh GET (prevents 304 Not Modified)
      const cacheParam = new Date().getTime();
      const res = await api.get('/departments', { params: { page: 1, limit: 200, t: cacheParam } } as any);
      const rows: Department[] = res.data?.data || res.data || [];
      const filtered = query ? rows.filter(d => (d.name || '').toLowerCase().includes(query.toLowerCase())) : rows;
      setData(filtered);
      console.log('Loaded departments:', rows);
    } catch (e: any) {
      console.error('Failed to load departments:', e);
      message.error(e?.response?.data?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [query]);

  const openNew = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };

  const openEdit = (row: Department) => {
    setEditing(row);
    form.setFieldsValue({
      name: row.name,
      description: row.description,
      status: row.status || 'active',
    });
    setOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await api.put(`/departments/${editing.id}`, values as any);
        message.success('Department updated');
      } else {
        await api.post('/departments', values as any);
        message.success('Department created');
      }
      setOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.response?.data?.message || 'Failed to save department');
    }
  };

  const toggleStatus = async (row: Department) => {
    try {
      const next = (row.status === 'active') ? 'inactive' : 'active';
      await api.patch(`/departments/${row.id}/status`, { status: next } as any);
      message.success(`Department ${next === 'active' ? 'activated' : 'deactivated'}`);
      load();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update status');
    }
  };

  const deleteDepartment = (row: Department) => {
    Modal.confirm({
      title: 'Delete department?',
      content: `This will remove ${row.name}. This action cannot be undone.`,
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.delete(`/departments/${row.id}` as any);
          message.success('Department deleted');
          load();
        } catch (e: any) {
          message.error(e?.response?.data?.message || 'Failed to delete department');
        }
      }
    });
  };

  const exportDepartmentsCsv = async () => {
    try {
      const res = await api.get('/departments/export/csv' as any, { responseType: 'blob' } as any);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'departments.csv'; a.click();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to export departments');
    }
  };

  const columns: ColumnsType<Department> = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'active' ? 'green' : s === 'inactive' ? 'red' : 'default'}>{(s || '—').toUpperCase()}</Tag> },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    { title: 'Services', dataIndex: 'servicesCount', render: (v: number) => v ?? '—' },
    { title: 'Actions', key: 'actions', render: (_, r) => (
      <Space>
        <Button size="small" onClick={() => openEdit(r)}>Edit</Button>
        <Button size="small" danger={r.status === 'active'} onClick={() => toggleStatus(r)}>
          {r.status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
        <Button size="small" danger onClick={() => deleteDepartment(r)}>Delete</Button>
      </Space>
    )}
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Departments (Admin)</Title>
        <Space>
          <Input.Search placeholder="Search departments" allowClear onSearch={setQuery} onChange={(e) => setQuery(e.target.value)} />
          <Button onClick={exportDepartmentsCsv}>Export CSV</Button>
          <Button type="primary" onClick={openNew}>New Department</Button>
        </Space>
      </div>
      <Card>
        <Table rowKey="id" loading={loading} dataSource={data} columns={columns} pagination={{ pageSize: 10 }} />
      </Card>
      <Drawer
        title={editing ? 'Edit Department' : 'New Department'}
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
          <Form.Item label="Status" name="status" initialValue="active">
            <Select>
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default DepartmentsAdmin;
