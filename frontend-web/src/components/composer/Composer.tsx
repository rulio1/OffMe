'use client';

import { useEffect, useRef, useState } from 'react';
import { Image, BarChart2, Smile, Calendar, MapPin, X } from 'lucide-react';
import { createPost, uploadImage } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { UserAvatar } from '@/components/user/UserAvatar';
import type { Post } from '@/types';
import clsx from 'clsx';

const MAX_LENGTH = 280;
const MAX_IMAGES = 4;
const MIN_POLL_OPTIONS = 2;
const MAX_POLL_OPTIONS = 4;

const EMOJI_GRID = [
  '😀', '😂', '🥰', '😍', '🤔', '😮', '😢', '😡',
  '👍', '👏', '🙌', '🔥', '❤️', '💯', '✨', '🎉',
  '🚀', '💡', '📍', '☕', '🌟', '😎', '🤝', '👀',
];

interface PendingImage {
  id: string;
  url: string;
  preview: string;
}

interface ComposerProps {
  onPostCreated?: () => void;
  replyToId?: number;
  quoteOfId?: number;
  quotedPost?: Post;
  placeholder?: string;
  communityId?: number;
}

export function Composer({
  onPostCreated,
  replyToId,
  quoteOfId,
  quotedPost,
  placeholder = 'O que está acontecendo?',
  communityId,
}: ComposerProps) {
  const user = getStoredUser();
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleToast, setScheduleToast] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setEmojiOpen(false);
      }
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    if (emojiOpen || locationOpen) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [emojiOpen, locationOpen]);

  useEffect(() => {
    if (!scheduleToast) return;
    const timer = window.setTimeout(() => setScheduleToast(''), 2500);
    return () => window.clearTimeout(timer);
  }, [scheduleToast]);

  const remaining = MAX_LENGTH - text.length;
  const expanded =
    focused || text.length > 0 || pendingImages.length > 0 || pollMode || Boolean(quotedPost);
  const validPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
  const hasValidPoll = pollMode && validPollOptions.length >= MIN_POLL_OPTIONS;
  const canPost =
    (text.trim().length > 0 || pendingImages.length > 0 || hasValidPoll || Boolean(quoteOfId)) &&
    remaining >= 0 &&
    !isSubmitting &&
    !uploading;

  const handleSubmit = async (scheduledAt?: string) => {
    if (!canPost) return;
    setIsSubmitting(true);
    setError('');
    try {
      await createPost(
        text.trim(),
        replyToId,
        pollMode ? undefined : pendingImages.map((img) => img.id),
        {
          quoteOfId,
          pollOptions: hasValidPoll ? validPollOptions : undefined,
          scheduledAt,
          communityId,
        }
      );
      setText('');
      setFocused(false);
      setPollMode(false);
      setPollOptions(['', '']);
      setScheduleOpen(false);
      setScheduleDate('');
      setScheduleTime('');
      setPendingImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.preview));
        return [];
      });
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      if (scheduledAt) {
        setScheduleToast('Post agendado com sucesso');
      }
      onPostCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao publicar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleConfirm = () => {
    if (!scheduleDate || !scheduleTime) return;
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setError('Escolha uma data e hora no futuro');
      return;
    }
    void handleSubmit(scheduledAt.toISOString());
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

  const togglePollMode = () => {
    if (pollMode) {
      setPollMode(false);
      setPollOptions(['', '']);
    } else {
      setPollMode(true);
      setPendingImages((prev) => {
        prev.forEach((img) => URL.revokeObjectURL(img.preview));
        return [];
      });
    }
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const addPollOption = () => {
    if (pollOptions.length < MAX_POLL_OPTIONS) {
      setPollOptions((prev) => [...prev, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > MIN_POLL_OPTIONS) {
      setPollOptions((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const insertAtCursor = (value: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + value);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const next = text.slice(0, start) + value + text.slice(end);
    setText(next);

    requestAnimationFrame(() => {
      textarea.focus();
      const pos = start + value.length;
      textarea.setSelectionRange(pos, pos);
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    insertAtCursor(emoji);
    setEmojiOpen(false);
  };

  const handleLocationConfirm = () => {
    const trimmed = locationText.trim();
    if (!trimmed) return;
    const suffix = text.length > 0 && !text.endsWith(' ') ? ' ' : '';
    insertAtCursor(`${suffix}📍 ${trimmed}`);
    setLocationText('');
    setLocationOpen(false);
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

          {quotedPost && (
            <div className="mb-3 rounded-xl border border-offme-border p-3 text-sm">
              <p className="font-bold">
                {quotedPost.author?.displayName ?? 'Usuário'}
                <span className="ml-1 font-normal text-offme-muted">
                  @{quotedPost.author?.username ?? 'user'}
                </span>
              </p>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-offme-muted">
                {quotedPost.text}
              </p>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              if (!text.trim() && pendingImages.length === 0 && !pollMode && !quotedPost) {
                setFocused(false);
              }
            }}
            placeholder={quoteOfId ? 'Adicione um comentário' : placeholder}
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

          {pollMode && (
            <div className="mt-3 space-y-2 rounded-xl border border-offme-border p-3">
              {pollOptions.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={option}
                    onChange={(e) => updatePollOption(index, e.target.value)}
                    maxLength={25}
                    placeholder={`Opção ${index + 1}`}
                    className="flex-1 rounded-lg border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
                  />
                  {pollOptions.length > MIN_POLL_OPTIONS && (
                    <button
                      type="button"
                      onClick={() => removePollOption(index)}
                      className="rounded-full p-1 text-offme-muted hover:bg-offme-hover"
                      aria-label="Remover opção"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {pollOptions.length < MAX_POLL_OPTIONS && (
                <button
                  type="button"
                  onClick={addPollOption}
                  className="text-sm font-semibold text-offme-accent hover:underline"
                >
                  Adicionar opção
                </button>
              )}
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
                  disabled={uploading || pendingImages.length >= MAX_IMAGES || pollMode}
                  className="post-action post-action-reply disabled:opacity-40"
                  aria-label="Adicionar imagem"
                >
                  <Image className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={togglePollMode}
                  disabled={Boolean(quoteOfId)}
                  className={clsx(
                    'post-action post-action-reply hidden sm:inline-flex',
                    pollMode && 'text-offme-accent'
                  )}
                  aria-label="Enquete"
                >
                  <BarChart2 className="h-5 w-5" />
                </button>
                <div ref={emojiRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setEmojiOpen((v) => !v);
                      setLocationOpen(false);
                    }}
                    className={clsx('post-action post-action-reply', emojiOpen && 'text-offme-accent')}
                    aria-label="Emoji"
                    aria-expanded={emojiOpen}
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                  {emojiOpen && (
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-56 rounded-xl border border-offme-border bg-offme-bg p-2 shadow-lg">
                      <div className="grid grid-cols-8 gap-0.5">
                        {EMOJI_GRID.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleEmojiSelect(emoji)}
                            className="rounded p-1 text-lg hover:bg-offme-hover"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setScheduleOpen(true)}
                  disabled={Boolean(replyToId) || Boolean(quoteOfId)}
                  className="post-action post-action-reply"
                  aria-label="Agendar"
                  title="Agendar publicação"
                >
                  <Calendar className="h-5 w-5" />
                </button>
                <div ref={locationRef} className="relative hidden lg:block">
                  <button
                    type="button"
                    onClick={() => {
                      setLocationOpen((v) => !v);
                      setEmojiOpen(false);
                    }}
                    className={clsx('post-action post-action-reply', locationOpen && 'text-offme-accent')}
                    aria-label="Localização"
                    aria-expanded={locationOpen}
                  >
                    <MapPin className="h-5 w-5" />
                  </button>
                  {locationOpen && (
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-64 rounded-xl border border-offme-border bg-offme-bg p-3 shadow-lg">
                      <label className="text-xs font-semibold text-offme-muted">Localização</label>
                      <input
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLocationConfirm();
                          }
                        }}
                        placeholder="Cidade, lugar..."
                        maxLength={80}
                        className="mt-1 w-full rounded-lg border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleLocationConfirm}
                        disabled={!locationText.trim()}
                        className="mt-2 w-full rounded-full bg-offme-accent py-1.5 text-sm font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
                      >
                        Adicionar
                      </button>
                    </div>
                  )}
                </div>
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
                  onClick={() => handleSubmit()}
                  disabled={!canPost}
                  data-testid="composer-submit"
                  className="rounded-full bg-offme-accent px-4 py-1.5 text-[15px] font-bold text-white transition-colors hover:bg-offme-accentHover disabled:cursor-default disabled:opacity-50"
                >
                  {isSubmitting ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-offme-border bg-offme-bg p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Agendar publicação</h3>
              <button
                type="button"
                onClick={() => setScheduleOpen(false)}
                className="rounded-full p-1 hover:bg-offme-hover"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="schedule-date" className="text-sm font-semibold text-offme-muted">
                  Data
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="mt-1 w-full rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
                />
              </div>
              <div>
                <label htmlFor="schedule-time" className="text-sm font-semibold text-offme-muted">
                  Horário
                </label>
                <input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-offme-border bg-offme-surface px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-offme-accent"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setScheduleOpen(false)}
                className="flex-1 rounded-full border border-offme-border py-2 text-sm font-semibold hover:bg-offme-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleScheduleConfirm}
                disabled={!scheduleDate || !scheduleTime || isSubmitting}
                className="flex-1 rounded-full bg-offme-accent py-2 text-sm font-bold text-white hover:bg-offme-accentHover disabled:opacity-50"
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}

      {scheduleToast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-offme-text px-4 py-2 text-sm font-medium text-offme-bg shadow-lg">
          {scheduleToast}
        </div>
      )}
    </div>
  );
}