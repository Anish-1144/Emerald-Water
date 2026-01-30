'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, User, Phone, Building2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignUp?: (event: React.FormEvent<HTMLFormElement>) => void;
  onSignIn?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="relative rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {icon && (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10">
        {icon}
      </div>
    )}
    <div className={icon ? 'pl-12' : ''}>
      {children}
    </div>
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`flex items-start gap-3 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 p-5 w-64 ${delay}`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-gray-400">{testimonial.handle}</p>
      <p className="mt-1 text-gray-300">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = <span className="font-light text-white tracking-tighter">Create Account</span>,
  description = "Join us and start designing your custom bottles",
  heroImageSrc,
  testimonials = [],
  onSignUp,
  onSignIn,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] overflow-y-auto">
      {/* Left column: sign-up form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">{title}</h1>
            <p className="text-gray-300">{description}</p>

            <form className="space-y-5" onSubmit={onSignUp}>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name</label>
                <GlassInputWrapper icon={<User className="w-5 h-5" />}>
                  <input name="name" type="text" placeholder="Enter your full name" className="w-full bg-transparent text-white text-sm p-4 rounded-2xl focus:outline-none placeholder:text-gray-400" required />
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-white text-sm p-4 rounded-2xl focus:outline-none placeholder:text-gray-400" required />
                </GlassInputWrapper>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-white text-sm p-4 pr-12 rounded-2xl focus:outline-none placeholder:text-gray-400" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-gray-400 hover:text-white transition-colors" /> : <Eye className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Phone (Optional)</label>
                  <GlassInputWrapper>
                    <input name="phone" type="tel" placeholder="Enter your phone number" className="w-full bg-transparent text-white text-sm p-4 rounded-2xl focus:outline-none placeholder:text-gray-400" />
                  </GlassInputWrapper>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-300 mb-2 block">Company Name (Optional)</label>
                  <GlassInputWrapper>
                    <input name="company_name" type="text" placeholder="Enter your company name" className="w-full bg-transparent text-white text-sm p-4 rounded-2xl focus:outline-none placeholder:text-gray-400" />
                  </GlassInputWrapper>
                </div>
              </div>

              <button type="submit" className="w-full rounded-2xl bg-violet-600 py-4 font-medium text-white hover:bg-violet-700 transition-colors">
                Create Account
              </button>
            </form>

            <p className="text-center text-sm text-gray-300">
              Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onSignIn?.(); }} className="text-violet-400 hover:underline transition-colors">Sign In</a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

