/**
 * The race at the end. After the crash, the player has to pick the one startup mode the
 * Continuity Service does not load in (plain Safe Mode) before the HRS Archive Assistant
 * starts Windows for them. Three tries: each is shorter, and the assistant pushes harder.
 *
 * The answer can be found in play: continuity.ini has a [Startup] section, the journal
 * says it in chapter 5, and the first lost try prints the service's startup table.
 */
export type BootOpt = 'safe' | 'net' | 'cmd' | 'lkg' | 'normal' | 'decoy';

export const BOOT_LABEL: Record<BootOpt, string> = {
  safe: 'Safe Mode',
  net: 'Safe Mode with Networking',
  cmd: 'Safe Mode with Command Prompt',
  lkg: 'Last Known Good Configuration (your most recent settings that worked)',
  normal: 'Start Windows Normally',
  /** Added to the menu by the assistant on the last try. It is not Safe Mode. */
  decoy: 'Safe Mode (recommended)',
};

/** How the service starts in each mode. continuity.ini's [Startup] block is built from this. */
export const STARTUP: [BootOpt, string, string][] = [
  ['normal', 'Normal', 'LOAD'], ['net', 'Networking', 'LOAD'], ['cmd', 'CommandPrompt', 'LOAD'],
  ['lkg', 'LastKnownGood', 'RESTORE'], ['safe', 'SafeMode', 'SKIP'],
];

export const TRIES = 3;

export interface Round {
  no: number;
  /** Time on the countdown. */
  ms: number;
  /** How often the assistant interferes. */
  tugMs: number;
  /** The assistant rearranges the menu each time it interferes. */
  shuffle: boolean;
  /** The assistant adds its own "Safe Mode (recommended)". */
  decoy: boolean;
  /** Each interference also takes a second off the countdown. */
  skip: boolean;
  /** Where the assistant drags the highlight. */
  pick: BootOpt;
  /** What the assistant says, one line per interference. */
  lines: string[];
}

const ROUNDS: Omit<Round, 'no'>[] = [
  {
    ms: 20_000, tugMs: 5000, shuffle: false, decoy: false, skip: false, pick: 'normal',
    lines: [
      'Start Windows Normally is recommended.',
      'Your most recent settings worked. You do not need to choose.',
      'I can start Windows for you.',
      'Start Windows Normally is recommended.',
    ],
  },
  {
    ms: 15_000, tugMs: 3500, shuffle: true, decoy: false, skip: true, pick: 'normal',
    lines: [
      'The review is still open. Start Windows Normally.',
      'I have tidied the options for you.',
      'Record 23 is nearly finished.',
      'You do not need to choose.',
    ],
  },
  {
    ms: 11_000, tugMs: 2600, shuffle: true, decoy: true, skip: true, pick: 'decoy',
    lines: [
      'I have added Safe Mode for you. It is recommended.',
      'Choose the recommended option.',
      'Record 23 is nearly finished.',
      'Do not make me choose.',
    ],
  },
];

/** The try after `losses` lost tries. */
export function round(losses: number): Round {
  const no = Math.max(0, Math.min(TRIES - 1, Math.floor(losses) || 0));
  return { no, ...ROUNDS[no] };
}

/** Menu options in their normal order. */
export function options(r: Round): BootOpt[] {
  return r.decoy ? ['safe', 'net', 'cmd', 'decoy', 'lkg', 'normal'] : ['safe', 'net', 'cmd', 'lkg', 'normal'];
}

/** Lay options out like the real menu: the Safe Mode group, a gap, one, a gap, one. */
export function rows(order: BootOpt[]): (BootOpt | null)[] {
  const n = order.length;
  if (n < 3) return [...order];
  return [...order.slice(0, n - 2), null, order[n - 2], null, order[n - 1]];
}

/** A new order that always differs from the old one, and always moves Safe Mode. */
export function reshuffle(order: BootOpt[], rnd: () => number = Math.random): BootOpt[] {
  if (order.length < 2) return [...order];
  let next = [...order];
  for (let attempt = 0; attempt < 12; attempt++) {
    next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    if (next.indexOf('safe') !== order.indexOf('safe')) return next;
  }
  // Fallback: swap Safe Mode with its neighbour.
  next = [...order];
  const i = next.indexOf('safe');
  const j = i === next.length - 1 ? i - 1 : i + 1;
  if (i >= 0) [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** What the screen prints when the assistant gets its way. `losses` already counts this one. */
export function actLines(opt: BootOpt | null, user: string, losses: number): string[] {
  const chosen = opt ?? 'normal';
  const out: string[] = [];
  if (!opt) out.push('No option was chosen in time.', `HRS Archive Assistant chose: ${BOOT_LABEL.normal}`, '');
  out.push(`Windows is starting: ${BOOT_LABEL[chosen]}`);
  if (chosen === 'decoy') out.push('  This option was added by HRS Archive Assistant.');
  if (chosen === 'lkg') out.push('Restoring your most recent settings that worked...', '  Restored: HRS Continuity Service (14/08/2008 03:14)');
  const record = `Record 23: Dunmore, ${user} `;
  out.push(
    '',
    'Loading services...',
    '  HRS Continuity Service (hrscont.exe)',
    `    Startup: ${STARTUP.map(([, k, v]) => `${k}=${v}`).join('  ')}`,
    '    Service loaded.',
    '',
    `${record}${'.'.repeat(Math.max(3, 40 - record.length))} ${Math.min(losses, TRIES)} of ${TRIES}`,
    losses >= TRIES ? 'Record 23 is finished. Continuity restored.' : 'Record 23 is not finished. Restarting to finish the record.',
  );
  return out;
}
