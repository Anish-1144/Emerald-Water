'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Mail, Lock, User, Phone, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/store";
import { authAPI } from "@/lib/api";

interface RegisterFormProps {
  className?: string;
}

export default function RegisterForm({ className }: RegisterFormProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company_name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        company_name: formData.company_name,
      });
      setAuth(response.user, response.token);
      router.push('/design');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex h-[800px] w-full", className)}>
      <div className="w-full hidden md:inline-block">
        <img 
          className="h-full w-full object-cover" 
          src="/login.png" 
          alt="Bottle design showcase" 
        />
      </div>

      <div className="w-full flex flex-col items-center justify-center bg-transparent overflow-y-auto">
        <form onSubmit={handleSubmit} className="md:w-96 w-80 flex flex-col items-center justify-center px-4 py-8">
          <h2 className="text-4xl text-white font-medium">Sign up</h2>
          <p className="text-sm text-gray-300 mt-3">Create your account to start designing</p>

          {error && (
            <div className="w-full mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-8">
            <User className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Full Name" 
              className="bg-transparent text-white placeholder-gray-400 outline-none text-sm w-full h-full" 
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />                 
          </div>

          <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-6">
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

          <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-6">
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

          <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-6">
            <Phone className="w-4 h-4 text-gray-500" />
            <input 
              type="tel" 
              placeholder="Phone (Optional)" 
              className="bg-transparent text-white placeholder-gray-400 outline-none text-sm w-full h-full" 
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center w-full bg-transparent border border-gray-300/60 h-12 rounded-full overflow-hidden pl-6 gap-2 mt-6">
            <Building2 className="w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Company Name (Optional)" 
              className="bg-transparent text-white placeholder-gray-400 outline-none text-sm w-full h-full" 
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-8 w-full h-11 rounded-full text-white bg-indigo-500 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
          <p className="text-gray-300 text-sm mt-4">
            Already have an account?{' '}
            <Link 
              href="/login"
              className="text-indigo-400 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

