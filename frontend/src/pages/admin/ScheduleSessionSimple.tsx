import React from 'react';
import { Card, Button, Typography } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ScheduleSessionSimple: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined />
            Schedule Session Management
          </div>
        }
      >
        <Title level={3}>Schedule Session is Working!</Title>
        <p>This is a simple test version to verify the route is working correctly.</p>
        <Button type="primary" icon={<CalendarOutlined />}>
          Test Button
        </Button>
      </Card>
    </div>
  );
};

export default ScheduleSessionSimple;
