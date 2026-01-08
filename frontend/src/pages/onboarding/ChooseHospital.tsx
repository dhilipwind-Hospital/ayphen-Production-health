import React, { useEffect, useMemo, useState } from 'react';
import { Card, List, Button, Input, message, Space, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface PublicOrg {
  id: string;
  name: string;
  subdomain: string;
  branding?: { logo?: string; primaryColor?: string; secondaryColor?: string };
}

const ChooseHospital: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orgs, setOrgs] = useState<PublicOrg[]>([]);
  const [q, setQ] = useState('');
  const [manualSubdomain, setManualSubdomain] = useState('');
  const navigate = useNavigate();
  const { refreshMe, user } = useAuth();

  const requireOrgSelection = String(process.env.REACT_APP_REQUIRE_ORG_SELECTION || 'false').toLowerCase() === 'true';

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organizations/public');
      const data = (res?.data?.data || []) as PublicOrg[];
      setOrgs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return orgs;
    return orgs.filter(o => o.name.toLowerCase().includes(qq) || o.subdomain.toLowerCase().includes(qq));
  }, [q, orgs]);

  const applyOrg = async (payload: { organizationId?: string; subdomain?: string }) => {
    try {
      setLoading(true);
      await api.patch('/users/me/organization', payload);
      await refreshMe();
      const role = String((user as any)?.role || '').toLowerCase();
      if (role === 'patient') navigate('/portal');
      else navigate('/');
      message.success('Hospital selected');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to select hospital');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefault = async () => {
    await applyOrg({ subdomain: 'default' });
  };

  const handleJoinManual = async () => {
    const sub = manualSubdomain.trim().toLowerCase();
    if (!sub) {
      message.warning('Please enter a hospital subdomain');
      return;
    }
    await applyOrg({ subdomain: sub });
  };

  return (
    <div style={{ maxWidth: 960, margin: '24px auto' }}>
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>Choose Your Hospital <span style={{ color: '#ff4d4f' }}>*Required</span></Title>
          <Text>To continue, select the hospital you belong to. This ensures your data stays within the correct organization and you can book appointments with doctors.</Text>
          <Text type="danger" style={{ marginTop: 8 }}>Hospital selection is mandatory. You cannot proceed without selecting your hospital.</Text>
          {!requireOrgSelection && (
            <Text type="secondary">Note: Org selection is optional in this environment.</Text>
          )}
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="Search by name or subdomain"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ width: 360 }}
            />
            <Button onClick={load} loading={loading}>Refresh</Button>
            <Button type="primary" onClick={handleUseDefault} loading={loading}>Use Default Hospital</Button>
          </Space>
          <Space wrap>
            <Text>Don’t see your hospital?</Text>
            <Input
              allowClear
              placeholder="Enter hospital subdomain (example: citycare)"
              value={manualSubdomain}
              onChange={(e) => setManualSubdomain(e.target.value)}
              style={{ width: 360 }}
            />
            <Button onClick={handleJoinManual} type="default" loading={loading}>Join Hospital</Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <List
          loading={loading}
          dataSource={filtered}
          locale={{ emptyText: <Empty description="No hospitals found" /> }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="choose" type="primary" onClick={() => applyOrg({ organizationId: item.id })}>
                  Select
                </Button>
              ]}
            >
              <List.Item.Meta
                title={<span>{item.name}</span>}
                description={<Text type="secondary">subdomain: {item.subdomain}</Text>}
                avatar={item.branding?.logo ? <img src={item.branding.logo} alt={item.name} style={{ width: 40, height: 40, objectFit: 'contain' }} /> : undefined}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ChooseHospital;
