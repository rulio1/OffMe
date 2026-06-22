# Novas features — OffMe

## Social (Jun 2026)

| Feature | Onde |
|---------|------|
| **@menções** clicáveis | Posts, notificação ao ser marcado |
| **#hashtags** clicáveis | Posts → Explorar com filtro |
| **Seguidores / Seguindo** | Perfil → links nas contagens |
| **Post fixado** | Menu do seu post → Fixar no perfil |
| **Novidades** | `/whats-new` + banner beta |

## Como usar

### Menções
Publique `Olá @username` — o usuário recebe notificação (se existir).

### Hashtags
Use `#offme` no texto; clique leva a busca por posts com a tag.

### Fixar post
No seu post: menu ⋯ → **Fixar no perfil**. Um post por vez.

### Listas sociais
Perfil → clique em **seguidores** ou **seguindo**.

## Migration

```bash
cd frontend-web && node scripts/migrate.js
```

Arquivo: `schemas/postgres/020_social_features.sql`