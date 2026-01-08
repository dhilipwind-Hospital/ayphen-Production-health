import React, { useState, useEffect } from 'react';
import { Modal, Input, Card, Button, message, Spin, Empty } from 'antd';
import { SearchOutlined, BankOutlined } from '@ant-design/icons';
import api from '../services/api';
import './OrganizationSelectionModal.css';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  description?: string;
}

interface OrganizationSelectionModalProps {
  isOpen: boolean;
  onSelect: (organizationId: string) => void;
  onSkip?: () => void;
}

const OrganizationSelectionModal: React.FC<OrganizationSelectionModalProps> = ({
  isOpen,
  onSelect,
  onSkip
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

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

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOrganizationSelect = async (organizationId: string) => {
    try {
      setLoading(true);
      await onSelect(organizationId);
      message.success('Hospital selected successfully!');
    } catch (error) {
      message.error('Failed to join hospital');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      closable={false}
      footer={null}
      width="100vw"
      style={{ top: 0, padding: 0 }}
      bodyStyle={{ height: '100vh', padding: 0 }}
      className="org-selection-modal"
    >
      <div className="org-selection-container">
        <div className="org-selection-header">
          <BankOutlined className="org-selection-icon" />
          <h1>🏥 Choose Your Hospital</h1>
          <p>To continue, select the hospital you belong to. This ensures your data stays within the correct organization.</p>
          <p className="org-selection-note">Note: Organization selection is required to access the patient portal.</p>
        </div>
        
        <div className="org-selection-content">
          <div className="org-selection-search">
            <Input.Search
              placeholder="Search by hospital name or subdomain"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="large"
              prefix={<SearchOutlined />}
              allowClear
            />
            <Button 
              type="link" 
              onClick={() => fetchOrganizations()}
              className="refresh-btn"
            >
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="org-selection-loading">
              <Spin size="large" />
              <p>Loading hospitals...</p>
            </div>
          ) : (
            <div className="org-selection-grid">
              {filteredOrganizations.length > 0 ? (
                filteredOrganizations.map(org => (
                  <Card
                    key={org.id}
                    hoverable
                    onClick={() => handleOrganizationSelect(org.id)}
                    className="org-card"
                  >
                    <div className="org-info">
                      <h3>{org.name}</h3>
                      <p className="org-subdomain">{org.subdomain}.hospital.com</p>
                      {org.description && (
                        <p className="org-description">{org.description}</p>
                      )}
                      <span className={`org-plan ${org.plan.toLowerCase()}`}>
                        {org.plan.toUpperCase()}
                      </span>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="org-selection-empty">
                  <Empty
                    description="No hospitals found"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}
            </div>
          )}

          <div className="org-selection-footer">
            <Button 
              type="link" 
              onClick={() => setShowJoinForm(true)}
              className="join-hospital-btn"
            >
              Don't see your hospital? Contact Administrator
            </Button>
            
            {onSkip && process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={onSkip}
                className="skip-btn"
              >
                Use Default Hospital (Dev Only)
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default OrganizationSelectionModal;
