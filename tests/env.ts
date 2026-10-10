// DOM-free environment for the engine: an in-memory localStorage so the save code runs under Node.
export const mem = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
  setItem: (k: string, v: string) => { mem.set(k, String(v)); },
  removeItem: (k: string) => { mem.delete(k); },
};
(globalThis as any).window = { innerWidth: 1440, innerHeight: 900 };
