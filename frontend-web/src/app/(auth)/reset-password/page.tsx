import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  return (
    <AuthShell mode="login" title="Nova senha">
      <ResetPasswordForm token={searchParams.token ?? ''} />
    </AuthShell>
  );
}