'use client';

import { useState, useRef } from 'react';
import { Image, BarChart2, Smile, Calendar, MapPin } from 'lucide-react';
import { createPost } from '@/lib/api';

const MAX_LENGTH = 280;

interface ComposerProps {
  onPostCreated?: () => void;
  replyToId?: number;
  placeholder?: string;
}

export function Composer({ onPostCreated, replyToId, placeholder = "What is happening?!" }: ComposerProps) {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_LENGTH - text.length;
  const canPost = text.trim().length > 0 && remaining >= 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canPost) return;
    setIsSubmitting(true);
    try {
      await createPost(text.trim(), replyToId);
      setText('');
      onPostCreated?.();
    } catch (err) {
      console.error('Failed to post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex gap-3 border-b border-pulse-border px-4 py-3">
      <div className="h-10 w-10 shrink-0 rounded-full bg-pulse-surface" />

      <div className="min-w-0 flex-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          placeholder={placeholder}
          rows={2}
          maxLength={MAX_LENGTH + 50}
          className="w-full resize-none bg-transparent text-xl outline-none placeholder:text-pulse-muted"
        />

        <div className="mt-3 flex items-center justify-between border-t border-pulse-border pt-3">
          <div className="flex gap-1 text-pulse-accent">
            <button className="pulse-btn-ghost" aria-label="Add image">
              <Image className="h-5 w-5" />
            </button>
            <button className="pulse-btn-ghost" aria-label="Add poll">
              <BarChart2 className="h-5 w-5" />
            </button>
            <button className="pulse-btn-ghost" aria-label="Add emoji">
              <Smile className="h-5 w-5" />
            </button>
            <button className="pulse-btn-ghost" aria-label="Schedule">
              <Calendar className="h-5 w-5" />
            </button>
            <button className="pulse-btn-ghost" aria-label="Add location">
              <MapPin className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {text.length > 0 && (
              <span
                className={`text-sm ${
                  remaining < 20 ? (remaining < 0 ? 'text-red-500' : 'text-yellow-500') : 'text-pulse-muted'
                }`}
              >
                {remaining}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={!canPost}
              className="pulse-btn-primary px-4 py-1.5 text-sm"
            >
              {isSubmitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}