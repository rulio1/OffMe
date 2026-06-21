'use client';

import { Plus } from 'lucide-react';

interface ComposeFabProps {
  onClick: () => void;
}

export function ComposeFab({ onClick }: ComposeFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="compose-fab fixed z-40 flex h-14 w-14 items-center justify-center rounded-full bg-offme-accent text-white shadow-lg transition-transform hover:bg-offme-accentHover active:scale-95 md:hidden"
      aria-label="Novo post"
    >
      <Plus className="h-7 w-7 stroke-[2.5]" />
    </button>
  );
}