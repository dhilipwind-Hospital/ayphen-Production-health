import React from 'react';
import styled, { keyframes } from 'styled-components';

type Props = { kind: string; width?: number; height?: number };

const pulse = keyframes`
  0% { transform: scale(0.95); opacity: .9; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.95); opacity: .9; }
`;

const floatDown = keyframes`
  0% { transform: translateY(-8px); opacity: 0.8; }
  50% { transform: translateY(0px); opacity: 1; }
  100% { transform: translateY(-8px); opacity: 0.8; }
`;

const slide = keyframes`
  0% { transform: translateX(-40px); opacity: .6; }
  50% { transform: translateX(0px); opacity: 1; }
  100% { transform: translateX(40px); opacity: .6; }
`;

const Wrap = styled.div<{w:number,h:number}>`
  width: ${({w})=>w}px; height: ${({h})=>h}px; display:flex; align-items:center; justify-content:center;
`;

const Circle = styled.div<{color:string}>`
  width: 72px; height: 72px; border-radius: 999px; background: ${({color})=>color};
  animation: ${pulse} 1.2s ease-in-out infinite;
`;

const Bandage = styled.div`
  width: 100px; height: 30px; border-radius: 14px; background: #f6d4a0; position: relative; animation: ${slide} 2s ease-in-out infinite;
  &::after { content: ''; position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); width: 36px; height: 18px; border-radius: 8px; background: #fff; }
`;

const Flame = styled.div`
  width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 40px solid #ff7a00; filter: drop-shadow(0 2px 4px rgba(0,0,0,.15));
  position: relative; margin-right: 8px;
  &::after { content: ''; position: absolute; top: -18px; left: -8px; width: 16px; height: 16px; border-radius: 50% 0 50% 50%; background: #ffa94d; transform: rotate(45deg); }
`;

const Drop = styled.div`
  width: 18px; height: 18px; background: #4cc3ff; border-radius: 50% 50% 60% 60%; transform: rotate(45deg);
  animation: ${floatDown} 1.6s ease-in-out infinite;
`;

const Sun = styled.div`
  width: 56px; height: 56px; border-radius: 999px; background: #ffd166; position: relative; animation: ${pulse} 1.2s ease-in-out infinite;
  &::before, &::after { content: ''; position: absolute; width: 6px; height: 24px; background: #ffd166; left: 50%; top: -28px; transform: translateX(-50%); box-shadow: 0 140px 0 #ffd166; }
  &::after { transform: translateX(-50%) rotate(90deg); }
`;

const Air = styled.div`
  width: 48px; height: 8px; border-radius: 8px; background: #4cc3ff; animation: ${slide} 1.6s ease-in-out infinite;
`;

const Tissue = styled.div`
  width: 52px; height: 18px; background: #fff; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,.08); animation: ${slide} 2s ease-in-out infinite;
`;

const WrapSVG: React.FC<Props> = ({ kind, width = 180, height = 120 }) => {
  return (
    <Wrap w={width} h={height} aria-hidden>
      {kind === 'cuts' && <Bandage />}
      {kind === 'burns' && (<div style={{display:'flex',alignItems:'center'}}><Flame /><Drop /></div>)}
      {kind === 'sprain' && <Bandage />}
      {kind === 'nosebleed' && <Tissue />}
      {kind === 'faint' && <Circle color="#8ecae6" />}
      {kind === 'choking' && <Air />}
      {kind === 'heart' && <Circle color="#ef4444" />}
      {kind === 'stroke' && <Circle color="#fbbf24" />}
      {kind === 'heat' && <Sun />}
      {kind === 'poison' && <Circle color="#34d399" />}
    </Wrap>
  );
};

export default WrapSVG;
