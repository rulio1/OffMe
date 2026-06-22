#!/usr/bin/env node
/**
 * OffMe migrate script (no Docker / psql required)
 * Usage:
 *   cd frontend-web
 *   DATABASE_URL="postgresql://...sslmode=require" node scripts/migrate.js
 *
 * It will also try to load DATABASE_URL from .env.local if not set in env.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    // remove surrounding quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    loadEnvLocal();
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL não definida.');
    console.error('Exemplo:');
    console.error('  DATABASE_URL="postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require" node scripts/migrate.js');
    process.exit(1);
  }

  console.log('==> Conectando ao banco:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const needsSsl =
    process.env.DATABASE_SSL === 'true' ||
    /sslmode=(require|verify-full|prefer)/i.test(databaseUrl);

  // Evita verify-full do connection string (Supabase/Neon em dev)
  const connectionString = databaseUrl.replace(/[?&]sslmode=[^&]+/i, '');

  const pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  const migrations = [
    'offme_init.sql',
    '002_posts.sql',
    '003_likes.sql',
    '004_notifications.sql',
    '005_media.sql',
    '006_bookmarks_reposts.sql',
    '007_messages.sql',
    '008_supabase_realtime.sql',
    '009_perf_indexes.sql',
    '010_moderation_polls_quotes.sql',
    '011_verification_admin.sql',
    '012_push_tokens.sql',
    '013_scheduled_posts.sql',
    '014_lists_communities.sql',
    '015_user_moderation.sql',
    '016_growth_auth_prefs.sql',
    '017_beta_feedback.sql',
    '018_feedback_status.sql',
    '019_email_digest.sql',
    '020_social_features.sql',
  ];

  const root = path.join(__dirname, '..', '..');
  const schemasDir = path.join(root, 'schemas', 'postgres');

  const client = await pool.connect();
  try {
    for (const file of migrations) {
      const fullPath = path.join(schemasDir, file);
      if (!fs.existsSync(fullPath)) {
        console.warn('  ! Arquivo não encontrado, pulando:', file);
        continue;
      }
      console.log('==> Aplicando', file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      await client.query(sql);
    }
    console.log('');
    console.log('✅ Migrations aplicadas com sucesso!');

    // Quick check
    const res = await client.query("SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'posts', 'media_assets')");
    console.log('   Tabelas principais:', res.rows[0]);
  } catch (err) {
    console.error('Erro ao aplicar migrations:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
