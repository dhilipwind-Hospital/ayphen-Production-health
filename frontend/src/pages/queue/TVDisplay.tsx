import React, { useEffect, useState } from 'react';
import { Card, Tag, Typography } from 'antd';
import { getQueueBoard } from '../../services/queue.service';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const TVDisplay: React.FC = () => {
  const params = useParams();
  const stageParam = String(params.stage || 'triage').toLowerCase() as 'triage' | 'doctor';
  const [items, setItems] = useState<any[]>([]);

  const fetchBoard = async () => {
    try {
      const data = await getQueueBoard(stageParam);
      setItems(data || []);
    } catch {}
  };

  useEffect(() => {
    fetchBoard();
    const t = setInterval(fetchBoard, 3000);
    return () => clearInterval(t);
  }, [stageParam]);

  return (
    <div style={{ width: '100%', padding: 12 }}>
      <Title level={3} style={{ textAlign: 'center', marginBottom: 16 }}>{stageParam === 'triage' ? 'Triage Queue' : 'Doctor Queue'}</Title>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {items.map((it: any) => (
          <Card key={it.id} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#e91e63' }}>{it.tokenNumber}</div>
            <div style={{ marginTop: 8 }}>
              <Tag color={it.priority === 'emergency' ? 'red' : it.priority === 'urgent' ? 'orange' : 'blue'} style={{ fontSize: 12, padding: '2px 8px' }}>{it.priority}</Tag>
              <Tag color={it.status === 'called' ? 'green' : 'processing'} style={{ fontSize: 12, padding: '2px 8px' }}>{it.status}</Tag>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TVDisplay;
