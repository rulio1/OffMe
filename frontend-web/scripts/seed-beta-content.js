#!/usr/bin/env node
/**
 * Seed demo accounts and posts for beta (idempotent).
 * Usage: cd frontend-web && node scripts/seed-beta-content.js
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

function loadEnvLocal() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const DEMO_USERS = [
  {
    username: 'offme_news',
    email: 'offme_news@seed.offme',
    displayName: 'OffMe News',
    bio: 'Novidades e atualizações do beta OffMe.',
  },
  {
    username: 'offme_tips',
    email: 'offme_tips@seed.offme',
    displayName: 'OffMe Tips',
    bio: 'Dicas para aproveitar feed, listas e comunidades.',
  },
  {
    username: 'offme_beta',
    email: 'offme_beta@seed.offme',
    displayName: 'Beta Team',
    bio: 'Time do beta — manda feedback em Configurações!',
  },
];

const DEMO_POSTS = {
  offme_news: [
    'Bem-vindo ao beta aberto do OffMe! 🎉 Crie sua conta e explore o feed Para você e Seguindo.',
    'Novo: feedback beta em Configurações → envie bugs e ideias direto para o time.',
  ],
  offme_tips: [
    'Dica: siga 3+ pessoas para encher seu feed. Use Explorar ou as sugestões no painel direito.',
    'Dica: posts agendados ficam em Configurações → Agendados. Planeje a semana com antecedência.',
  ],
  offme_beta: [
    'Estamos coletando feedback na aba Beta da moderação. Obrigado por testar o OffMe!',
    'Convide amigos com seu link em Configurações → Convidar amigos. Crescimento orgânico ajuda o beta.',
  ],
};

const SEED_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'OffMeBeta2026!';

async function ensureUser(client, user) {
  const existing = await client.query(
    `SELECT id FROM users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)`,
    [user.username, user.email]
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  const inserted = await client.query(
    `INSERT INTO users (username, email, password_hash, display_name, bio)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [user.username, user.email, hash, user.displayName, user.bio]
  );
  return inserted.rows[0].id;
}

async function ensurePost(client, authorId, text) {
  const dup = await client.query(
    `SELECT id FROM posts WHERE author_id = $1 AND text = $2 LIMIT 1`,
    [authorId, text]
  );
  if (dup.rows[0]) return;

  await client.query(
    `INSERT INTO posts (author_id, text, published_at, status)
     VALUES ($1, $2, NOW(), 'published')`,
    [authorId, text]
  );
  await client.query(
    `UPDATE users SET post_count = post_count + 1, updated_at = NOW() WHERE id = $1`,
    [authorId]
  );
}

async function ensureFollow(client, followerId, followingId) {
  if (followerId === followingId) return;
  const inserted = await client.query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING
     RETURNING follower_id`,
    [followerId, followingId]
  );
  if (inserted.rowCount > 0) {
    await client.query(
      `UPDATE users SET following_count = following_count + 1, updated_at = NOW() WHERE id = $1`,
      [followerId]
    );
    await client.query(
      `UPDATE users SET follower_count = follower_count + 1, updated_at = NOW() WHERE id = $1`,
      [followingId]
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL) loadEnvLocal();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL não definida.');
    process.exit(1);
  }

  const needsSsl =
    process.env.DATABASE_SSL === 'true' ||
    /sslmode=(require|verify-full|prefer)/i.test(databaseUrl);
  const connectionString = databaseUrl.replace(/[?&]sslmode=[^&]+/i, '');

  const pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  });

  const client = await pool.connect();
  try {
    const ids = {};
    for (const user of DEMO_USERS) {
      ids[user.username] = await ensureUser(client, user);
      console.log('✓ usuário', user.username);
    }

    for (const [username, posts] of Object.entries(DEMO_POSTS)) {
      const authorId = ids[username];
      for (const text of posts) {
        await ensurePost(client, authorId, text);
      }
      console.log('✓ posts', username, `(${posts.length})`);
    }

    const allIds = Object.values(ids);
    for (let i = 0; i < allIds.length; i += 1) {
      for (let j = 0; j < allIds.length; j += 1) {
        if (i !== j) await ensureFollow(client, allIds[i], allIds[j]);
      }
    }
    console.log('✓ follows entre contas demo');

    console.log('');
    console.log('✅ Seed beta concluído.');
    console.log('   Login demo:', DEMO_USERS.map((u) => u.username).join(', '));
    console.log('   Senha:', SEED_PASSWORD);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});