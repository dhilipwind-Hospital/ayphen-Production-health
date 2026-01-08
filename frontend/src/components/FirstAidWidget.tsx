import React from 'react';
import { Drawer, Tooltip, Card, Collapse, Typography } from 'antd';
import { RedoOutlined, FireOutlined, HeartOutlined, MedicineBoxOutlined, FrownOutlined, AlertOutlined, SmileOutlined, ThunderboltOutlined, WarningOutlined, ExperimentOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Panel } = Collapse as any;
const { Title, Paragraph } = Typography;

// Simple responsive hook
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean>(window.innerWidth < breakpoint);
  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

const FloatingButton = styled.button`
  position: fixed;
  right: 24px;
  bottom: 96px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  outline: none;
  background: #ff3b3b;
  color: #fff;
  box-shadow: 0 10px 20px rgba(255, 59, 59, 0.3), 0 2px 6px rgba(0,0,0,0.15);
  cursor: pointer;
  z-index: 1000;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { filter: brightness(0.95); box-shadow: 0 12px 22px rgba(255, 59, 59, 0.38), 0 3px 8px rgba(0,0,0,0.2); }
  &:active { transform: translateY(1px) scale(0.98); }
`;

const HeaderWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,59,59,0.1);
  color: #cc2f2f;
  font-weight: 600;
`;

const content: Array<{ key: string; icon: React.ReactNode; title: string; steps: string[] }>= [
  { key: 'cuts', icon: <MedicineBoxOutlined />, title: 'Cuts & Bleeding', steps: [
    'Apply firm pressure with a clean cloth for 5–10 minutes.',
    'Elevate the injured area if possible.',
    'Rinse with clean water once bleeding slows; apply sterile dressing.',
  ]},
  { key: 'burns', icon: <FireOutlined />, title: 'Burns (Minor)', steps: [
    'Cool burn under running water for 10–20 minutes.',
    'Do not apply ice, oils, or butter.',
    'Cover loosely with sterile, non‑adhesive dressing.',
  ]},
  { key: 'sprain', icon: <RedoOutlined rotate={90} />, title: 'Sprains & Strains', steps: [
    'RICE: Rest, Ice (15–20 min), Compression, Elevation.',
    'Avoid weight-bearing for 24–48 hours.',
    'Seek medical care if severe pain or deformity.',
  ]},
  { key: 'nosebleed', icon: <FrownOutlined />, title: 'Nosebleeds', steps: [
    'Sit upright, tilt head slightly forward.',
    'Pinch soft part of nose for 10 minutes; breathe through mouth.',
    'Avoid blowing nose for several hours after bleeding stops.',
  ]},
  { key: 'faint', icon: <SmileOutlined />, title: 'Fainting', steps: [
    'Lay the person flat; elevate legs 8–12 inches.',
    'Loosen tight clothing and ensure fresh air.',
    'If no recovery in 1–2 minutes, seek immediate medical help.',
  ]},
  { key: 'choking', icon: <AlertOutlined />, title: 'Choking (Adult/Child)', steps: [
    'Ask “Are you choking?” If unable to speak/cough, begin Heimlich thrusts.',
    'Perform abdominal thrusts inward and upward until object is expelled.',
    'For infants, use back slaps and chest thrusts. Seek medical care after.',
  ]},
  { key: 'heart', icon: <HeartOutlined />, title: 'Heart Attack', steps: [
    'Call emergency services immediately.',
    'Have the person rest; loosen tight clothing.',
    'If trained, give aspirin (unless allergic) and monitor breathing.',
  ]},
  { key: 'stroke', icon: <WarningOutlined />, title: 'Stroke (FAST test)', steps: [
    'Face drooping? Arm weakness? Speech difficulty?',
    'Time to call emergency services immediately.',
    'Note time of symptom onset; keep person comfortable and still.',
  ]},
  { key: 'heat', icon: <ThunderboltOutlined />, title: 'Heat Stroke', steps: [
    'Move to a cool place; remove excess clothing.',
    'Cool with wet cloths/ice packs at neck, armpits, groin.',
    'Give sips of cool water if conscious; call for medical help.',
  ]},
  { key: 'poison', icon: <ExperimentOutlined />, title: 'Poisoning', steps: [
    'Do not induce vomiting unless advised by professionals.',
    'Identify the substance if possible and call emergency services.',
    'Move to fresh air for inhaled poisons; rinse mouth/skin for exposures.',
  ]},
];

type FirstAidWidgetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showFloatingButton?: boolean; // default true; set false when triggering from header
};

const FirstAidWidget: React.FC<FirstAidWidgetProps> = ({ open: controlledOpen, onOpenChange, showFloatingButton = true }) => {
  const isMobile = useIsMobile();
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = (v: boolean) => {
    if (controlledOpen !== undefined) onOpenChange?.(v);
    else setUncontrolledOpen(v);
  };

  return (
    <>
      {showFloatingButton && (
        <Tooltip title="First Aid Guide" placement="left">
          <FloatingButton aria-label="First Aid Guide" onClick={() => setOpen(true)}>
            {/* Simple ⛑️ using emoji for now; could be replaced with SVG */}
            <span role="img" aria-label="first-aid" style={{ fontSize: 24 }}>⛑️</span>
          </FloatingButton>
        </Tooltip>
      )}

      <Drawer
        placement={isMobile ? 'bottom' : 'right'}
        height={isMobile ? '80vh' : undefined}
        width={isMobile ? undefined : 460}
        closable
        onClose={() => setOpen(false)}
        open={open}
        destroyOnClose
        bodyStyle={{ padding: 0 }}
        title={
          <HeaderWrap>
            <Badge>
              <span role="img" aria-label="first-aid">⛑️</span>
              <span>First Aid Quick Reference</span>
            </Badge>
          </HeaderWrap>
        }
      >
        <div style={{ padding: 16, maxHeight: isMobile ? 'calc(80vh - 64px)' : 'calc(100vh - 64px)', overflow: 'auto' }}>
          <Card bordered={false} style={{ background: '#fff' }}>
            <Collapse accordion>
              {content.map((c) => (
                <Panel
                  header={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: '#ff3b3b' }}>{c.icon}</span><strong>{c.title}</strong></div>}
                  key={c.key}
                >
                  {c.steps.map((s, idx) => (
                    <Paragraph key={idx} style={{ marginBottom: 8 }}>• {s}</Paragraph>
                  ))}
                </Panel>
              ))}
            </Collapse>
          </Card>
          <div style={{ padding: 12, color: '#64748b', fontSize: 12 }}>
            Tip: This guide is for quick reference only and not a substitute for professional medical care. In severe situations, contact emergency services immediately.
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default FirstAidWidget;
