'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function ProfileRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (user?.username) {
      router.replace(`/profile/${user.username}`);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="px-4 py-12 text-center text-offme-muted">Redirecionando...</div>
  );
}