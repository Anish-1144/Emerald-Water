'use client';

import { useRouter } from 'next/navigation';
import { SignInPage } from '@/components/ui/sign-in-page';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const response = await authAPI.login({ email, password });
      setAuth(response.user, response.token);
      router.push('/design');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
      alert(err.message || 'Invalid email or password');
    }
  };

  const handleResetPassword = () => {
    // Reset password not implemented yet
    alert('Password reset coming soon!');
  };

  const handleCreateAccount = () => {
    router.push('/register');
  };

  return (
    <SignInPage
      title={<span className="font-light text-white tracking-tighter">Welcome</span>}
      description="Access your account and continue your journey with us"
      heroImageSrc="/login2.png"
      onSignIn={handleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
}

