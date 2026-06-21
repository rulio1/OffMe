import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthShell mode="login" title="Entrar no OffMe">
      <LoginForm />
    </AuthShell>
  );
}