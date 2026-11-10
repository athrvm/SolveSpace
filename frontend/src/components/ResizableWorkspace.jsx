import { Children, useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

const STORAGE_KEY = 'codepath:workspace-split:v1';
const DIVIDER_WIDTH = 10;

export default function ResizableWorkspace({ children }) {
  const panels = Children.toArray(children);
  const container = useRef(null);
  const drag = useRef(null);
  const current = useRef(50);
  const [preferred, setPreferred] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = Number(raw);
      return raw !== null && Number.isFinite(saved) && saved >= 25 && saved <= 75 ? saved : 50;
    } catch { return 50; }
  });
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Keep both panels usable on narrow laptops, without losing the saved preference.
  const minimum = width > DIVIDER_WIDTH ? Math.min(50, Math.max(25, 300 / (width - DIVIDER_WIDTH) * 100)) : 25;
  const maximum = 100 - minimum;
  const split = Math.max(minimum, Math.min(maximum, preferred));
  current.current = split;

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const persist = value => {
    try { localStorage.setItem(STORAGE_KEY, String(value)); } catch { /* Resizing still works without persistence. */ }
  };
  const update = (value, save = false) => {
    const next = Math.max(minimum, Math.min(maximum, value));
    current.current = next;
    setPreferred(next);
    if (save) persist(next);
  };
  const finish = event => {
    if (!drag.current || event.pointerId !== drag.current.id) return;
    drag.current = null;
    setDragging(false);
    persist(current.current);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const onKeyDown = event => {
    let next;
    const step = event.shiftKey ? 10 : 2;
    if (event.key === 'ArrowLeft') next = split - step;
    else if (event.key === 'ArrowRight') next = split + step;
    else if (event.key === 'Home') next = minimum;
    else if (event.key === 'End') next = maximum;
    else if (event.key === 'Enter') next = 50;
    else return;
    event.preventDefault();
    update(next, true);
  };

  return <div ref={container} className={`solving-workspace${dragging ? ' is-resizing' : ''}`} style={{ gridTemplateColumns: `minmax(0, ${split}fr) ${DIVIDER_WIDTH}px minmax(0, ${100 - split}fr)` }}>
    {panels[0]}
    <div className="workspace-divider" role="separator" tabIndex={0}
      aria-label="Resize problem statement and code editor" aria-orientation="vertical"
      aria-controls="problem-statement-panel" aria-valuemin={Math.round(minimum)} aria-valuemax={Math.round(maximum)}
      aria-valuenow={Math.round(split)} aria-valuetext={`Problem statement ${Math.round(split)} percent, code editor ${Math.round(100 - split)} percent`}
      title="Drag to resize. Arrow keys adjust; Shift for larger steps. Home/End for limits. Enter or double-click to reset."
      onKeyDown={onKeyDown} onDoubleClick={() => update(50, true)}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus();
        event.currentTarget.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, split };
        setDragging(true);
      }}
      onPointerMove={event => {
        if (!drag.current || event.pointerId !== drag.current.id) return;
        const available = container.current.getBoundingClientRect().width - DIVIDER_WIDTH;
        if (available > 0) update(drag.current.split + (event.clientX - drag.current.x) / available * 100);
      }}
      onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
    ><GripVertical size={14} aria-hidden="true" /></div>
    {panels[1]}
  </div>;
}
