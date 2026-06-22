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

/** For You feed: score + created_at + id composite cursor */
export function encodeForYouCursor(score: number, createdAt: Date, id: number): string {
  return `${score}:${createdAt.getTime()}:${id}`;
}

export function parseForYouCursor(
  cursor: string
): { score: number; createdAt: Date; id: number } | null {
  const parts = cursor.split(':');
  if (parts.length !== 3) return null;
  const score = Number(parts[0]);
  const createdAt = new Date(Number(parts[1]));
  const id = Number(parts[2]);
  if (!Number.isFinite(score) || !Number.isFinite(createdAt.getTime()) || !Number.isFinite(id)) {
    return null;
  }
  return { score, createdAt, id };
}