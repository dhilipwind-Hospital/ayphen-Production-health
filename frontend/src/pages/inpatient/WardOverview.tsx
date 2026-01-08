import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Progress, Select, Space, message } from 'antd';
import { HomeOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Option } = Select;

interface Ward {
  id: string;
  name: string;
  wardNumber: string;
  capacity: number;
  rooms: Room[];
}

interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  beds: Bed[];
}

interface Bed {
  id: string;
  bedNumber: string;
  status: string;
  currentAdmission?: {
    patient: {
      firstName: string;
      lastName: string;
    };
  };
}

const WardOverview: React.FC = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedWard, setSelectedWard] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [occupancyStats, setOccupancyStats] = useState<any>(null);

  useEffect(() => {
    fetchWards();
  }, []);

  useEffect(() => {
    if (selectedWard) {
      fetchWardOccupancy(selectedWard);
    }
  }, [selectedWard]);

  const fetchWards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inpatient/wards');
      const wardsData = response.data.wards || [];
      setWards(wardsData);
      if (wardsData.length > 0) {
        setSelectedWard(wardsData[0].id);
      }
    } catch (error: any) {
      console.error('Error fetching wards:', error);
      // Only show error if it's not a 404 or empty response
      if (error.response?.status !== 404) {
        message.error('Failed to fetch wards');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWardOccupancy = async (wardId: string) => {
    try {
      const response = await api.get(`/inpatient/wards/${wardId}/occupancy`);
      setOccupancyStats(response.data.occupancy);
    } catch (error: any) {
      console.error('Error fetching occupancy:', error);
      // Silently fail for occupancy stats
    }
  };

  const selectedWardData = wards.find(w => w.id === selectedWard);

  const getBedStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'success',
      occupied: 'error',
      reserved: 'warning',
      maintenance: 'default',
      cleaning: 'processing'
    };
    return colors[status] || 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1>Ward Overview</h1>

      {/* Ward Selector */}
      <Card style={{ marginBottom: '24px' }}>
        <Space>
          <span>Select Ward:</span>
          <Select
            style={{ width: 300 }}
            value={selectedWard}
            onChange={setSelectedWard}
            loading={loading}
          >
            {wards.map(ward => (
              <Option key={ward.id} value={ward.id}>
                {ward.name} ({ward.wardNumber})
              </Option>
            ))}
          </Select>
        </Space>
      </Card>

      {/* Occupancy Statistics */}
      {occupancyStats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Beds"
                value={occupancyStats.totalBeds}
                prefix={<HomeOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Occupied"
                value={occupancyStats.occupiedBeds}
                valueStyle={{ color: '#cf1322' }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Available"
                value={occupancyStats.availableBeds}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Occupancy Rate"
                value={occupancyStats.occupancyRate}
                suffix="%"
                valueStyle={{ 
                  color: occupancyStats.occupancyRate > 80 ? '#cf1322' : '#3f8600' 
                }}
              />
              <Progress
                percent={occupancyStats.occupancyRate}
                status={occupancyStats.occupancyRate > 80 ? 'exception' : 'success'}
                showInfo={false}
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Ward Layout */}
      {selectedWardData && (
        <Card title={`${selectedWardData.name} - Bed Layout`}>
          <Row gutter={[16, 16]}>
            {selectedWardData.rooms?.map(room => (
              <Col span={8} key={room.id}>
                <Card
                  size="small"
                  title={`Room ${room.roomNumber}`}
                  extra={<Tag>{room.roomType.replace('_', ' ').toUpperCase()}</Tag>}
                >
                  <Row gutter={[8, 8]}>
                    {room.beds?.map(bed => (
                      <Col span={12} key={bed.id}>
                        <Card
                          size="small"
                          style={{
                            background: bed.status === 'available' ? '#f6ffed' : 
                                      bed.status === 'occupied' ? '#fff1f0' : '#fafafa',
                            borderColor: bed.status === 'available' ? '#b7eb8f' :
                                       bed.status === 'occupied' ? '#ffa39e' : '#d9d9d9'
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <HomeOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                            <div style={{ fontWeight: 'bold' }}>{bed.bedNumber}</div>
                            <Tag color={getBedStatusColor(bed.status)} style={{ marginTop: '4px' }}>
                              {bed.status.toUpperCase()}
                            </Tag>
                            {bed.currentAdmission && (
                              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                                {bed.currentAdmission.patient.firstName} {bed.currentAdmission.patient.lastName}
                              </div>
                            )}
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default WardOverview;
