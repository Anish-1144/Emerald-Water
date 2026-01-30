'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/design');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          Custom Bottle Design
          </h1>
        <p className="text-xl text-gray-300 mb-8">
          Create your perfect custom bottle label with our easy-to-use design engine
        </p>
        <button
          onClick={() => router.push('/login')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
        >
          Start Designing
        </button>
        </div>
    </div>
  );
}
