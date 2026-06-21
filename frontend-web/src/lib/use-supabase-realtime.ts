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
  enabled = true
): void {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const { table, event = 'INSERT', filter, schema = 'public' } = config;

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured()) return;

    syncRealtimeAuth();

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
        () => {
          onChangeRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, table, event, filter, schema, enabled]);
}