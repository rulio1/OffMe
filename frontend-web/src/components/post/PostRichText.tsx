import Link from 'next/link';
import { parsePostText } from '@/lib/post-text';

export function PostRichText({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const parts = parsePostText(text);

  return (
    <span className={`whitespace-pre-wrap break-words ${className}`}>
      {parts.map((part, i) => {
        if (part.type === 'mention') {
          return (
            <Link
              key={`${i}-${part.username}`}
              href={`/profile/${part.username}`}
              className="text-offme-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part.value}
            </Link>
          );
        }
        if (part.type === 'hashtag') {
          return (
            <Link
              key={`${i}-${part.tag}`}
              href={`/explore?q=${encodeURIComponent(`#${part.tag}`)}`}
              className="text-offme-accent hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part.value}
            </Link>
          );
        }
        return <span key={i}>{part.value}</span>;
      })}
    </span>
  );
}