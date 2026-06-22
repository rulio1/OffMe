const MENTION_RE = /@([a-zA-Z0-9_]{1,30})/g;
const TOKEN_RE = /(@[a-zA-Z0-9_]{1,30}|#[a-zA-Z0-9_\u00C0-\u024F]{1,50})/g;

export function extractMentions(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    found.add(match[1].toLowerCase());
  }
  return Array.from(found);
}

export type PostTextPart =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; username: string }
  | { type: 'hashtag'; value: string; tag: string };

export function parsePostText(text: string): PostTextPart[] {
  if (!text) return [];

  const parts: PostTextPart[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(TOKEN_RE.source, 'g');

  while ((match = re.exec(text)) !== null) {
    const index = match.index;
    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    const token = match[0];
    if (token.startsWith('@')) {
      parts.push({ type: 'mention', value: token, username: token.slice(1) });
    } else {
      parts.push({ type: 'hashtag', value: token, tag: token.slice(1) });
    }
    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', value: text }];
}

export function hashtagSearchTerm(query: string): string {
  const trimmed = query.trim();
  if (trimmed.startsWith('#')) return trimmed.slice(1);
  return trimmed;
}