// src/components/BrandMark.tsx
// The real AllSight brand mark (radar / bullseye with a landing sweep) — matches the deployed
// favicon exactly, replacing the ◎ text stand-in. White marks on the brand-green rounded square.
import React from 'react';
import Svg, { Rect, Circle, Line } from 'react-native-svg';
import { AS } from '../theme/allsight';

interface Props { size?: number; }

const BrandMark: React.FC<Props> = ({ size = 26 }) => {
  const rx = (9 / 32) * size; // keep the favicon's corner ratio at any size
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={9} fill={AS.color.accent} />
      <Circle cx={16} cy={16} r={8.5} fill="none" stroke="#fff" strokeWidth={2} />
      <Line x1={23.4} y1={7.7} x2={17.4} y2={13.7} stroke="#fff" strokeWidth={2.3} strokeLinecap="round" />
      <Circle cx={16} cy={16} r={3} fill="#fff" />
    </Svg>
  );
};

export default BrandMark;
