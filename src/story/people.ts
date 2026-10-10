// Deterministic generation of Carrow's 1978 census (435 residents).
// Mill Row (23 people) is hand-written: they are the ones who were never relocated.

export interface Person { no: number; surname: string; forename: string; address: string; age: number }

type P = Omit<Person, 'no'>;
const mr = (surname: string, forename: string, house: number, age: number): P =>
  ({ surname, forename, address: `${house} Mill Row`, age });

export const MILL_ROW: P[] = [
  mr('Pryce', 'Ann', 1, 41), mr('Pryce', 'Thomas', 1, 44), mr('Pryce', 'Mary', 1, 9), mr('Pryce', 'Jack', 1, 7), mr('Pryce', 'Lily', 1, 4),
  mr('Ellery', 'George', 2, 67), mr('Ellery', 'Edith', 2, 65), mr('Ellery', 'Ruth', 2, 38), mr('Ellery', 'Peter', 2, 10),
  mr('Marsh', 'Walter', 3, 72), mr('Marsh', 'Iris', 3, 70), mr('Marsh', 'Owen', 3, 45),
  mr('Hollins', 'David', 4, 35), mr('Hollins', 'Carol', 4, 33), mr('Hollins', 'Susan', 4, 8), mr('Hollins', 'Paul', 4, 6),
  mr('Webb', 'Harold', 5, 58), mr('Webb', 'Joan', 5, 57),
  mr('Dunmore', 'Michael', 6, 29), mr('Dunmore', 'Helen', 6, 27), mr('Dunmore', 'Clare', 6, 5), mr('Dunmore', 'Ian', 6, 3),
  // Record 23: born after the census was drawn up. The name was never written down.
  mr('Dunmore', '(infant)', 6, 0),
];

export const PUPILS = ['Pryce, Mary', 'Pryce, Jack', 'Ellery, Peter', 'Hollins, Susan', 'Hollins, Paul', 'Dunmore, Clare'];

const SURNAMES = ('Abbott Ashby Bailey Barker Bevan Bird Bowen Bray Brook Carver Chapman Cole Collier Cooper Davies Day '
  + 'Dyer Evans Fairley Fenwick Fisher Fletcher Garner Gibbs Godwin Griffiths Hale Harding Hart Hayward Hughes Jarvis '
  + 'Jenkins Kemp Lacey Lamb Lloyd Lowe Mason Meredith Morgan Nash Owens Parry Payne Prosser Reece Rees Roberts Rowley '
  + 'Sayer Shaw Slade Thorne Tull Vaughan Wade Walsh Watkins Wilde Wynne Yeo').split(' ');
const MALE = ('Alan Arthur Bernard Brian Colin Dennis Derek Eric Frank Gareth Gordon Graham Howard Ivor John Keith '
  + 'Leonard Malcolm Neil Philip Raymond Robert Roy Stanley Stephen Trevor William').split(' ');
const FEMALE = ('Alice Barbara Beryl Brenda Carol Doreen Dorothy Eileen Elsie Gwen Hilda Irene Janet Jean Joyce '
  + 'Kathleen Linda Margaret Marion Megan Nora Pamela Rita Sandra Sheila Valerie Winifred').split(' ');
const KIDS = ('Andrew Claire Darren Emma Gary Helen Jason Joanne Karen Kevin Lisa Mark Michelle Nicola Paul Rachel '
  + 'Sarah Simon Tracy Wayne').split(' ');

const STREETS: [string, number][] = [
  ['High Street', 34], ['Church Lane', 18], ['Chapel Row', 14], ['Station Road', 16], ['Back Lane', 10],
  ['School Lane', 12], ['Wendell Road', 14],
];
const FARMS = ['Carrow Farm', 'Top Farm', 'Hollow Farm', 'Nant Farm', 'Ridge Cottage', 'Weir House', 'Lock Cottage'];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s ^ (s >>> 15), 2246822507) + 0x9e3779b9) >>> 0;
    s ^= s >>> 13;
    return (s >>> 0) / 4294967296;
  };
}

let cache: Person[] | null = null;

/** All 435 census entries, in census order (by address). */
export function census(): Person[] {
  if (cache) return cache;
  const r = rng(1978);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const target = 435 - MILL_ROW.length; // 412
  const out: P[] = [];
  const addresses: string[] = [];
  for (const [st, count] of STREETS) for (let i = 1; i <= count; i++) addresses.push(`${i} ${st}`);
  addresses.push(...FARMS);
  let ai = 0;
  while (out.length < target) {
    const address = addresses[ai % addresses.length];
    const sur = pick(SURNAMES);
    const size = Math.min(target - out.length, ai < addresses.length ? 1 + Math.floor(r() * 4) : 1);
    const headAge = 24 + Math.floor(r() * 55);
    for (let k = 0; k < size; k++) {
      const age = k === 0 ? headAge : k === 1 ? Math.max(20, headAge - 6 + Math.floor(r() * 10)) : Math.floor(r() * 16);
      const forename = k === 0 ? pick(MALE) : k === 1 ? pick(FEMALE) : pick(KIDS);
      out.push({ surname: sur, forename, address, age });
    }
    ai++;
  }
  // Mill Row sits between Chapel Row and Station Road in the census.
  const idx = out.findIndex((p) => p.address.includes('Station Road'));
  out.splice(idx < 0 ? out.length : idx, 0, ...MILL_ROW);
  cache = out.map((p, i) => ({ ...p, no: i + 1 }));
  return cache;
}

const NEW_HOMES = ['Halden Park Estate', 'Bryn Road, Halden', 'Ffordd Newydd, Llanwern', 'Council housing, Halden', 'Own arrangement'];

export function censusRows(): string[][] {
  return [['No.', 'Surname', 'Forename', 'Address', 'Age'],
    ...census().map((p) => [String(p.no), p.surname, p.forename, p.address, String(p.age)])];
}

export function relocationRows(): string[][] {
  const r = rng(1979);
  const moved = census().filter((p) => !p.address.includes('Mill Row'))
    .sort((a, b) => a.surname.localeCompare(b.surname) || a.forename.localeCompare(b.forename));
  return [['Ref', 'Surname', 'Forename', 'From', 'Rehoused at', 'Date'], ...moved.map((p, i) => {
    const day = 2 + Math.floor(r() * 11);
    return [`R${String(i + 1).padStart(3, '0')}`, p.surname, p.forename, p.address,
      NEW_HOMES[Math.floor(r() * NEW_HOMES.length)], `${String(day).padStart(2, '0')}/08/1979`];
  })];
}
