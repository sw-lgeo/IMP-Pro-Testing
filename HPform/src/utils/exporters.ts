import { LuxEebSchema } from '../types/schema';

const APP_VERSION = '0.1.0';

export function buildLuxEebPacket(data: LuxEebSchema): LuxEebSchema {
  return {
    ...data,
    meta: {
      ...data.meta,
      erstelltAmISO: new Date().toISOString(),
      appVersion: APP_VERSION,
      sprache: 'de',
      hinweis_en: 'Intake tool only – not an official Energiepass.',
    },
  };
}

export function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerBlobDownload(blob, filename);
}

export function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename);
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function csvFromArray(items: Record<string, unknown>[], headers?: string[]): string {
  if (!items.length) return '';
  const keys = headers ?? Array.from(
    items.reduce((acc, item) => {
      Object.keys(item).forEach((key) => acc.add(key));
      return acc;
    }, new Set<string>())
  );
  const escaped = (value: unknown) => {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const rows = [keys.join(';')];
  items.forEach((item) => {
    rows.push(keys.map((key) => escaped(item[key])).join(';'));
  });
  return rows.join('\n');
}

export function generateCsvBundle(data: LuxEebSchema) {
  const bundle: { filename: string; content: string }[] = [];
  bundle.push({ filename: 'Allgemeine_Projektdaten.csv', content: csvFromArray([data.Allgemeine_Projektdaten as unknown as Record<string, unknown>]) });
  bundle.push({ filename: 'Opaque_Bauteile.csv', content: csvFromArray(data.Opaque_Bauteile as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Transparente_Bauteile.csv', content: csvFromArray(data.Transparente_Bauteile as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Wärmebrücken.csv', content: csvFromArray([{ Methode: data.Wärmebrücken.Methode, DeltaUWB_W_m2K: data.Wärmebrücken.DeltaUWB_W_m2K }]) });
  bundle.push({ filename: 'Gebäudehülle_Flächen.csv', content: csvFromArray(data.Gebäudehülle.Flächen as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Zonen.csv', content: csvFromArray(data.Energiebezugsflächen_Zonen.Zonen as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Lüftung.csv', content: csvFromArray(data.Lüftung.Anlagen as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Heizungsanlagen.csv', content: csvFromArray(data.Heizungsanlagen as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Warmwasserbereitung.csv', content: csvFromArray(data.Warmwasserbereitung as unknown as Record<string, unknown>[]) });
  bundle.push({ filename: 'Hilfsenergie.csv', content: csvFromArray([data.Hilfsenergie as unknown as Record<string, unknown>]) });
  return bundle;
}

export function copyLuxEebPacket(data: LuxEebSchema) {
  const packet = buildLuxEebPacket(data);
  navigator.clipboard.writeText(JSON.stringify(packet, null, 2));
}
