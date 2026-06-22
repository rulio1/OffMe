'use client';

import Link from 'next/link';
import {
  Bell,
  CalendarClock,
  MessageSquareHeart,
  Palette,
  Shield,
  UserCircle,
  Verified,
} from 'lucide-react';
import { InviteCard } from './InviteCard';
import { SettingsShell } from './SettingsShell';

const SECTIONS = [
  {
    href: '/settings/privacy',
    icon: Shield,
    title: 'Privacidade e segurança',
    description: 'Bloqueados, silenciados e controle de interações',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    title: 'Notificações',
    description: 'Push web e alertas do app',
  },
  {
    href: '/settings/scheduled',
    icon: CalendarClock,
    title: 'Posts agendados',
    description: 'Ver, editar e cancelar publicações futuras',
  },
  {
    href: '/settings/appearance',
    icon: Palette,
    title: 'Aparência',
    description: 'Tema claro, escuro ou automático',
  },
  {
    href: '/settings/account',
    icon: UserCircle,
    title: 'Conta',
    description: 'Sessão, dados e exclusão da conta',
  },
  {
    href: '/settings/verification',
    icon: Verified,
    title: 'Verificação',
    description: 'Solicitar selo de conta verificada',
  },
  {
    href: '/settings/feedback',
    icon: MessageSquareHeart,
    title: 'Feedback beta',
    description: 'Reportar bugs, enviar ideias e sugestões',
  },
];

export function SettingsHubView() {
  return (
    <SettingsShell title="Configurações" description="Gerencie sua experiência no OffMe">
      <div className="mb-6">
        <InviteCard />
      </div>
      <div className="divide-y divide-offme-border rounded-2xl border border-offme-border">
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="flex items-start gap-4 px-4 py-4 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-offme-hover"
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-offme-accent" />
            <div>
              <p className="font-bold text-offme-text">{title}</p>
              <p className="mt-0.5 text-[15px] text-offme-muted">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </SettingsShell>
  );
}