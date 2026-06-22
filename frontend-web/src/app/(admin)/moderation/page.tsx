import { redirect } from 'next/navigation';
import { ModerationView } from '@/components/admin/ModerationView';
import { isAdminUser } from '@/lib/admin-auth';
import { getServerUser } from '@/lib/server-auth';

export default async function ModerationPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');
  if (!isAdminUser(user)) redirect('/');

  return <ModerationView />;
}