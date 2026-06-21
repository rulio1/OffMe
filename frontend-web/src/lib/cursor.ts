export const PAGE_SIZE = 20;

export function encodeCursor(createdAt: Date, id: number): string {
  return `${createdAt.getTime()}:${id}`;
}

export function parseCursor(cursor: string): { createdAt: Date; id: number } | null {
  const [ts, idStr] = cursor.split(':');
  const createdAt = new Date(Number(ts));
  const id = Number(idStr);
  if (!Number.isFinite(createdAt.getTime()) || !Number.isFinite(id)) return null;
  return { createdAt, id };
}