'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        router.push('/admin/dashboard');
      } else {
        router.push('/admin/login');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center " style={{ backgroundColor: 'var(--background)' }}>
      <div className="text-lg" style={{ color: 'var(--text-primary)' }}>Redirecting...</div>
    </div>
  );
}

