import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';
import { MobileNav } from '@/components/layout/MobileNav';
import { ComposeProvider } from '@/components/providers/ComposeProvider';
import { SupabaseRealtimeProvider } from '@/components/providers/SupabaseRealtimeProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseRealtimeProvider>
      <ComposeProvider>
        <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] justify-center">
          <Sidebar />
          <main className="offme-main-column min-h-dvh w-full min-w-0 flex-1 md:max-w-[600px] md:border-x md:border-offme-border">
            {children}
          </main>
          <RightPanel />
          <MobileNav />
        </div>
      </ComposeProvider>
    </SupabaseRealtimeProvider>
  );
}