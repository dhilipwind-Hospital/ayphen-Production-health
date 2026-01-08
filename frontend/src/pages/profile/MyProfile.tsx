import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Select, DatePicker, Typography, Space, message, Upload, Avatar } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title } = Typography;
const { Option } = Select;

const MyProfile: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>();

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/me');
      const me = res.data || {};
      setAvatar(me.profileImage);
      form.setFieldsValue({
        ...me,
        dateOfBirth: me.dateOfBirth ? dayjs(me.dateOfBirth, 'YYYY-MM-DD') : undefined,
      });
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
      };
      await api.patch('/users/me', payload);
      message.success('Profile updated');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post('/users/me/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } } as any);
      setAvatar(res.data?.photoUrl);
      message.success('Photo uploaded');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
    return false as any;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>My Profile</Title>
        <Space>
          <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
            <Button icon={<UploadOutlined />} loading={uploading}>Upload Photo</Button>
          </Upload>
          <Avatar size={48} src={avatar} icon={<UserOutlined />} />
        </Space>
      </div>
      <Card loading={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ gender: 'male' }}>
          <Space size={16} style={{ display: 'flex', flexWrap: 'wrap' }}>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]} style={{ minWidth: 260, flex: 1 }}>
              <Input prefix={<UserOutlined />} placeholder="First name" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]} style={{ minWidth: 260, flex: 1 }}>
              <Input placeholder="Last name" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Enter valid email' }]} style={{ minWidth: 260, flex: 1 }}>
              <Input prefix={<MailOutlined />} placeholder="Email" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" rules={[{ required: true }]} style={{ minWidth: 260, flex: 1 }}>
              <Input prefix={<PhoneOutlined />} placeholder="Phone" />
            </Form.Item>
            <Form.Item name="dateOfBirth" label="Date of Birth" style={{ minWidth: 260, flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="gender" label="Gender" style={{ minWidth: 260, flex: 1 }}>
              <Select>
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
                <Option value="prefer_not_to_say">Prefer not to say</Option>
              </Select>
            </Form.Item>
            <Form.Item name="address" label="Address" style={{ minWidth: 540, flex: 1 }}>
              <Input prefix={<HomeOutlined />} placeholder="Street address" />
            </Form.Item>
            <Form.Item name="city" label="City" style={{ minWidth: 260, flex: 1 }}>
              <Input placeholder="City" />
            </Form.Item>
            <Form.Item name="state" label="State/Province" style={{ minWidth: 260, flex: 1 }}>
              <Input placeholder="State" />
            </Form.Item>
            <Form.Item name="country" label="Country" style={{ minWidth: 260, flex: 1 }}>
              <Input placeholder="Country" />
            </Form.Item>
            <Form.Item name="postalCode" label="Postal Code" style={{ minWidth: 260, flex: 1 }}>
              <Input placeholder="Postal code" />
            </Form.Item>
          </Space>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default MyProfile;
