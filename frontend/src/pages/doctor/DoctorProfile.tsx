import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Spin,
  message,
  Rate,
  Statistic,
  Progress,
  Table,
  Empty,
  Typography,
  Divider,
  Tag,
  Space
} from 'antd';
import { UserOutlined, StarFilled, LikeOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface DoctorRatings {
  averageRating: number;
  recommendationPercentage: number;
  totalFeedbacks: number;
}

interface RatingBreakdown {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

interface Feedback {
  id: string;
  doctorRating: number;
  facilityRating: number;
  staffRating: number;
  overallRating: number;
  doctorComment?: string;
  facilityComment?: string;
  overallComment?: string;
  wouldRecommend: boolean;
  followUpNeeded: boolean;
  submittedAt: string;
}

interface DoctorStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingBreakdown: RatingBreakdown;
  wouldRecommendPercentage: number;
  followUpCount: number;
  recentFeedbacks: Feedback[];
}

interface DoctorInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  qualifications?: string;
}

const DoctorProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<DoctorInfo | null>(null);
  const [ratings, setRatings] = useState<DoctorRatings | null>(null);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [msgApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (id) {
      loadDoctorData();
    }
  }, [id]);

  const loadDoctorData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Load doctor info
      const doctorRes = await api.get(`/users/${id}`);
      setDoctor(doctorRes.data);

      // Load ratings
      const ratingsRes = await api.get(`/appointments/doctor/${id}/ratings`);
      setRatings(ratingsRes.data);

      // Load detailed stats
      const statsRes = await api.get(`/appointments/doctor/${id}/feedback-statistics`);
      setStats(statsRes.data);
    } catch (error: any) {
      msgApi.error(error.response?.data?.message || 'Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const feedbackColumns = [
    {
      title: 'Date',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (text: string) => dayjs(text).format('MMM DD, YYYY'),
      width: 120
    },
    {
      title: 'Overall Rating',
      dataIndex: 'overallRating',
      key: 'overallRating',
      render: (rating: number) => (
        <Rate disabled value={rating} />
      ),
      width: 150
    },
    {
      title: 'Doctor',
      dataIndex: 'doctorRating',
      key: 'doctorRating',
      render: (rating: number) => <Tag color="blue">{rating} ⭐</Tag>,
      width: 80
    },
    {
      title: 'Facility',
      dataIndex: 'facilityRating',
      key: 'facilityRating',
      render: (rating: number) => <Tag color="cyan">{rating} ⭐</Tag>,
      width: 100
    },
    {
      title: 'Staff',
      dataIndex: 'staffRating',
      key: 'staffRating',
      render: (rating: number) => <Tag color="green">{rating} ⭐</Tag>,
      width: 80
    },
    {
      title: 'Recommend',
      dataIndex: 'wouldRecommend',
      key: 'wouldRecommend',
      render: (recommend: boolean) => recommend ? (
        <Tag icon={<LikeOutlined />} color="success">Yes</Tag>
      ) : (
        <Tag>No</Tag>
      ),
      width: 100
    },
    {
      title: 'Comment',
      dataIndex: 'overallComment',
      key: 'overallComment',
      render: (text: string) => text ? text.substring(0, 50) + '...' : '-',
      width: 200
    }
  ];

  return (
    <>
      {contextHolder}
      <div style={{ padding: '20px' }}>
        {/* Doctor Header */}
        <Card style={{ marginBottom: 20 }}>
          <Row gutter={[20, 20]}>
            <Col xs={24} sm={4} style={{ textAlign: 'center' }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                backgroundColor: '#1890ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto'
              }}>
                <UserOutlined style={{ fontSize: 50, color: 'white' }} />
              </div>
            </Col>
            <Col xs={24} sm={20}>
              <Title level={2} style={{ marginBottom: 5 }}>
                Dr. {doctor?.firstName} {doctor?.lastName}
              </Title>
              {doctor?.specialization && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 10 }}>
                  {doctor.specialization}
                </Text>
              )}
              {ratings && (
                <Space style={{ marginTop: 10 }}>
                  <Statistic
                    prefix={<StarFilled style={{ color: '#faad14' }} />}
                    value={ratings.averageRating}
                    precision={1}
                    valueStyle={{ color: '#faad14', fontSize: 20 }}
                  />
                  <Text>{ratings.totalFeedbacks} feedback(s)</Text>
                </Space>
              )}
            </Col>
          </Row>
        </Card>

        {/* Ratings Overview */}
        {ratings && (
          <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Average Rating"
                  value={ratings.averageRating}
                  precision={2}
                  suffix="/ 5"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Would Recommend"
                  value={ratings.recommendationPercentage}
                  precision={1}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Feedbacks"
                  value={ratings.totalFeedbacks}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Follow-up Needed"
                  value={stats?.followUpCount || 0}
                  valueStyle={{ color: '#ff7a45' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Detailed Statistics */}
        {stats && (
          <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
            <Col xs={24} lg={12}>
              <Card title="Rating Breakdown">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>5 Stars:</Text>
                    <Progress
                      percent={(stats.ratingBreakdown.fiveStar / stats.totalFeedbacks * 100) || 0}
                      format={() => `${stats.ratingBreakdown.fiveStar}`}
                      status="success"
                    />
                  </div>
                  <div>
                    <Text strong>4 Stars:</Text>
                    <Progress
                      percent={(stats.ratingBreakdown.fourStar / stats.totalFeedbacks * 100) || 0}
                      format={() => `${stats.ratingBreakdown.fourStar}`}
                      status="success"
                    />
                  </div>
                  <div>
                    <Text strong>3 Stars:</Text>
                    <Progress
                      percent={(stats.ratingBreakdown.threeStar / stats.totalFeedbacks * 100) || 0}
                      format={() => `${stats.ratingBreakdown.threeStar}`}
                    />
                  </div>
                  <div>
                    <Text strong>2 Stars:</Text>
                    <Progress
                      percent={(stats.ratingBreakdown.twoStar / stats.totalFeedbacks * 100) || 0}
                      format={() => `${stats.ratingBreakdown.twoStar}`}
                      status="active"
                    />
                  </div>
                  <div>
                    <Text strong>1 Star:</Text>
                    <Progress
                      percent={(stats.ratingBreakdown.oneStar / stats.totalFeedbacks * 100) || 0}
                      format={() => `${stats.ratingBreakdown.oneStar}`}
                      status="exception"
                    />
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="Average Ratings by Category">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Row gutter={[10, 10]}>
                    <Col xs={12}>
                      <Text strong>Doctor Rating:</Text>
                    </Col>
                    <Col xs={12}>
                      <Rate disabled value={Math.round(stats.totalFeedbacks > 0 ? stats.recentFeedbacks.reduce((sum, f) => sum + f.doctorRating, 0) / stats.totalFeedbacks : 0)} />
                    </Col>
                  </Row>
                  <Row gutter={[10, 10]}>
                    <Col xs={12}>
                      <Text strong>Facility Rating:</Text>
                    </Col>
                    <Col xs={12}>
                      <Rate disabled value={Math.round(stats.totalFeedbacks > 0 ? stats.recentFeedbacks.reduce((sum, f) => sum + f.facilityRating, 0) / stats.totalFeedbacks : 0)} />
                    </Col>
                  </Row>
                  <Row gutter={[10, 10]}>
                    <Col xs={12}>
                      <Text strong>Staff Rating:</Text>
                    </Col>
                    <Col xs={12}>
                      <Rate disabled value={Math.round(stats.totalFeedbacks > 0 ? stats.recentFeedbacks.reduce((sum, f) => sum + f.staffRating, 0) / stats.totalFeedbacks : 0)} />
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {/* Recent Feedback */}
        <Card title="Recent Feedback">
          {stats?.recentFeedbacks && stats.recentFeedbacks.length > 0 ? (
            <Table
              columns={feedbackColumns}
              dataSource={stats.recentFeedbacks}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          ) : (
            <Empty description="No feedback yet" />
          )}
        </Card>
      </div>
    </>
  );
};

export default DoctorProfile;
