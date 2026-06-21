'use client';

import { useSupabaseRealtimeAuth } from '@/lib/use-supabase-realtime';

export function SupabaseRealtimeProvider({ children }: { children: React.ReactNode }) {
  useSupabaseRealtimeAuth();
  return <>{children}</>;
}