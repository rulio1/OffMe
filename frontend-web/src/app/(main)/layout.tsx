import { Sidebar } from '@/components/layout/Sidebar';
import { RightPanel } from '@/components/layout/RightPanel';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1280px] justify-center">
      <Sidebar />
      <main className="w-full max-w-[600px] border-x border-pulse-border">{children}</main>
      <RightPanel />
    </div>
  );
}