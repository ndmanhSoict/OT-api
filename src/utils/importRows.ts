export type ImportRow = Record<string, any>;

export function getCell(row: ImportRow, labels: string[]): any {
  for (const label of labels) {
    const value = row[label];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return null;
}

export function asText(value: any): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text === '—' || text === '-') return null;
  return text;
}

export function asDate(value: any): string | null {
  if (value === undefined || value === null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const utcDays = Math.floor(value - 25569);
    const date = new Date(utcDays * 86400 * 1000);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  if (!text || text === '—' || text === '-') return null;

  const dmy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const ymd = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymd) {
    const [, year, month, day] = ymd;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export function getRows(body: any): ImportRow[] {
  return Array.isArray(body?.rows) ? body.rows : [];
}

export function hasAnyValue(row: ImportRow): boolean {
  return Object.values(row).some((value) => asText(value) !== null);
}

export interface StakeholderImportItem {
  name: string;
  address: string | null;
}

export function splitList(value: any): string[] {
  const text = asText(value);
  if (!text) return [];
  return text
    .split(/[;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getStakeholders(namesValue: any, addressesValue: any): StakeholderImportItem[] {
  const names = splitList(namesValue);
  const addresses = splitList(addressesValue);
  return names.map((name, index) => ({
    name,
    address: addresses[index] ?? addresses[0] ?? null,
  }));
}

export async function findOrCreateStakeholder(connection: any, item: StakeholderImportItem, fallbackId: number): Promise<number> {
  const [existing]: any = await connection.query(
    'SELECT id FROM stakeholders WHERE name = ? AND COALESCE(address, "") = COALESCE(?, "")',
    [item.name, item.address]
  );
  if (existing.length > 0) return existing[0].id;

  const id = fallbackId;
  await connection.query(
    'INSERT INTO stakeholders (id, name, address) VALUES (?, ?, ?)',
    [id, item.name, item.address]
  );
  return id;
}
