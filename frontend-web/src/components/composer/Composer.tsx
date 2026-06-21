'use client';

import { useRef, useState } from 'react';
import { Image, BarChart2, Smile, Calendar, MapPin, X } from 'lucide-react';
import { createPost, uploadImage } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { UserAvatar } from '@/components/user/UserAvatar';
import clsx from 'clsx';

const MAX_LENGTH = 280;
const MAX_IMAGES = 4;

interface PendingImage {
  id: string;
  url: string;
  preview: string;
}

interface ComposerProps {
  onPostCreated?: () => void;
  replyToId?: number;
  placeholder?: string;
}

export function Composer({
  onPostCreated,
  replyToId,
  placeholder = 'O que está acontecendo?',
}: ComposerProps) {
  const user = getStoredUser();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remaining = MAX_LENGTH - text.length;
  const expanded = focused || text.length > 0 || pendingImages.length > 0;
  const canPost =
    (text.trim().length > 0 || pendingImages.length > 0) &&
    remaining >= 0 &&
    !isSubmitting &&
    !uploading;

  const handleSubmit = async () => {
    if (!canPost) return;
    setIsSubmitting(true);
    setError('');
    try {
      await createPost(text.trim(), replyToId, pendingImages.map((img) => img.id));
      setText('');
      setFocused(false);
      setPendingImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.preview));
        return [];
      });
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      onPostCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar');
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    const slots = MAX_IMAGES - pendingImages.length;
    if (slots <= 0) {
      setError(`Máximo de ${MAX_IMAGES} imagens por post`);
      return;
    }

    setUploading(true);
    setError('');

    try {
      for (const file of files.slice(0, slots)) {
        const uploaded = await uploadImage(file);
        setPendingImages((prev) => [
          ...prev,
          {
            id: uploaded.id,
            url: uploaded.url,
            preview: URL.createObjectURL(file),
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (id: string) => {
    setPendingImages((prev) => {
      const item = prev.find((img) => img.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((img) => img.id !== id);
    });
  };

  return (
    <div className="border-b border-offme-border px-4 py-3">
      <div className="flex gap-3">
        <UserAvatar url={user?.avatarUrl} size="md" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          {error && (
            <div className="mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
              {error}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              if (!text.trim() && pendingImages.length === 0) setFocused(false);
            }}
            placeholder={placeholder}
            rows={expanded ? 3 : 1}
            maxLength={MAX_LENGTH + 50}
            className={clsx(
              'w-full resize-none bg-transparent outline-none placeholder:text-offme-muted',
              expanded ? 'text-xl leading-7' : 'text-xl leading-7'
            )}
          />

          {pendingImages.length > 0 && (
            <div
              className={clsx(
                'mt-3 grid gap-0.5 overflow-hidden rounded-2xl border border-offme-border',
                pendingImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
              )}
            >
              {pendingImages.map((img) => (
                <div key={img.id} className="relative">
                  <img src={img.preview} alt="" className="max-h-72 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-2 top-2 rounded-full bg-black/75 p-1.5 text-white transition-colors hover:bg-black/90"
                    aria-label="Remover imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {expanded && (
            <div className="mt-3 flex items-center justify-between border-t border-offme-border pt-3">
              <div className="flex text-offme-accent">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || pendingImages.length >= MAX_IMAGES}
                  className="post-action post-action-reply disabled:opacity-40"
                  aria-label="Adicionar imagem"
                >
                  <Image className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="post-action post-action-reply hidden sm:inline-flex"
                  aria-label="Enquete"
                >
                  <BarChart2 className="h-5 w-5" />
                </button>
                <button type="button" className="post-action post-action-reply" aria-label="Emoji">
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="post-action post-action-reply hidden md:inline-flex"
                  aria-label="Agendar"
                >
                  <Calendar className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="post-action post-action-reply hidden lg:inline-flex"
                  aria-label="Localização"
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {uploading && (
                  <span className="text-[13px] text-offme-muted">Enviando...</span>
                )}
                {text.length > 0 && (
                  <span
                    className={clsx(
                      'text-[13px]',
                      remaining < 0
                        ? 'text-red-500'
                        : remaining < 20
                          ? 'text-amber-500'
                          : 'text-offme-muted'
                    )}
                  >
                    {remaining}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canPost}
                  className="rounded-full bg-offme-accent px-4 py-1.5 text-[15px] font-bold text-white transition-colors hover:bg-offme-accentHover disabled:cursor-default disabled:opacity-50"
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}