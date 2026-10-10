import { useState } from 'react';
import { store, useStore, type MenuItem } from '../engine/state';
import { toMonitor } from './pointer';
import { screenWidth } from '../engine/windows';
import { sfx } from '../engine/bus';

export function openMenu(e: { clientX: number; clientY: number }, items: MenuItem[]) {
  const p = toMonitor(e);
  store.ui.menu = { x: p.x, y: p.y, items };
  store.bump();
}

export function closeMenu() {
  if (store.ui.menu) { store.ui.menu = null; store.bump(); }
}

function MenuList({ items, x, y, nested }: { items: MenuItem[]; x: number; y: number; nested?: boolean }) {
  const [sub, setSub] = useState<number | null>(null);
  const h = items.reduce((a, i) => a + (i.sep ? 7 : 17), 6);
  const left = nested ? undefined : Math.min(x, screenWidth() - 180);
  const top = nested ? undefined : Math.min(y, 768 - 30 - h);
  return (
    <div className="menu" style={{ left, top }} onMouseDown={(e) => e.stopPropagation()}>
      {items.map((it, i) => it.sep ? <div key={i} className="sep" /> : (
        <div
          key={i}
          className={`item ${it.disabled ? 'dis' : ''} ${it.bold ? 'bold' : ''} ${it.checked ? 'chk' : ''} ${it.sub ? 'sub' : ''}`}
          onMouseEnter={() => setSub(it.sub ? i : null)}
          onClick={(e) => {
            e.stopPropagation();
            if (it.disabled || it.sub) return;
            sfx('click');
            closeMenu();
            it.run?.();
          }}
        >
          {it.label}
          {it.sub && sub === i && <MenuList items={it.sub} x={150} y={-3} nested />}
        </div>
      ))}
    </div>
  );
}

export function MenuLayer() {
  useStore();
  const m = store.ui.menu;
  if (!m) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 59999 }} onMouseDown={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}>
      <MenuList items={m.items} x={m.x} y={m.y} />
    </div>
  );
}
