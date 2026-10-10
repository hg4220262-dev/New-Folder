import type { ReactNode } from 'react';
import { store } from '../../engine/state';
import type { Win } from '../../engine/types';
import { NodeIcon, ExeIcon, MailIcon, ControlIcon, InfoIcon, DocIcon, ImgIcon, XlsIcon, NotepadIcon, WordPadIcon, CmdIcon, RunIcon } from '../icons';
import { Explorer } from './Explorer';
import { Notepad, WordPad } from './Docs';
import { ImageViewer, SheetViewer } from './Viewers';
import { Mail } from './Mail';
import { Ie } from './Ie';
import { Console } from './Console';
import { Joiner } from './Joiner';
import { LinkTerm } from './LinkTerm';
import { Cmd } from './Cmd';
import { EventViewer, TaskManager } from './System';
import { Properties } from './Properties';
import { Dialog, FolderOptions, RunBox, About } from './Dialogs';

export function appIcon(w: Win, size = 16): ReactNode {
  const s = store.s;
  switch (w.app) {
    case 'explorer': return <NodeIcon node={s.fs[w.path?.[w.path.length - 1] ?? 'desktop']} size={size} />;
    case 'notepad': return w.fileId ? <DocIcon size={size} /> : <NotepadIcon size={size} />;
    case 'wordpad': return w.fileId ? <DocIcon size={size} kind="doc" /> : <WordPadIcon size={size} />;
    case 'cmd': return <CmdIcon size={size} />;
    case 'run': return <RunIcon size={size} />;
    case 'image': return <ImgIcon size={size} />;
    case 'sheet': return <XlsIcon size={size} />;
    case 'mail': return <MailIcon size={size} />;
    case 'folderopts': return <ControlIcon size={size} />;
    case 'dialog': return <InfoIcon size={size} type={w.dialog?.icon ?? 'info'} />;
    case 'props': return <NodeIcon node={w.fileId ? s.fs[w.fileId] : undefined} size={size} />;
    default: return <ExeIcon size={size} />;
  }
}

export function renderApp(w: Win): ReactNode {
  switch (w.app) {
    case 'explorer': return <Explorer win={w} />;
    case 'notepad': return <Notepad win={w} />;
    case 'wordpad': return <WordPad win={w} />;
    case 'image': return <ImageViewer win={w} />;
    case 'sheet': return <SheetViewer win={w} />;
    case 'mail': return <Mail win={w} />;
    case 'cmd': return <Cmd win={w} />;
    case 'events': return <EventViewer />;
    case 'taskmgr': return <TaskManager />;
    case 'props': return <Properties win={w} />;
    case 'folderopts': return <FolderOptions win={w} />;
    case 'dialog': return <Dialog win={w} />;
    case 'run': return <RunBox win={w} />;
    case 'about': return <About win={w} />;
    case 'ie': return <Ie win={w} />;
    case 'console': return <Console win={w} />;
    case 'joiner': return <Joiner />;
    case 'linkterm': return <LinkTerm />;
    default: return null;
  }
}

/** Per-app window chrome options. */
export function chromeFor(w: Win) {
  const fixed = ['dialog', 'props', 'folderopts', 'run', 'about'].includes(w.app);
  return { resizable: !fixed, noMin: fixed, noMax: fixed, className: w.app === 'cmd' ? 'cmdwin' : '' };
}
