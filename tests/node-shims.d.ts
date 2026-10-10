// Minimal declarations for the few Node built-ins the tests use (keeps @types/node out of the project).
declare module 'node:module' { export function createRequire(url: string): (id: string) => any; }
declare module 'node:fs' {
  export function mkdtempSync(prefix: string): string;
  export function readdirSync(dir: string): string[];
  export function readFileSync(file: string, enc: 'utf8'): string;
  export function writeFileSync(file: string, data: string): void;
}
declare module 'node:os' { export function tmpdir(): string; }
declare module 'node:path' { const path: { join(...parts: string[]): string }; export default path; }
