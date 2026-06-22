'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { CalendarClock, Trash2 } from 'lucide-react';
import {
  deletePost,
  fetchScheduledPosts,
  updateScheduledPost,
} from '@/lib/api';
import { formatPostTime } from '@/lib/format-time';
import type { Post } from '@/types';
import { SettingsShell } from './SettingsShell';

function ScheduledPostRow({
  post,
  onUpdated,
  onDeleted,
}: {
  post: Post;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(post.text);
  const [date, setDate] = useState(
    post.scheduledAt ? toLocalInputDate(post.scheduledAt) : ''
  );
  const [time, setTime] = useState(
    post.scheduledAt ? toLocalInputTime(post.scheduledAt) : ''
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!date || !time) return;
    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      setError('Escolha uma data e hora no futuro.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await updateScheduledPost(post.id, {
        text: text.trim(),
        scheduledAt: scheduledAt.toISOString(),
      });
      setEditing(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Cancelar este post agendado?')) return;
    setBusy(true);
    setError('');
    try {
      await deletePost(post.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar');
      setBusy(false);
    }
  };

  return (
    <li className="border-b border-offme-border px-4 py-4 last:border-b-0">
      {editing ? (
        <div className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            rows={3}
            className="w-full resize-none rounded-xl border border-offme-border bg-transparent p-3 outline-none focus:border-offme-accent"
          />
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-full border border-offme-border bg-transparent px-3 py-2 text-sm"
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-full border border-offme-border bg-transparent px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={busy}
              className="offme-btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-offme-border px-4 py-2 text-sm font-bold hover:bg-offme-hover"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="whitespace-pre-wrap text-[15px]">{post.text}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-offme-muted">
            <CalendarClock className="h-4 w-4" />
            {post.scheduledAt ? formatPostTime(post.scheduledAt) : 'Sem data'}
          </p>
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="rounded-full border border-offme-border px-4 py-1.5 text-[13px] font-bold hover:bg-offme-hover disabled:opacity-50"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-full border border-red-500/40 px-4 py-1.5 text-[13px] font-bold text-red-500 hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Cancelar
            </button>
          </div>
        </>
      )}
    </li>
  );
}

function toLocalInputDate(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toLocalInputTime(ms: number): string {
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function ScheduledPostsView() {
  const { data, mutate, isLoading } = useSWR('scheduled-posts', fetchScheduledPosts);
  const posts = data?.posts ?? [];

  return (
    <SettingsShell title="Posts agendados" description="Gerencie publicações futuras">
      {isLoading ? (
        <p className="py-12 text-center text-offme-muted">Carregando...</p>
      ) : posts.length === 0 ? (
        <div className="py-16 text-center">
          <CalendarClock className="mx-auto h-10 w-10 text-offme-muted" />
          <p className="mt-4 font-medium">Nenhum post agendado</p>
          <p className="mt-1 text-[15px] text-offme-muted">
            Ao criar um post, use o ícone de calendário no composer.
          </p>
        </div>
      ) : (
        <ul className="rounded-2xl border border-offme-border">
          {posts.map((post) => (
            <ScheduledPostRow
              key={post.id}
              post={post}
              onUpdated={() => void mutate()}
              onDeleted={() => void mutate()}
            />
          ))}
        </ul>
      )}
    </SettingsShell>
  );
}