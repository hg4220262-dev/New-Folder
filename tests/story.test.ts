import { describe, it, expect, beforeEach } from 'vitest';
import './env';

const { store, ALL_ENDINGS } = await import('../src/engine/state');
const { newState, tick } = await import('../src/engine/director');
await import('../src/story/triggers');
const A = await import('../src/engine/actions');
const { census, relocationRows, MILL_ROW } = await import('../src/story/people');
const { children, searchFS, resolvePath, addressOf, session } = await import('../src/engine/fs');
const { emit } = await import('../src/engine/bus');
const S = await import('../src/story/storage');

const flush = () => new Promise((r) => setTimeout(r, 0));
function play(ms: number) { for (let t = 0; t < ms; t += 250) tick(250); }
const closeAll = () => { store.s.windows = []; };

beforeEach(() => {
  store.s = newState('Reona', 'Reona Monga');
  store.s.phase = 'desktop';
});

describe('census data', () => {
  it('has 435 residents and 412 relocations, missing exactly Mill Row', () => {
    expect(census()).toHaveLength(435);
    const rel = relocationRows().slice(1);
    expect(rel).toHaveLength(412);
    expect(rel.some((r) => r[3].includes('Mill Row'))).toBe(false);
    expect(MILL_ROW).toHaveLength(23);
  });
});

describe('filesystem', () => {
  it('hides hidden items unless asked', () => {
    const vis = children(store.s.fs, 'carrow', { hidden: false, system: false }).map((n) => n.id);
    expect(vis).not.toContain('unm');
    const all = children(store.s.fs, 'carrow', { hidden: true, system: false }).map((n) => n.id);
    expect(all).toContain('unm');
  });
  it('resolves typed paths and builds addresses', () => {
    const st = resolvePath(store.s.fs, 'C:\\HRS\\Carrow', 'Reona')!;
    expect(st.at(-1)).toBe('carrow');
    expect(addressOf(store.s.fs, st, 'Reona')).toBe('C:\\HRS\\Carrow');
    const md = resolvePath(store.s.fs, 'C:\\Documents and Settings\\Reona\\My Documents\\My Pictures', 'Reona')!;
    expect(md.at(-1)).toBe('mypics');
  });
  it('never lists ghost files in Explorer', () => {
    const ids = children(store.s.fs, 'f_eng', { hidden: true, system: true }).map((n) => n.id);
    expect(ids).not.toContain('kell');
    expect(children(store.s.fs, 'f_eng', { hidden: true, system: true, ghosts: true }).map((n) => n.id)).toContain('kell');
  });
});

describe('old-machine lag', () => {
  it('is skipped where there is no document, so opens land at once', () => {
    A.openNode('census');
    expect(store.s.windows.some((w) => w.app === 'sheet')).toBe(true);
    expect(store.ui.wait).toBe(0);
  });
});

describe('story progression', () => {
  it('chapter 2 starts after comparing census and relocation list', () => {
    A.openNode('census'); A.openNode('reloc');
    expect(store.s.chapter).toBe(2);
  });

  it('harmonises the summary only while it is off screen', () => {
    A.openNode('census'); A.openNode('reloc');
    closeAll();
    A.openNode('summary');
    play(5000);
    expect(store.s.fs.summary.content).toContain('435');
    closeAll();
    play(4000);
    expect(store.s.fs.summary.content).not.toContain('435');
    expect(store.s.fs.summary.versions?.at(-1)?.author).toBe('SYSTEM');
  });

  it('search suppresses Mill Row names in chapter 2', () => {
    A.openNode('census'); A.openNode('reloc');
    expect(store.s.suppress).toContain('pryce');
    expect(searchFS(store.s.fs, 'Pryce', { hidden: false, system: false, inContent: true }).length).toBeGreaterThan(0);
  });

  it('renaming a scan back to its original name restores it', () => {
    store.s.fs.regp2.name = 'register_p2.dat';
    A.renameNode('regp2', 'Carrow School Register 1979-80.txt');
    expect(store.s.fs.regp2.kind).toBe('txt');
    expect(store.s.flags.restored_regp2).toBe(true);
  });

  it('putting the restored photo next to the gate log creates a conflict report', () => {
    store.s.fs.scan412.parents = ['unm'];
    A.renameNode('scan412', 'Mill Row 12-08-1979');
    A.moveNode('scan412', 'f_eng', 'unm');
    expect(store.s.fs.conflict?.parents).toEqual(['f_eng']);
  });

  it('chapter 4 rewrites the register with the player name while unseen', () => {
    store.s.fs.regp2.parents = ['unm'];
    emit({ t: 'view', id: 'unm' });
    expect(store.s.chapter).toBe(3);
    A.renameNode('regp2', 'Carrow School Register 1979-80');
    A.openNode('regp2');
    store.s.fs.scan412.parents = ['unm'];
    A.renameNode('scan412', 'Mill Row 12-08-1979');
    A.moveNode('scan412', 'f_eng', 'unm');
    expect(store.s.chapter).toBe(4);
    closeAll();
    play(3000);
    expect(store.s.flags.youInRegister).toBe(true);
    expect(store.s.fs.profile.name).toBe('Reona.DUNMORE');
  });

  it('stopping the service early is refused; in chapter 5 it triggers the climax', async () => {
    emit({ t: 'endtask', name: 'hrscont.exe' });
    await flush();
    expect(store.s.flags.climax).toBeUndefined();
    store.s.chapter = 4;
    A.openNode('journal');
    expect(store.s.chapter).toBe(5);
    emit({ t: 'endtask', name: 'hrscont.exe' });
    await flush(); await flush();
    expect(store.s.flags.climax).toBe('taskmgr');
    expect(store.s.glitch).toBe(5);
  });

  it('deleting key evidence in chapter 3+ is undone by the system', () => {
    store.s.chapter = 3;
    store.s.fs.mr1.parents = ['unm'];
    A.deleteNode('mr1');
    expect(store.s.fs.mr1.parents).toEqual(['unm']);
  });
});

// Fetch a good replica of every block that has one on a live rack, then join the good copies in block order.
const fetchGood = (key: string) => S.specOf(key).place.forEach((reps, i) => { const k = reps.findIndex((r) => r.ok && !S.rackDown(r.node)); if (k >= 0) S.fetchReplica(key, i + 1, k); });
const downloads = (prefix: string, b: number) => Object.values(store.s.fs).filter((n) => n.parents.includes('hscdl') && n.name.startsWith(`${prefix}_000${b}_`));
function joinGood(key: string) {
  const f = S.specOf(key);
  const picks = f.text.map((_, i) => downloads(f.prefix, i + 1).find((d) => /CRC: OK/.test(d.content ?? ''))?.id ?? '');
  return S.tryJoin(key, picks);
}

describe('storage cluster', () => {
  it('joins the report once a good replica of every block is fetched', () => {
    fetchGood('report');
    expect(joinGood('report').ok).toBe(true);
    expect(store.s.flags.assembled).toBe(true);
    expect(store.s.fs.mrreport.content).toContain('never joined');
  });

  it("needs Rack 2 restored before the engineer's statement can be joined", () => {
    fetchGood('kell');
    expect(joinGood('kell').ok).toBe(false);
    expect(store.s.flags.assembledKell).toBeUndefined();
    store.s.flags.rack2On = true;
    fetchGood('kell');
    expect(joinGood('kell').ok).toBe(true);
    expect(store.s.flags.assembledKell).toBe(true);
    expect(store.s.fs.kellstmt.content).toContain('twenty-three');
  });
});

describe('stall hints', () => {
  it('leaves a clue in the event log only after a long stall in chapter 3', () => {
    store.s.chapter = 3;
    play(1000);
    play(3 * 60_000);
    expect(store.s.log.some((l) => l.text.includes('Not every record'))).toBe(false);
    play(2 * 60_000);
    expect(store.s.log.some((l) => l.text.includes('Not every record'))).toBe(true);
  });
});

describe('administrator account', () => {
  it('hides admin-only items from the normal account', () => {
    session.admin = false;
    expect(children(store.s.fs, 'desktop', { hidden: false, system: false }).some((n) => n.id === 'adm_lnk_console')).toBe(false);
    expect(children(store.s.fs, 'hrs', { hidden: true, system: true }).some((n) => n.id === 'adm_dir')).toBe(false);
    session.admin = true;
    expect(children(store.s.fs, 'desktop', { hidden: false, system: false }).some((n) => n.id === 'adm_lnk_console')).toBe(true);
    session.admin = false;
  });
});

describe('reviewer restrictions', () => {
  it('blocks Task Manager for the temp account until the administrator allows it', () => {
    session.admin = false;
    A.openApp('app:taskmgr');
    expect(store.s.windows.some((w) => w.app === 'taskmgr')).toBe(false);
    store.s.flags.allow_taskmgr = true;
    A.openApp('app:taskmgr');
    expect(store.s.windows.some((w) => w.app === 'taskmgr')).toBe(true);
  });
});

describe('release ending', () => {
  it('lets the report be published only once it has been joined', () => {
    emit({ t: 'action', id: 'release_confirm', button: 'Publish' });
    expect(store.s.ending).toBeNull();
    store.s.flags.assembled = true;
    emit({ t: 'action', id: 'release_confirm', button: 'Publish' });
    expect(store.s.ending).toBe('disclose');
  });
});

describe('passwords', () => {
  it('keeps the admin password in the fragmented IT handover, not in the incident records', async () => {
    const { ADMIN_PASSWORD } = await import('../src/story/world_admin');
    fetchGood('ops');
    joinGood('ops');
    expect(store.s.flags.assembledOps).toBe(true);
    expect(store.s.fs.ithandover.content).toContain(ADMIN_PASSWORD);
    expect(S.FILES[0].text.join(' ')).not.toContain(ADMIN_PASSWORD);
  });
});

describe('empty the dam ending', () => {
  it('needs the joined report to reach the weir, and the station code to open the sluices', async () => {
    const [a, b] = S.SLUICE_CODE.split('-');
    // The first half is the bird on the station door: the keeper points at it, the archive photograph names it.
    expect(S.WEIR_FILES.keeper_notes.text).toContain('bird');
    expect(store.s.fs.p_weir.comments).toContain(a);
    expect(S.WEIR_FILES.manual.text).toContain(b);
    const { chooseEnding } = await import('../src/story/climax');
    chooseEnding('drain');
    expect(store.s.ending).toBe('drain');
  });
});

describe('weir access', () => {
  it('is mounted only when all three cluster files are joined', () => {
    store.s.flags.assembled = true; store.s.flags.assembledKell = false; store.s.flags.assembledOps = false;
    expect(S.weirMounted()).toBe(false);
    store.s.flags.assembledKell = true; store.s.flags.assembledOps = true;
    expect(S.weirMounted()).toBe(true);
  });
});

describe('weir trail', () => {
  it('points each joined file toward the next step, and every directory file exists', () => {
    expect(S.specOf('ops').text.join(' ')).toContain('Admin folder');
    expect(S.specOf('kell').text.join(' ')).toContain('Nant Weir');
    Object.values(S.WEIR_DIRS).forEach((d) => d.files.forEach((k) => expect(S.WEIR_FILES[k]).toBeDefined()));
    expect(S.WEIR_FILES.rowley_letter.text.toLowerCase()).toContain(S.WEIR_OFFICER);
  });
});

describe('hscjoin.exe', () => {
  it('joins pieces only when they are good and in block order', () => {
    fetchGood('ops');
    const ops = S.specOf('ops');
    const pieces = ops.text.map((_, i) => downloads(ops.prefix, i + 1).find((d) => /CRC: OK/.test(d.content ?? ''))!.id);
    expect(S.joinPieces([]).ok).toBe(false);
    expect(S.joinPieces(pieces.slice(0, 2)).ok).toBe(false);
    expect(S.joinPieces([pieces[1], pieces[0], pieces[2]]).ok).toBe(false);
    expect(store.s.flags.assembledOps).toBeFalsy();
    expect(S.joinPieces(pieces).ok).toBe(true);
    expect(store.s.flags.assembledOps).toBe(true);
  });
});

describe('old saves', () => {
  it('pick up files added to the world, but not ones the player emptied from the bin', async () => {
    const { migrate } = await import('../src/ui/screens/session');
    const st = JSON.parse(JSON.stringify(store.s));
    st.flags.worldV = 1;
    delete st.fs.hscjoin;
    delete st.fs.adm_telemetry;
    st.flags.purged = ['adm_telemetry'];
    migrate(st);
    expect(st.fs.hscjoin).toBeDefined();
    expect(st.fs.adm_telemetry).toBeUndefined();
  });
});

describe('ending recap', () => {
  it("sums up what the reviewer did", async () => {
    const { recap, CONCLUSION } = await import('../src/story/recap');
    store.s.flags.assembled = true; store.s.flags.adminEver = true; store.s.flags.rack2On = true;
    const r = recap(store.s).join(' ');
    expect(r).toContain('Board report');
    expect(r).toContain('Rack 2');
    ALL_ENDINGS.forEach(([k]) => expect(CONCLUSION[k]).toBeTruthy());
  });
});

describe('side route hints', () => {
  it('keeps hinting between the first joined file and the weir', () => {
    store.s.chapter = 3;
    store.s.flags.assembled = true;
    play(1000);
    play(3 * 60_000);
    expect(store.s.log.some((l) => l.text.includes('whoever looked after this store'))).toBe(true);
  });
});

describe('coax node', () => {
  it('keeps the node login in the admin file', () => {
    expect(store.s.fs.adm_telemetry.content).toContain(S.COAX_PASSWORD);
  });
  it('leaves exactly one channel unassigned on the plan, and it is the telemetry channel', () => {
    const free = S.COAX_PLAN.filter(([, p]) => p === '(unassigned)');
    expect(free).toEqual([[S.COAX_CHANNEL, '(unassigned)']]);
  });
});
