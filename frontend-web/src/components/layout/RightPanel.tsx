'use client';

import { Search } from 'lucide-react';

const TRENDING = [
  { category: 'Technology · Trending', topic: '#OffMe', posts: '12.4K' },
  { category: 'Sports · Trending', topic: 'World Cup', posts: '89.2K' },
  { category: 'Trending', topic: 'Scala', posts: '5.1K' },
  { category: 'Technology · Trending', topic: 'Finagle', posts: '2.8K' },
  { category: 'Trending in Japan', topic: '東京', posts: '18.7K' },
];

const SUGGESTIONS = [
  { name: 'Jane Architect', handle: '@jane_arch', verified: true },
  { name: 'Rust Dev', handle: '@rustacean', verified: false },
  { name: 'ML Engineer', handle: '@ml_pipelines', verified: true },
];

export function RightPanel() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[350px] flex-col gap-4 overflow-y-auto px-6 py-2 lg:flex">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-pulse-muted" />
        <input
          type="search"
          placeholder="Buscar no OffMe"
          className="w-full rounded-full bg-pulse-surface py-3 pl-12 pr-4 text-pulse-text outline-none ring-1 ring-transparent focus:ring-pulse-accent"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-pulse-surface">
        <h2 className="px-4 py-3 text-xl font-extrabold">Trending</h2>
        {TRENDING.map((item) => (
          <button
            key={item.topic}
            className="w-full px-4 py-3 text-left transition-colors hover:bg-white/5"
          >
            <p className="text-xs text-pulse-muted">{item.category}</p>
            <p className="font-bold">{item.topic}</p>
            <p className="text-xs text-pulse-muted">{item.posts} posts</p>
          </button>
        ))}
        <button className="w-full px-4 py-3 text-left text-pulse-accent hover:bg-white/5">
          Show more
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-pulse-surface">
        <h2 className="px-4 py-3 text-xl font-extrabold">Who to follow</h2>
        {SUGGESTIONS.map((user) => (
          <div key={user.handle} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5">
            <div className="h-10 w-10 shrink-0 rounded-full bg-pulse-border" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {user.name}
                {user.verified && (
                  <span className="ml-1 text-pulse-accent" aria-label="Verified">
                    ✓
                  </span>
                )}
              </p>
              <p className="truncate text-sm text-pulse-muted">{user.handle}</p>
            </div>
            <button className="shrink-0 rounded-full bg-pulse-text px-4 py-1.5 text-sm font-bold text-pulse-bg hover:bg-pulse-muted">
              Follow
            </button>
          </div>
        ))}
      </div>

      <footer className="px-4 text-xs text-pulse-muted">
        <p>© 2026 OffMe · Privacidade · Termos · Sobre</p>
      </footer>
    </aside>
  );
}