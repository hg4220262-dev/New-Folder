import { store } from '../engine/state';
import { dialog } from '../engine/windows';
import { sfx } from '../engine/bus';
import { session } from '../engine/fs';

// Restrictions the Administrator account has placed on the reviewer (temp) account.
// The Administrator can lift each one from the Service Console.
export const POLICIES: Record<string, { label: string; message: string }> = {
  taskmgr: { label: 'Task Manager', message: 'Task Manager has been disabled by your administrator.' },
};

export const isRestricted = (app: string): boolean => !!POLICIES[app] && !session.admin && !store.s.flags[`allow_${app}`];

/** True (and tells the player why) when the app is blocked for this account. */
export function blockedByPolicy(app: string): boolean {
  if (!isRestricted(app)) return false;
  dialog(app === 'taskmgr' ? 'Windows Task Manager' : 'Restrictions', POLICIES[app].message, 'error');
  sfx('error');
  return true;
}
