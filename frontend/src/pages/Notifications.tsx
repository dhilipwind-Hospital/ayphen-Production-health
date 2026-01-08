import React, { useEffect, useState } from 'react';
import { Card, List, Tag, Button, Typography, Empty, Spin, message, Space, Select } from 'antd';
import { CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styled from 'styled-components';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;
const { Option } = Select;

interface Notification {
  id: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (filter === 'unread') {
        params.unreadOnly = 'true';
      }
      const res = await api.get('/notifications', { params });
      setNotifications(res.data?.data || []);
    } catch (error: any) {
      message.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      message.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      message.success('All notifications marked as read');
    } catch (error) {
      message.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      message.success('Notification deleted');
    } catch (error) {
      message.error('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'blue';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <PageContainer>
      <Card>
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>Notifications</Title>
            <Text type="secondary">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </Text>
          </div>
          <Space>
            <Select value={filter} onChange={setFilter} style={{ width: 120 }}>
              <Option value="all">All</Option>
              <Option value="unread">Unread</Option>
            </Select>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadNotifications}
              loading={loading}
            >
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '60px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <NotificationItem isRead={item.isRead}>
                <div
                  className="notification-content"
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="notification-header">
                    <Space>
                      <Text strong={!item.isRead}>{item.title}</Text>
                      <Tag color={getPriorityColor(item.priority)}>
                        {item.priority.toUpperCase()}
                      </Tag>
                      {!item.isRead && <Tag color="green">NEW</Tag>}
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                  </div>
                  <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    {item.message}
                  </Text>
                  {item.actionLabel && (
                    <Button type="link" size="small" style={{ padding: 0, marginTop: 8 }}>
                      {item.actionLabel} →
                    </Button>
                  )}
                </div>
                <div className="notification-actions">
                  {!item.isRead && (
                    <Button
                      type="text"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </NotificationItem>
            )}
          />
        )}
      </Card>
    </PageContainer>
  );
};

export default Notifications;

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const NotificationItem = styled(List.Item)<{ isRead: boolean }>`
  background: ${props => props.isRead ? 'white' : '#f6ffed'};
  padding: 16px !important;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid ${props => props.isRead ? '#f0f0f0' : '#b7eb8f'} !important;

  &:hover {
    background: #fafafa;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .notification-content {
    flex: 1;
  }

  .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .notification-actions {
    display: flex;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .notification-actions {
    opacity: 1;
  }
`;
