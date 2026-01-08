import React from 'react';
import { Card, Collapse, Typography, Button, Space } from 'antd';
import MiniAnim from '../../components/MiniAnim';
import styled from 'styled-components';
import { RedoOutlined, FireOutlined, HeartOutlined, MedicineBoxOutlined, FrownOutlined, AlertOutlined, SmileOutlined, ThunderboltOutlined, WarningOutlined, ExperimentOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const PageWrap = styled.div`
  max-width: 980px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255,59,59,0.1);
  color: #cc2f2f;
  font-weight: 700;
`;

const content: Array<{ key: string; icon: React.ReactNode; title: string; steps: string[]; lottie?: string }>= [
  { key: 'cuts', icon: <MedicineBoxOutlined />, title: 'Cuts & Bleeding', lottie: '/animations/bandage.json', steps: [
    'Apply firm pressure with a clean cloth for 5–10 minutes.',
    'Elevate the injured area if possible.',
    'Rinse with clean water once bleeding slows; apply sterile dressing.',
  ]},
  { key: 'burns', icon: <FireOutlined />, title: 'Burns (Minor)', lottie: '/animations/flame.json', steps: [
    'Cool burn under running water for 10–20 minutes.',
    'Do not apply ice, oils, or butter.',
    'Cover loosely with sterile, non‑adhesive dressing.',
  ]},
  { key: 'sprain', icon: <RedoOutlined rotate={90} />, title: 'Sprains & Strains', lottie: '/animations/sprain_wrap.json', steps: [
    'RICE: Rest, Ice (15–20 min), Compression, Elevation.',
    'Avoid weight-bearing for 24–48 hours.',
    'Seek medical care if severe pain or deformity.',
  ]},
  { key: 'nosebleed', icon: <FrownOutlined />, title: 'Nosebleeds', lottie: '/animations/nose_tissue.json', steps: [
    'Sit upright, tilt head slightly forward.',
    'Pinch soft part of nose for 10 minutes; breathe through mouth.',
    'Avoid blowing nose for several hours after bleeding stops.',
  ]},
  { key: 'faint', icon: <SmileOutlined />, title: 'Fainting', lottie: '/animations/faint_tilt.json', steps: [
    'Lay the person flat; elevate legs 8–12 inches.',
    'Loosen tight clothing and ensure fresh air.',
    'If no recovery in 1–2 minutes, seek immediate medical help.',
  ]},
  { key: 'choking', icon: <AlertOutlined />, title: 'Choking (Adult/Child)', lottie: '/animations/choke_airflow.json', steps: [
    'Ask “Are you choking?” If unable to speak/cough, begin Heimlich thrusts.',
    'Perform abdominal thrusts inward and upward until object is expelled.',
    'For infants, use back slaps and chest thrusts. Seek medical care after.',
  ]},
  { key: 'heart', icon: <HeartOutlined />, title: 'Heart Attack', lottie: '/animations/heartbeat.json', steps: [
    'Call emergency services immediately.',
    'Have the person rest; loosen tight clothing.',
    'If trained, give aspirin (unless allergic) and monitor breathing.',
  ]},
  { key: 'stroke', icon: <WarningOutlined />, title: 'Stroke (FAST test)', lottie: '/animations/stroke_fast.json', steps: [
    'Face drooping? Arm weakness? Speech difficulty?',
    'Time to call emergency services immediately.',
    'Note time of symptom onset; keep person comfortable and still.',
  ]},
  { key: 'heat', icon: <ThunderboltOutlined />, title: 'Heat Stroke', lottie: '/animations/sun.json', steps: [
    'Move to a cool place; remove excess clothing.',
    'Cool with wet cloths/ice packs at neck, armpits, groin.',
    'Give sips of cool water if conscious; call for medical help.',
  ]},
  { key: 'poison', icon: <ExperimentOutlined />, title: 'Poisoning', lottie: '/animations/poison_vapor.json', steps: [
    'Do not induce vomiting unless advised by professionals.',
    'Identify the substance if possible and call emergency services.',
    'Move to fresh air for inhaled poisons; rinse mouth/skin for exposures.',
  ]},
];

const FirstAidPage: React.FC = () => {
  return (
    <PageWrap>
      <Header>
        <Badge>
          <span role="img" aria-label="first-aid">⛑️</span>
          <span>First Aid Quick Reference</span>
        </Badge>
        <Space>
          <Button type="primary" href="tel:18000009999">
            Call Emergency
          </Button>
          <Button href="/emergency">
            Open Emergency Page
          </Button>
        </Space>
      </Header>

      <Card variant="outlined" aria-label="First Aid Topics">
        <Collapse
          accordion
          items={content.map((c) => ({
            key: c.key,
            label: (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#ff3b3b' }}>{c.icon}</span>
                <strong>{c.title}</strong>
              </div>
            ),
            children: (
              <LazyAnimSection topicKey={c.key} steps={c.steps} />
            )
          }))}
        />
      </Card>

      <div style={{ padding: 12, color: '#64748b', fontSize: 12 }}>
        This guide is for quick reference only and not a substitute for professional medical care. In severe situations, contact emergency services immediately.
      </div>
    </PageWrap>
  );
};

export default FirstAidPage;

// Lazy render animation content only when the panel is expanded
const LazyAnimSection: React.FC<{ topicKey: string; steps: string[] }> = ({ topicKey, steps }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Observe mounting; collapse mounts children on expand, so we mark visible on first paint
  React.useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div>
      {isVisible && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <MiniAnim kind={topicKey} width={200} height={130} />
        </div>
      )}
      {steps.map((s, idx) => (
        <Paragraph key={idx} style={{ marginBottom: 8 }}>• {s}</Paragraph>
      ))}
    </div>
  );
};
