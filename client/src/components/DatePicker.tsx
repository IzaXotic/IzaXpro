import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  style?: React.CSSProperties;
}

/**
 * A date-picker-only input.
 * Blocks all keyboard entry so the user MUST use the calendar popup.
 */
export default function DatePicker({ value, onChange, required, style }: Props) {
  return (
    <input
      type="date"
      className="form-control"
      value={value}
      required={required}
      style={{ cursor: 'pointer', ...style }}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.preventDefault()}   // block all manual typing
    />
  );
}
