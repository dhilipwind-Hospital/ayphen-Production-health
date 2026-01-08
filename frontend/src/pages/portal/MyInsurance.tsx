import React from 'react';
import { Card, Row, Col, Typography, Alert, Spin, List, Tag, Statistic, Progress, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { dashboard as fetchDashboard, listClaims } from '../../services/insurance';
import type { Claim, BenefitUsage } from '../../types/insurance';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const MyInsurance: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [benefits, setBenefits] = React.useState<BenefitUsage[]>([]);
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [dash, cl] = await Promise.all([
          fetchDashboard().catch(() => ({ benefits: [] } as any)),
          listClaims().catch(() => ([] as any[])),
        ]);
        if (!mounted) return;
        setBenefits((dash as any)?.benefits || []);
        setClaims(cl as any);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.response?.data?.message || 'Failed to load insurance data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Spin size="large" />;
  if (error) return <Alert type="error" message={error} showIcon />;

  return (
    <div>
      <Title level={2}>My Insurance</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Benefits Usage" extra={<Button onClick={() => navigate('/insurance')}>Shop Plans</Button>}>
            {benefits.length === 0 ? (
              <Alert type="info" showIcon message="No benefits found" description="If you have an active policy, benefits will appear here." />
            ) : (
              <List
                dataSource={benefits}
                renderItem={(b) => {
                  const pct = Math.min(100, Math.round((b.used / Math.max(1, b.total)) * 100));
                  return (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text strong>{b.label}</Text>
                          <Text type="secondary">{b.used} / {b.total}</Text>
                        </div>
                        <Progress percent={pct} status={pct >= 100 ? 'exception' : 'active'} />
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Recent Claims" extra={<Button onClick={() => navigate('/insurance')}>Explore</Button>}>
            {claims.length === 0 ? (
              <Alert type="info" showIcon message="No claims yet" description="Submit claims from your insurer's portal or clinic desk." />
            ) : (
              <List
                dataSource={claims}
                renderItem={(c) => (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <div>
                        <div><Text strong>{c.type}</Text></div>
                        <div style={{ color: '#64748b' }}>{dayjs(c.date).format('MMM DD, YYYY')}</div>
                      </div>
                      <Space>
                        <Tag color={c.status === 'Approved' ? 'green' : c.status === 'Rejected' ? 'red' : 'orange'}>{c.status}</Tag>
                        <Statistic prefix="€" precision={2} value={c.amount} />
                      </Space>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MyInsurance;
