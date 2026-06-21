export function formatPostTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 60) return 'agora';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} h`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} d`;

  const formatter = new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });

  return formatter.format(date).replace('.', '');
}