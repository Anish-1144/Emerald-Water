'use client';

import Image from 'next/image';

export default function LoadingScreen() {
  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: '#1E1E1E',
      }}
    >
      {/* Gradient overlay layer */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/background-gradient.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Logo - no spin */}
      <div className="relative z-10">
        <Image
          src="/logo1.jpg"
          alt="Loading"
          width={120}
          height={120}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

