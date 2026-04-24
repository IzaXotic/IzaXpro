import React, { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

interface Coords { top: number; left: number; }

const GAP = 10;

const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'right', delay = 350 }) => {
  const [visible, setVisible]   = useState(false);
  const [coords, setCoords]     = useState<Coords>({ top: 0, left: 0 });
  const [arrowPos, setArrowPos] = useState<React.CSSProperties>({});
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const TIP_W  = 240; // max-width of tooltip box

  const calcPosition = useCallback(() => {
    const el = anchor.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = 0, left = 0;
    let arrow: React.CSSProperties = {};

    switch (position) {
      case 'top':
        top  = r.top - GAP;          // will subtract tooltip height via transform
        left = r.left + r.width / 2; // will centre via transform
        arrow = { bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
        break;
      case 'bottom':
        top  = r.bottom + GAP;
        left = r.left + r.width / 2;
        arrow = { top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
        break;
      case 'right':
        top  = r.top + r.height / 2;
        left = r.right + GAP;
        arrow = { top: '50%', left: -4, transform: 'translateY(-50%) rotate(45deg)' };
        break;
      case 'left':
        top  = r.top + r.height / 2;
        left = r.left - GAP;         // will subtract tooltip width via transform
        arrow = { top: '50%', right: -4, transform: 'translateY(-50%) rotate(45deg)' };
        break;
    }

    // Clamp so tooltip never goes off-screen
    if (position === 'top' || position === 'bottom') {
      left = Math.max(8, Math.min(left, vw - TIP_W - 8));
    }
    if (position === 'right') {
      if (left + TIP_W > vw - 8) {
        // not enough room on right — flip to left
        left = r.left - GAP;
        arrow = { top: '50%', right: -4, transform: 'translateY(-50%) rotate(45deg)' };
      }
    }
    if (position === 'left') {
      if (r.left - GAP - TIP_W < 8) {
        // not enough room on left — flip to right
        left = r.right + GAP;
        arrow = { top: '50%', left: -4, transform: 'translateY(-50%) rotate(45deg)' };
      }
    }
    top = Math.max(8, Math.min(top, vh - 80));

    setCoords({ top, left });
    setArrowPos(arrow);
  }, [position]);

  const show = () => {
    timer.current = setTimeout(() => {
      calcPosition();
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  };

  const translateStyle: React.CSSProperties = (() => {
    switch (position) {
      case 'top':    return { transform: 'translate(-50%, -100%)' };
      case 'bottom': return { transform: 'translate(-50%, 0)' };
      case 'right':  return { transform: 'translate(0, -50%)' };
      case 'left':   return { transform: 'translate(-100%, -50%)' };
    }
  })();

  return (
    <span
      ref={anchor}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      {children}
      {visible && (
        <span style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          ...translateStyle,
          zIndex: 99999,
          background: '#12111f',
          border: '1px solid rgba(124,58,237,0.45)',
          borderRadius: 7,
          padding: '7px 11px',
          maxWidth: TIP_W,
          width: 'max-content',
          wordBreak: 'break-word',
          whiteSpace: 'normal',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: '#c4b5fd',
          letterSpacing: '0.25px',
          lineHeight: 1.55,
          boxShadow: '0 8px 28px rgba(0,0,0,0.55), 0 0 0 1px rgba(124,58,237,0.15)',
          pointerEvents: 'none',
        }}>
          {/* Diamond arrow */}
          <span style={{
            position: 'absolute',
            width: 8, height: 8,
            background: '#12111f',
            border: '1px solid rgba(124,58,237,0.45)',
            borderRight: 'none',
            borderBottom: 'none',
            ...arrowPos,
          }} />
          {text}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
