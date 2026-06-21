'use client';

import { useEffect, useRef } from 'react';
import { getToken } from './auth';
import { isSupabaseConfigured, supabase } from './supabase';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface PostgresChangeConfig {
  table: string;
  event?: PostgresChangeEvent;
  filter?: string;
  schema?: string;
}

function syncRealtimeAuth(): void {
  const token = getToken();
  supabase.realtime.setAuth(token ?? '');
}

/** Mantém o JWT do OffMe sincronizado com o Realtime do Supabase. */
export function useSupabaseRealtimeAuth(): void {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    syncRealtimeAuth();

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'offme_token' || event.key === null) {
        syncRealtimeAuth();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
}

/** Inscreve em postgres_changes com auth e cleanup automáticos. */
export function usePostgresChanges(
  channelName: string,
  config: PostgresChangeConfig,
  onChange: () => void,
  enabled = true,
  debounceMs = 0
): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { table, event = 'INSERT', filter, schema = 'public' } = config;

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return;

    syncRealtimeAuth();

    const emitChange = () => {
      if (debounceMs <= 0) {
        onChangeRef.current();
        return;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onChangeRef.current();
      }, debounceMs);
    };

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema,
          table,
          ...(filter ? { filter } : {}),
        },
        emitChange
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [channelName, table, event, filter, schema, enabled, debounceMs]);
}