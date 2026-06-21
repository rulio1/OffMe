-- OffMe — Supabase Realtime (publication + RLS)
-- Aplica apenas em Postgres hospedado no Supabase (publication supabase_realtime).
-- Em Neon/local, o bloco de publication é ignorado; RLS não afeta a API (conexão owner).

-- Replica identity necessária para filtros (ex: conversation_id=eq.N)
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE direct_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- RLS para postgres_changes (Realtime respeita estas políticas)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS realtime_notifications_select ON notifications;
CREATE POLICY realtime_notifications_select ON notifications
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::bigint);

DROP POLICY IF EXISTS realtime_dm_select ON direct_messages;
CREATE POLICY realtime_dm_select ON direct_messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT cm.conversation_id
      FROM conversation_members cm
      WHERE cm.user_id = (auth.jwt() ->> 'sub')::bigint
    )
  );