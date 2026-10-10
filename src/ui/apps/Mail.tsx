import { useState } from 'react';
import { store } from '../../engine/state';
import { children } from '../../engine/fs';
import { openNode } from '../../engine/actions';
import type { FNode, Win } from '../../engine/types';
import { MailIcon, FolderIcon } from '../icons';

export function Mail({ win }: { win: Win }) {
  const s = store.s;
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
  const single = win.fileId ? s.fs[win.fileId] : undefined;
  const list = children(s.fs, folder, { hidden: true, system: true }).filter((n) => n.kind === 'eml')
    .sort((a, b) => (b.mail?.date ?? '').localeCompare(a.mail?.date ?? ''));
  const [selId, setSel] = useState<string | null>(single?.id ?? null);
  const sel: FNode | undefined = single ?? (selId ? s.fs[selId] : list[0]);
  const unread = children(s.fs, 'inbox', { hidden: true, system: true }).filter((n) => n.mail?.unread).length;

  const pick = (n: FNode) => { setSel(n.id); if (n.mail?.unread) openNode(n.id); };

  return (
    <>
      {!single && <div className="menubar">{['File', 'Edit', 'View', 'Tools', 'Message', 'Help'].map((m) => <span key={m} className="mi">{m}</span>)}</div>}
      <div className="mail">
        {!single && (
          <div className="mail-folders">
            <div className={`f ${folder === 'inbox' ? 'on' : ''}`} onClick={() => setFolder('inbox')}><FolderIcon size={16} /> Inbox{unread ? ` (${unread})` : ''}</div>
            <div className={`f ${folder === 'sent' ? 'on' : ''}`} onClick={() => setFolder('sent')}><FolderIcon size={16} /> Sent Items</div>
            <div className="f"><FolderIcon size={16} /> Deleted Items</div>
          </div>
        )}
        <div className="mail-main">
          {!single && (
            <div className="mail-list">
              <div className="row hdr"><span>{folder === 'sent' ? 'To' : 'From'}</span><span>Subject</span><span>Received</span></div>
              {list.map((n) => (
                <div key={n.id} className={`row ${n.mail?.unread ? 'unread' : ''} ${sel?.id === n.id ? 'on' : ''}`} onMouseDown={() => pick(n)}>
                  <span><MailIcon size={12} /> {(folder === 'sent' ? n.mail?.to : n.mail?.from)?.replace(/<.*>/, '')}</span>
                  <span>{n.mail?.subject}</span>
                  <span>{n.mail?.date}</span>
                </div>
              ))}
            </div>
          )}
          {sel?.mail && (
            <>
              <div className="mail-head selectable">
                <div><b>From:</b> {sel.mail.from}</div>
                <div><b>Date:</b> {sel.mail.date}</div>
                <div><b>To:</b> {sel.mail.to}</div>
                <div><b>Subject:</b> {sel.mail.subject}</div>
              </div>
              <div className="mail-body selectable">{sel.content}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
