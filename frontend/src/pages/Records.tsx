import React from 'react';
import { Card, Typography, Empty } from 'antd';

const { Title, Paragraph } = Typography;

const Records: React.FC = () => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Medical Records</Title>
      </div>
      <Card>
        <Paragraph type="secondary">
          This is a placeholder for the Medical Records module. Integrate your EHR/EMR APIs here and render records per patient or global reports.
        </Paragraph>
        <Empty description="No records to display" />
      </Card>
    </div>
  );
};

export default Records;
