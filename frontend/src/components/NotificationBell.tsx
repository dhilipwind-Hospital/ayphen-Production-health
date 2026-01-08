import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Button, Typography, Empty, Spin, message } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

dayjs.extend(relativeTime);

const { Text } = Typography;

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

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dropdownVisible) {
      loadNotifications();
    }
  }, [dropdownVisible]);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data?.count || 0);
    } catch (error) {
      // Silently fail for count
    }
  };

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 10 } });
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
      loadUnreadCount();
    } catch (error) {
      message.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      message.success('All notifications marked as read');
    } catch (error) {
      message.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      loadUnreadCount();
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
      setDropdownVisible(false);
      navigate(notification.actionUrl);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ff4d4f';
      case 'high': return '#fa8c16';
      case 'medium': return '#1890ff';
      case 'low': return '#52c41a';
      default: return '#d9d9d9';
    }
  };

  const menu = (
    <NotificationDropdown>
      <DropdownHeader>
        <Text strong>Notifications</Text>
        <div>
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadNotifications}
            loading={loading}
          />
          {unreadCount > 0 && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      </DropdownHeader>

      <NotificationList>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="No notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <NotificationItem
                key={item.id}
                isRead={item.isRead}
                priority={item.priority}
              >
                <div
                  className="notification-content"
                  onClick={() => handleNotificationClick(item)}
                >
                  <PriorityDot color={getPriorityColor(item.priority)} />
                  <div className="notification-text">
                    <Text strong={!item.isRead}>{item.title}</Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {item.message}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {dayjs(item.createdAt).fromNow()}
                    </Text>
                  </div>
                </div>
                <div className="notification-actions">
                  {!item.isRead && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(item.id);
                      }}
                    />
                  )}
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                  />
                </div>
              </NotificationItem>
            )}
          />
        )}
      </NotificationList>

      {notifications.length > 0 && (
        <DropdownFooter>
          <Button type="link" onClick={() => {
            setDropdownVisible(false);
            navigate('/notifications');
          }}>
            View all notifications
          </Button>
        </DropdownFooter>
      )}
    </NotificationDropdown>
  );

  return (
    <Dropdown
      overlay={menu}
      trigger={['click']}
      placement="bottomRight"
      open={dropdownVisible}
      onOpenChange={setDropdownVisible}
    >
      <BellButton>
        <Badge count={unreadCount} overflowCount={99}>
          <BellOutlined style={{ fontSize: '20px' }} />
        </Badge>
      </BellButton>
    </Dropdown>
  );
};

export default NotificationBell;

// Styled Components
const BellButton = styled.div`
  cursor: pointer;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  transition: all 0.3s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
  }
`;

const NotificationDropdown = styled.div`
  width: 380px;
  max-height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
`;

const DropdownHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NotificationList = styled.div`
  max-height: 450px;
  overflow-y: auto;

  .ant-list-item {
    padding: 0;
    border: none;
  }
`;

const NotificationItem = styled.div<{ isRead: boolean; priority: string }>`
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: ${props => props.isRead ? 'white' : '#f6ffed'};
  transition: background 0.3s;
  cursor: pointer;

  &:hover {
    background: #fafafa;
  }

  .notification-content {
    flex: 1;
    display: flex;
    gap: 12px;
  }

  .notification-text {
    flex: 1;
  }

  .notification-actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .notification-actions {
    opacity: 1;
  }
`;

const PriorityDot = styled.div<{ color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-top: 6px;
  flex-shrink: 0;
`;

const DropdownFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
`;
