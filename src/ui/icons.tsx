import type { ReactNode } from 'react';
import type { FNode } from '../engine/types';

// Original icon artwork drawn in the general style of 2001-era desktops.
// None of these are copies of Microsoft icons.

type P = { size?: number };
const S = ({ size = 32, children }: { size?: number; children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" style={{ flex: 'none', display: 'block' }}>{children}</svg>
);
const Page = ({ fold = '#e8e8e8' }: { fold?: string }) => (
  <>
    <path d="M6 2h14l6 6v22H6z" fill="#fff" stroke="#8b8b8b" />
    <path d="M20 2v6h6" fill={fold} stroke="#8b8b8b" />
  </>
);

export const FolderIcon = ({ size, open }: P & { open?: boolean }) => (
  <S size={size}>
    <path d="M2.5 7.5a1 1 0 0 1 1-1h8l2 3h14.5a1 1 0 0 1 1 1v16H2.5z" fill="url(#ig-fb)" stroke="#b78a2c" strokeLinejoin="round" />
    <rect x="5" y="10" width="21" height="13" fill="#fff" stroke="#c9c9c9" strokeWidth="0.6" transform="rotate(-4 15 16)" />
    <path d={open ? 'M1.5 13.5h27l-3 13.5H2.5z' : 'M2.5 12.5h26.5v13.5a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1z'} fill="url(#ig-ff)" stroke="#b78a2c" strokeLinejoin="round" />
    <path d={open ? 'M3 14.5h24' : 'M3.5 13.5h24.5'} stroke="rgba(255,255,255,0.75)" />
  </S>
);

export const DocIcon = ({ size, kind = 'txt' }: P & { kind?: string }) => (
  <S size={size}>
    <Page />
    {[11, 14, 17, 20, 23, 26].map((y) => <rect key={y} x="9" y={y} width={y === 26 ? 9 : 14} height="1.3" fill="#9aa4b8" />)}
    {kind === 'doc' && <rect x="2" y="16" width="13" height="12" rx="1" fill="#2a5bd7" />}
    {kind === 'doc' && <text x="8.5" y="26" fontSize="9" textAnchor="middle" fill="#fff" fontFamily="W95FA" fontWeight="bold">W</text>}
    {kind === 'ini' && <g><circle cx="10" cy="24" r="5" fill="#bbb" stroke="#666" /><circle cx="10" cy="24" r="2" fill="#fff" /></g>}
    {kind === 'log' && <rect x="8" y="5" width="8" height="3" fill="#777" />}
  </S>
);

export const ImgIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="3" y="5" width="26" height="22" fill="#fff" stroke="#8b8b8b" />
    <rect x="5" y="7" width="22" height="16" fill="#8fc1f0" />
    <path d="M5 23l7-9 5 6 3-3 7 6z" fill="#4c9a3c" />
    <circle cx="22" cy="11" r="2.5" fill="#ffe36b" />
  </S>
);

export const XlsIcon = ({ size }: P) => (
  <S size={size}>
    <Page />
    {[0, 1, 2, 3, 4].map((r) => [0, 1, 2].map((c) => (
      <rect key={`${r}${c}`} x={9 + c * 5} y={11 + r * 3.4} width="4.4" height="2.8" fill={r === 0 ? '#3d8f3d' : '#cfe5cf'} />
    )))}
    <rect x="2" y="17" width="12" height="11" rx="1" fill="#1e7d32" />
    <text x="8" y="26" fontSize="9" textAnchor="middle" fill="#fff" fontWeight="bold" fontFamily="W95FA">X</text>
  </S>
);

export const MailIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="3" y="8" width="26" height="17" fill="#fffbe8" stroke="#a88a3a" />
    <path d="M3 8l13 10L29 8" fill="none" stroke="#a88a3a" />
  </S>
);

export const ExeIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="3" y="5" width="26" height="22" rx="1" fill="#fff" stroke="#5a6f9c" />
    <rect x="3" y="5" width="26" height="5" fill="#2a5bd7" />
    <rect x="6" y="13" width="9" height="9" fill="#d6dff7" stroke="#8aa0d0" />
  </S>
);

export const NotepadIcon = ({ size }: P) => (
  <S size={size}>
    <path d="M6 4h19v25H6z" fill="#fdfdf3" stroke="#6e7f99" />
    <path d="M6 4h19v4H6z" fill="#5d8ad8" stroke="#3b5c9e" />
    {[6, 10.5, 15, 19.5].map((x) => <circle key={x} cx={x + 2} cy="4" r="1.4" fill="#fff" stroke="#555" strokeWidth="0.6" />)}
    {[12, 15, 18, 21, 24].map((y) => <rect key={y} x="9" y={y} width={y === 24 ? 8 : 13} height="1.2" fill="#8a93a8" />)}
  </S>
);

export const CmdIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="2.5" y="5.5" width="27" height="21" rx="1" fill="#000" stroke="#5a6f9c" />
    <rect x="2.5" y="5.5" width="27" height="4" fill="#2a5bd7" />
    <path d="M6 14l4 2.5L6 19" stroke="#c0c0c0" strokeWidth="1.6" fill="none" />
    <rect x="12" y="18" width="6" height="1.6" fill="#c0c0c0" />
  </S>
);

export const WordPadIcon = ({ size }: P) => (
  <S size={size}>
    <Page />
    {[11, 14, 17, 20].map((y) => <rect key={y} x="9" y={y} width="14" height="1.3" fill="#9aa4b8" />)}
    <path d="M17 29l9-13 3 2-9 13-4 1z" fill="#f2cd5c" stroke="#8a6a1c" strokeWidth="0.8" />
    <path d="M16 31l1-3 3 2z" fill="#333" />
  </S>
);

export const RunIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="3" y="6" width="26" height="20" rx="1.5" fill="#fff" stroke="#5a6f9c" />
    <rect x="3" y="6" width="26" height="4" fill="#2a5bd7" />
    <rect x="6" y="17" width="16" height="5" fill="#fff" stroke="#7f9db9" />
    <path d="M22 13l5 3.5-5 3.5z" fill="#3c9a3c" />
  </S>
);

export const DatIcon = ({ size }: P) => (
  <S size={size}>
    <Page />
    <rect x="9" y="13" width="14" height="10" fill="#e8e8e8" stroke="#aaa" />
    <text x="16" y="21" fontSize="6" textAnchor="middle" fill="#666" fontFamily="W95FA">?</text>
  </S>
);

/** Shared gradients for the icon set, rendered once (see IconDefs). */
export function IconDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="ig-fb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbe7a1" /><stop offset="1" stopColor="#e2b453" /></linearGradient>
        <linearGradient id="ig-ff" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stopColor="#fff4cc" /><stop offset="0.5" stopColor="#f9d97e" /><stop offset="1" stopColor="#e9b44a" /></linearGradient>
        <linearGradient id="ig-case" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f3f1ea" /><stop offset="1" stopColor="#c9c4b4" /></linearGradient>
        <linearGradient id="ig-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7fb2ff" /><stop offset="0.5" stopColor="#2f6fe0" /><stop offset="1" stopColor="#1b47a8" /></linearGradient>
        <linearGradient id="ig-bin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#b9cbe0" /><stop offset="0.35" stopColor="#f4f8fc" /><stop offset="1" stopColor="#9fb4cf" /></linearGradient>
        <linearGradient id="ig-drive" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f2f0ea" /><stop offset="1" stopColor="#b7b2a2" /></linearGradient>
        <radialGradient id="ig-cd" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stopColor="#fff" /><stop offset="0.5" stopColor="#d9e6f7" /><stop offset="0.75" stopColor="#f3d9f0" /><stop offset="1" stopColor="#bcd0ea" /></radialGradient>
      </defs>
    </svg>
  );
}

export const ComputerIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="3.5" y="2.5" width="25" height="19" rx="2" fill="url(#ig-case)" stroke="#6d6a5f" />
    <rect x="6.5" y="5.5" width="19" height="13" fill="url(#ig-screen)" stroke="#43566f" strokeWidth="0.8" />
    <path d="M6.5 5.5h19v5c-7 2.4-12-1.5-19 1z" fill="rgba(255,255,255,0.3)" />
    <path d="M12 21.5h8l1 2.5H11z" fill="#bdb8a8" stroke="#6d6a5f" strokeWidth="0.6" />
    <rect x="5.5" y="24" width="21" height="5.5" rx="1" fill="url(#ig-case)" stroke="#6d6a5f" />
    <path d="M8 26.5h12" stroke="#a49f8f" strokeWidth="0.8" />
    <circle cx="23.5" cy="26.8" r="0.9" fill="#4bd24b" />
  </S>
);

export const DriveIcon = ({ size, cd }: P & { cd?: boolean }) => (
  <S size={size}>
    {cd && <circle cx="14" cy="10.5" r="7.5" fill="url(#ig-cd)" stroke="#8ea0b8" strokeWidth="0.8" />}
    {cd && <circle cx="14" cy="10.5" r="1.8" fill="#fff" stroke="#8ea0b8" strokeWidth="0.6" />}
    <path d="M3.5 15l3.5-5h18l3.5 5" fill="#e6e3da" stroke="#6d6a5f" />
    <rect x="3.5" y="15" width="25" height="9" rx="1" fill="url(#ig-drive)" stroke="#6d6a5f" />
    <path d="M6 19.5h11" stroke="#9c9786" strokeWidth="1.2" />
    <rect x="21" y="18.5" width="4.5" height="2" rx="0.5" fill={cd ? '#888' : '#4bd24b'} stroke="rgba(0,0,0,0.3)" strokeWidth="0.4" />
  </S>
);

export const BinIcon = ({ size, full }: P & { full?: boolean }) => (
  <S size={size}>
    {full && <path d="M10 8l3-5 3 2.5 4-3 2.5 5.5" fill="#fff" stroke="#999" strokeWidth="0.8" />}
    <path d="M6.5 9h19l-2.2 19.5a1.5 1.5 0 0 1-1.5 1.3H10.2a1.5 1.5 0 0 1-1.5-1.3z" fill="url(#ig-bin)" stroke="#5f7894" />
    <ellipse cx="16" cy="9" rx="9.5" ry="2.6" fill="#dfe7f1" stroke="#5f7894" />
    <ellipse cx="16" cy="9.2" rx="7" ry="1.4" fill="#9fb2ca" />
    <path d="M11.5 13.5l.8 13M16 13.5v13M20.5 13.5l-.8 13" stroke="#8aa1bf" strokeWidth="0.9" />
    <path d="M13 18.5c1-1.8 3.5-2.2 5-.6l-1 .1M19 21c-.6 1.9-3.1 2.8-4.8 1.6l.9-.4" stroke="#3a9a3a" strokeWidth="1.1" fill="none" />
  </S>
);

export const ControlIcon = ({ size }: P) => (
  <S size={size}>
    <rect x="3" y="5" width="26" height="22" rx="2" fill="#f4f1e4" stroke="#6d6a5f" />
    <circle cx="11" cy="16" r="5" fill="#3a6fd8" />
    <rect x="18" y="10" width="8" height="3" fill="#4c9a3c" />
    <rect x="18" y="15" width="8" height="3" fill="#d8a21e" />
    <rect x="18" y="20" width="8" height="3" fill="#c33" />
  </S>
);

export const ShortcutArrow = ({ size = 32 }: P) => (
  <svg width={size * 0.36} height={size * 0.36} viewBox="0 0 12 12" style={{ position: 'absolute', left: 0, bottom: 0 }}>
    <rect x="0.5" y="0.5" width="11" height="11" fill="#fff" stroke="#555" />
    <path d="M3 9c0-4 2-5 5-5V2l3 3-3 3V6c-2 0-4 1-5 3z" fill="#1c3fae" />
  </svg>
);

export const InfoIcon = ({ size = 32, type = 'info' }: P & { type?: string }) => (
  <S size={size}>
    {type === 'error' && <g><circle cx="16" cy="16" r="13" fill="#d8261b" stroke="#8c0d07" /><path d="M10 10l12 12M22 10L10 22" stroke="#fff" strokeWidth="3" /></g>}
    {type === 'warn' && <g><path d="M16 3l14 25H2z" fill="#ffd431" stroke="#9b7a00" /><rect x="14.5" y="11" width="3" height="10" /><rect x="14.5" y="23" width="3" height="3" /></g>}
    {type === 'info' && <g><circle cx="16" cy="16" r="13" fill="#fff" stroke="#2a5bd7" strokeWidth="2" /><rect x="14.5" y="13" width="3" height="10" fill="#2a5bd7" /><circle cx="16" cy="9.5" r="2" fill="#2a5bd7" /></g>}
    {type === 'question' && <g><circle cx="16" cy="16" r="13" fill="#fff" stroke="#2a5bd7" strokeWidth="2" /><text x="16" y="22" textAnchor="middle" fontSize="17" fontWeight="bold" fill="#2a5bd7" fontFamily="W95FA">?</text></g>}
  </S>
);

/** Original four-pane wave mark (not the trademarked logo). */
export const WinFlag = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: 'none' }}>
    <path d="M2 5c3-2 6-2 9 0v7c-3-2-6-2-9 0z" fill="#f35325" />
    <path d="M12.5 5c3 2 6 2 9 0v7c-3 2-6 2-9 0z" fill="#81bc06" />
    <path d="M2 13.5c3-2 6-2 9 0v7c-3-2-6-2-9 0z" fill="#05a6f0" />
    <path d="M12.5 13.5c3 2 6 2 9 0v7c-3 2-6 2-9 0z" fill="#ffba08" />
  </svg>
);

function shortcutBase(t: string, size: number) {
  if (t === 'carrow' || t === 'adm_dir') return <FolderIcon size={size} />;
  if (t === 'app:mail') return <MailIcon size={size} />;
  if (t === 'app:review') return <InfoIcon size={size} type="question" />;
  if (t.includes('folderopts')) return <ControlIcon size={size} />;
  return <ExeIcon size={size} />;
}

export function NodeIcon({ node, size = 32, open }: { node: FNode | undefined; size?: number; open?: boolean }) {
  if (!node) return <DatIcon size={size} />;
  switch (node.kind) {
    case 'lnk':
      return (
        <span style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
          {shortcutBase(node.target ?? '', size)}<ShortcutArrow size={size} />
        </span>
      );
    case 'folder': return node.id === 'control' ? <ControlIcon size={size} /> : <FolderIcon size={size} open={open} />;
    case 'computer': return <ComputerIcon size={size} />;
    case 'drive': return <DriveIcon size={size} cd={node.id === 'd'} />;
    case 'bin': return <BinIcon size={size} />;
    case 'img': return <ImgIcon size={size} />;
    case 'xls': return <XlsIcon size={size} />;
    case 'eml': return <MailIcon size={size} />;
    case 'exe': return <ExeIcon size={size} />;
    case 'dat': return <DatIcon size={size} />;
    default: return <DocIcon size={size} kind={node.kind} />;
  }
}

