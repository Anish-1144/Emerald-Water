'use client';

import { useRouter } from 'next/navigation';
import { SignUpPage } from '@/components/ui/sign-up-page';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const phone = formData.get('phone') as string;
    const company_name = formData.get('company_name') as string;

    try {
      const response = await authAPI.register({
        name,
        email,
        password,
        phone: phone || undefined,
        company_name: company_name || undefined,
      });
      setAuth(response.user, response.token);
      router.push('/design');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      alert(err.message || 'Registration failed. Please try again.');
    }
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  return (
    <SignUpPage
      title={<span className="font-light text-white tracking-tighter">Create Account</span>}
      description="Join us and start designing your custom bottles"
      heroImageSrc="/login.png"
      onSignUp={handleSignUp}
      onSignIn={handleSignIn}
    />
  );
}

