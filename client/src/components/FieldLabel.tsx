import React from 'react';
import { Info } from 'lucide-react';
import Tooltip from './Tooltip';

interface FieldLabelProps {
  label: string;
  tip: string;
  required?: boolean;
  style?: React.CSSProperties;
}

const FieldLabel: React.FC<FieldLabelProps> = ({ label, tip, required, style }) => (
  <label className="form-label" style={style}>
    <span style={{ flexShrink: 0 }}>{label}{required && ' *'}</span>
    <Tooltip text={tip} position="top">
      <Info
        size={12}
        style={{
          color: 'rgba(167,139,250,0.55)',
          cursor: 'help',
          flexShrink: 0,
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(167,139,250,0.55)')}
      />
    </Tooltip>
  </label>
);

export default FieldLabel;
