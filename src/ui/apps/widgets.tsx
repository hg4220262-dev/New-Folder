import type { ReactNode } from 'react';

export const Group = ({ title, children, style }: { title: string; children: ReactNode; style?: React.CSSProperties }) => (
  <div className="groupbox" style={style}><span className="legend">{title}</span>{children}</div>
);
