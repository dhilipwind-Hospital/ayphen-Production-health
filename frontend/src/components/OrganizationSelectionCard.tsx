import React, { useState, useEffect } from 'react';
import { Card, Select, Button, message, Spin, Alert, Space, Typography } from 'antd';
import { BankOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  description?: string;
}

interface OrganizationSelectionCardProps {
  onSelect: (organizationId: string) => void;
  onSkip?: () => void;
}

const OrganizationSelectionCard: React.FC<OrganizationSelectionCardProps> = ({
  onSelect,
  onSkip
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/organizations');
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setOrganizations(response.data.data);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      message.error('Failed to load hospitals');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedOrgId) {
      message.warning('Please select a hospital');
      return;
    }

    try {
      setSubmitting(true);
      await onSelect(selectedOrgId);
    } catch (error) {
      message.error('Failed to join hospital');
    } finally {
      setSubmitting(false);
    }
  };

  const filterOption = (input: string, option: any) => {
    const org = organizations.find(o => o.id === option.value);
    if (!org) return false;
    
    const searchText = input.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchText) ||
      org.subdomain.toLowerCase().includes(searchText)
    );
  };

  return (
    <Card
      style={{ 
        maxWidth: 500, 
        margin: '0 auto 24px auto',
        border: '2px solid #1890ff',
        borderRadius: 12,
        boxShadow: '0 4px 12px rgba(24, 144, 255, 0.15)'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <BankOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          Choose Your Hospital
        </Title>
        <Text type="secondary" style={{ fontSize: 14 }}>
          Select the hospital you belong to access your records
        </Text>
      </div>

      <Alert
        type="info"
        showIcon
        message="Hospital Selection Required"
        description="You need to select your hospital to access appointments, medical records, and other services."
        style={{ marginBottom: 16 }}
      />

      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Select Hospital:
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder="Search and select your hospital"
            value={selectedOrgId}
            onChange={setSelectedOrgId}
            loading={loading}
            showSearch
            filterOption={filterOption}
            suffixIcon={<SearchOutlined />}
            size="large"
            notFoundContent={loading ? <Spin size="small" /> : 'No hospitals found'}
          >
            {organizations.map(org => (
              <Option key={org.id} value={org.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{org.name}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {org.subdomain}.hospital.com • {org.plan.toUpperCase()}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Button 
            type="link" 
            onClick={() => fetchOrganizations()}
            disabled={loading}
          >
            Refresh List
          </Button>
          
          <Space>
            {onSkip && process.env.NODE_ENV === 'development' && (
              <Button onClick={onSkip} disabled={submitting}>
                Skip (Dev)
              </Button>
            )}
            <Button 
              type="primary" 
              onClick={handleSubmit}
              loading={submitting}
              disabled={!selectedOrgId}
              size="large"
            >
              Join Hospital
            </Button>
          </Space>
        </Space>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Don't see your hospital? Contact your administrator
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default OrganizationSelectionCard;
