'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Mail, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";

interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className }: LoginFormProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password,
      });
      setAuth(response.user, response.token);
      router.push('/design');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex h-[700px] w-full", className)}>
      <div className="w-full hidden md:inline-block">
        <img 
          className="h-full w-full object-cover" 
          src="/login1.png" 
          alt="Bottle design showcase" 
        />
      </div>

      <div className="w-full flex flex-col items-center justify-center bg-transparent">
        <form onSubmit={handleSubmit} className="md:w-96 w-80 flex flex-col items-center justify-center px-4">
          <h2 className="text-4xl text-white font-medium">Sign in</h2>
          <p className="text-sm text-gray-300 mt-3">Welcome back! Please sign in to continue</p>

          {error && (
            <div className="w-full mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-8">
            <Mail className="w-4 h-4 text-gray-500" />
            <input 
              type="email" 
              placeholder="Email id" 
              className="bg-transparent text-white placeholder-gray-400 outline-none text-sm w-full h-full" 
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />                 
          </div>

          <div className="flex items-center mt-6 w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2">
            <Lock className="w-4 h-4 text-gray-500" />
            <input 
              type="password" 
              placeholder="Password" 
              className="bg-transparent text-white placeholder-gray-400 outline-none text-sm w-full h-full" 
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="w-full flex items-center justify-between mt-8 text-gray-300">
            <div className="flex items-center gap-2">
              <input 
                className="h-5 w-5" 
                type="checkbox" 
                id="rememberMe" 
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              />
              <label className="text-sm cursor-pointer" htmlFor="rememberMe">Remember me</label>
            </div>
            <a className="text-sm underline hover:text-indigo-500" href="#">Forgot password?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-8 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
          <p className="text-gray-300 text-sm mt-4">
            Don't have an account?{' '}
            <Link 
              href="/register"
              className="text-indigo-400 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

