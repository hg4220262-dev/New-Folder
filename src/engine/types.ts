export type NodeId = string;

export type FileKind =
  | 'folder' | 'drive' | 'computer' | 'bin'
  | 'txt' | 'doc' | 'img' | 'xls' | 'eml' | 'log' | 'ini' | 'exe' | 'lnk' | 'dat';

export interface Version {
  date: string;
  author: string;
  note: string;
  content?: string;
  name?: string;
}

export interface FNode {
  id: NodeId;
  name: string;
  kind: FileKind;
  /** A node can live in several folders at once (non-Euclidean filesystem). */
  parents: NodeId[];
  hidden?: boolean;
  system?: boolean;
  readOnly?: boolean;
  /** Not listed by Explorer at all, only by `dir /a` in Command Prompt. */
  ghost?: boolean;
  /** Not returned by Search. */
  unsearchable?: boolean;
  /** Visible only when logged on as Administrator. */
  adminOnly?: boolean;
  created: string;
  modified: string;
  accessed?: string;
  size?: number;
  content?: string;
  /** Picture key: a photograph in ui/art/render.ts PHOTO_URLS, else a drawn scene. */
  art?: string;
  /** Summary/Comments shown in Properties. */
  comments?: string;
  author?: string;
  origName?: string;
  versions?: Version[];
  /** Spreadsheet rows (first row is header). */
  rows?: string[][];
  /** For shortcuts. */
  target?: NodeId;
  /** Optional per-folder "Up" override (impossible structures). */
  upTo?: NodeId;
  locked?: string; // message shown when trying to open
  /** Applied when the file is renamed back to `origName`. */
  restore?: Partial<FNode>;
  /** Email headers. */
  mail?: { from: string; to: string; date: string; subject: string; unread?: boolean };
  /** Where a deleted item came from. */
  binFrom?: NodeId[];
}

export type AppKind =
  | 'explorer' | 'notepad' | 'wordpad' | 'image' | 'mail' | 'sheet' | 'cmd'
  | 'events' | 'props' | 'taskmgr' | 'folderopts' | 'dialog' | 'run' | 'about' | 'ie' | 'console' | 'joiner' | 'linkterm';

export interface Win {
  id: string;
  app: AppKind;
  title: string;
  x: number; y: number; w: number; h: number;
  z: number;
  min?: boolean;
  max?: boolean;
  /** Explorer: navigation path (list of folder ids, last = current). */
  path?: NodeId[];
  back?: NodeId[][];
  fwd?: NodeId[][];
  fileId?: NodeId;
  search?: string | null;
  dialog?: DialogSpec;
  notResponding?: boolean;
  /** Opened via the system rather than the player. */
  bySystem?: boolean;
  tab?: string;
  /** Internet Explorer start address. */
  url?: string;
}

export interface DialogSpec {
  title: string;
  text: string;
  icon?: 'info' | 'warn' | 'error' | 'question';
  buttons?: string[];
  /** Action id dispatched to the director when a button is pressed. */
  action?: string;
}

export interface Balloon {
  id: string;
  title: string;
  text: string;
  open?: NodeId;
  at: number;
  leak?: boolean;
}

export type GameEvent =
  | { t: 'open'; id: NodeId }
  | { t: 'view'; id: NodeId }
  | { t: 'rename'; id: NodeId; from: string; to: string }
  | { t: 'move'; id: NodeId; to: NodeId }
  | { t: 'delete'; id: NodeId }
  | { t: 'hidden'; on: boolean }
  | { t: 'cmd'; line: string }
  | { t: 'action'; id: string; button?: string }
  | { t: 'endtask'; name: string }
  | { t: 'tick' };

export interface Settings {
  reduceFlashing: boolean;
  reduceMotion: boolean;
  volume: number;
  /** Allow the game to leave one text file on the real Desktop when a story ends. */
  deskNote: boolean;
  /** Pause when the game window loses focus (on unless false). */
  pauseOnBlur?: boolean;
  /** A moment's wait, hourglass up, whenever something is opened (on unless false). */
  oldLag?: boolean;
  /** CRT monitor look (on unless false). */
  crt?: boolean;
  /** Curved-glass warp (on unless false). */
  crtCurve?: boolean;
}

export type Phase = 'title' | 'boot' | 'login' | 'desktop' | 'crash' | 'reboot' | 'recovery' | 'ending';
