'use client';

import React from 'react';
import { UserAvatar } from '@/components/user/UserAvatar';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { applyTheme } from '@/styles/design-system';

export function VisualTest() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const [isOnline, setIsOnline] = React.useState(false);

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-offme-bg p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-offme-text">OffMe Design System Test</h1>
          <Button onClick={toggleTheme} variant="outline">
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </Button>
        </div>

        <div className="space-y-8">
          {/* Avatars Section */}
          <Card padding="md" hoverable>
            <h2 className="text-xl font-semibold mb-4">Avatars</h2>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="rounded border-offme-border focus:ring-offme-accent"
                />
                <span>Show Online Status</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              {(['xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const).map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <span className="text-sm text-offme-muted capitalize">{size}</span>
                  <UserAvatar
                    url="https://offme.vercel.app/brand/logo-512.png"
                    size={size}
                    isOnline={isOnline}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Buttons Section */}
          <Card padding="md" hoverable>
            <h2 className="text-xl font-semibold mb-4">Buttons</h2>
            <div className="space-y-6">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <div key={size} className="space-y-2">
                  <h3 className="text-sm font-medium text-offme-muted capitalize">{size}</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button size={size} variant="filled">
                      Filled
                    </Button>
                    <Button size={size} variant="outline">
                      Outline
                    </Button>
                    <Button size={size} variant="ghost">
                      Ghost
                    </Button>
                    <Button size={size} variant="destructive">
                      Destructive
                    </Button>
                    <Button size={size} variant="filled" isLoading>
                      Loading
                    </Button>
                    <Button size={size} variant="filled" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Icon Buttons Section */}
          <Card padding="md" hoverable>
            <h2 className="text-xl font-semibold mb-4">Icon Buttons</h2>
            <div className="flex flex-wrap gap-3">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <React.Fragment key={size}>
                  <IconButton size={size} variant="filled" aria-label="Filled icon">
                    🔥
                  </IconButton>
                  <IconButton size={size} variant="outline" aria-label="Outline icon">
                    🔥
                  </IconButton>
                  <IconButton size={size} variant="ghost" aria-label="Ghost icon">
                    🔥
                  </IconButton>
                </React.Fragment>
              ))}
            </div>
          </Card>

          {/* Badges Section */}
          <Card padding="md" hoverable>
            <h2 className="text-xl font-semibold mb-4">Badges</h2>
            <div className="space-y-4">
              {(['sm', 'md'] as const).map((size) => (
                <div key={size} className="space-y-2">
                  <h3 className="text-sm font-medium text-offme-muted capitalize">{size}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge size={size} variant="primary">
                      Primary
                    </Badge>
                    <Badge size={size} variant="secondary">
                      Secondary
                    </Badge>
                    <Badge size={size} variant="success">
                      Success
                    </Badge>
                    <Badge size={size} variant="warning">
                      Warning
                    </Badge>
                    <Badge size={size} variant="danger">
                      Danger
                    </Badge>
                    <Badge size={size} variant="info">
                      Info
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cards Section */}
          <Card padding="md" hoverable>
            <h2 className="text-xl font-semibold mb-4">Cards</h2>
            <div className="space-y-4">
              <Card padding="sm">
                <h3 className="font-medium">Small Padding</h3>
                <p className="text-sm text-offme-muted">Content with small padding</p>
              </Card>
              <Card padding="md">
                <h3 className="font-medium">Medium Padding</h3>
                <p className="text-sm text-offme-muted">Content with medium padding</p>
              </Card>
              <Card padding="lg">
                <h3 className="font-medium">Large Padding</h3>
                <p className="text-sm text-offme-muted">Content with large padding</p>
              </Card>
              <Card hoverable interactive>
                <h3 className="font-medium">Hoverable & Interactive</h3>
                <p className="text-sm text-offme-muted">Try hovering over this card</p>
              </Card>
            </div>
          </Card>

          {/* Colors Section */}
          <Card padding="md" hoverable>
            <h2 className="text-xl font-semibold mb-4">Theme Colors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Background</h3>
                <div className="h-16 w-full rounded-lg bg-offme-bg border border-offme-border" />
                <span className="text-xs text-offme-muted">bg</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Surface</h3>
                <div className="h-16 w-full rounded-lg bg-offme-surface border border-offme-border" />
                <span className="text-xs text-offme-muted">surface</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Border</h3>
                <div className="h-16 w-full rounded-lg border-2 border-offme-border" />
                <span className="text-xs text-offme-muted">border</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Text</h3>
                <div className="h-16 w-full rounded-lg bg-offme-text" />
                <span className="text-xs text-offme-muted">text</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Muted</h3>
                <div className="h-16 w-full rounded-lg bg-offme-muted" />
                <span className="text-xs text-offme-muted">muted</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Hover</h3>
                <div className="h-16 w-full rounded-lg bg-offme-hover" />
                <span className="text-xs text-offme-muted">hover</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Accent</h3>
                <div className="h-16 w-full rounded-lg bg-offme-accent" />
                <span className="text-xs text-offme-muted">accent</span>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Accent Hover</h3>
                <div className="h-16 w-full rounded-lg bg-offme-accentHover" />
                <span className="text-xs text-offme-muted">accentHover</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}