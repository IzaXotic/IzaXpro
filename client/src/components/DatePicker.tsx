import React, { useState } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  style?: React.CSSProperties;
}

/**
 * IzaXotic-themed date picker.
 * - Dark background (#0d0d0d) with purple focus ring
 * - White calendar icon via colorScheme: 'dark'
 * - Blocks all keyboard entry — calendar popup only
 */
export default function DatePicker({ value, onChange, required, style }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <input
      type="date"
      value={value}
      required={required}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.preventDefault()}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: `1px solid ${focused ? '#7c3aed' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '6px',
        fontSize: '13px',
        color: '#f9fafb',
        background: '#0d0d0d',
        outline: 'none',
        fontFamily: 'Inter, sans-serif',
        cursor: 'pointer',
        colorScheme: 'dark',
        boxShadow: focused ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        ...style,
      }}
    />
  );
}
