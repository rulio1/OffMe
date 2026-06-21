import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/SignupForm';

export default function SignupPage() {
  return (
    <AuthShell mode="signup" title="Criar sua conta">
      <SignupForm />
    </AuthShell>
  );
}