'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Truck, Package } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';
import { ShimmerButton } from '@/components/ui/shimmer-button';

export default function LandingPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);

  // Product images - using dummy images from public folder
  const productImages = [
    
    '/landing1.png',
    '/landing2.png',
    '/landing3.jpeg',
    '/login1.png',
    '/login.png',
  ];

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length);
  };

  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors" style={{ backgroundColor: 'var(--background)' }}>
      <Header />
      <div 
        className="flex-1 transition-colors"
        style={{ backgroundColor: 'var(--background)' }}
      >
      <div className="max-w-5xl mx-auto h-full">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Side - Image Gallery (Fixed) */}
          <div className="lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden shrink-0 w-full lg:w-2/5 p-6 lg:py-8 lg:px-6 xl:px-8">
            <div className="space-y-6 lg:max-h-screen lg:overflow-y-auto lg:pr-4" style={{ scrollBehavior: 'smooth' }}>
            {/* Main Image */}
            <div 
              className="relative aspect-square rounded-xl overflow-hidden transition-all shadow-lg"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                padding: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image
                  src={productImages[selectedImage]}
                  alt={`Product view ${selectedImage + 1}`}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              {/* Navigation Arrows */}
              <button
                onClick={handlePrevImage}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all z-10"
                style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full transition-all z-10"
                style={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                }}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-3 overflow-x-auto pb-2 px-1">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 transition-all shadow-md ${
                    selectedImage === index ? 'ring-2 ring-[#4DB64F]' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'var(--card-bg)',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Right Side - Product Information (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 lg:py-6 lg:px-6 xl:px-8" style={{ scrollBehavior: 'smooth' }}>
            <div className="space-y-4 pt-2 max-w-lg">
            {/* Product Title */}
            <div className="mb-1">
              <h1 
                className="text-2xl md:text-3xl font-bold mb-2 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Custom Labeled 500ml Bottles
          </h1>
              <p 
                className="text-sm mb-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Re-filtered and re-mineralized PH Emerald Water
              </p>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span 
                  className="text-xs transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  304 Reviews
                </span>
              </div>
            </div>

            {/* Technique */}
            <div className="py-1">
              <span 
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Technique:
              </span>
              <span 
                className="ml-2 text-xs transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                UV printing
              </span>
            </div>

            {/* Price */}
            <div className="py-3 px-2 border-t border-b my-2" style={{ borderColor: 'var(--border-color)' }}>
              <div 
                className="text-xl md:text-2xl font-bold mb-1 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Starting at $1.05/bottle
              </div>
              <div 
                className="text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Minimum order: 10 cases (300 bottles)
              </div>
              <div 
                className="text-xs mt-1 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Packaged in cases of 30 • One-time setup fee: $150
              </div>
            </div>

            {/* Shipping Options */}
            <div 
              className="p-3 rounded-lg transition-all shadow-md"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span 
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Shipping & Delivery
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Pick-up</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Free</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Local Scheduled Delivery</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>$50</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>Shipping (Outside Regina)</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>Quote Required</span>
                </div>
              </div>
              <div 
                className="text-xs mt-2 pt-2 border-t transition-colors"
                style={{ 
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border-color)'
                }}
              >
                Poly Shrink Wrap: $1.99 per case of 30
              </div>
            </div>

            {/* Start Designing Button */}
            <div className="w-full mt-1">
              <ShimmerButton
                onClick={() => router.push('/design')}
                className="w-full"
                background="#4DB64F"
                shimmerColor="#ffffff"
              >
                <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white lg:text-base">
                  Start Designing
                </span>
              </ShimmerButton>
            </div>

            {/* Pricing Tiers */}
            <div className="py-1">
              <label 
                className="block text-xs font-medium mb-2 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Pricing Tiers
              </label>
              <div 
                className="space-y-1 p-3 rounded-lg transition-colors"
                style={{ 
                  backgroundColor: 'var(--card-bg)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>300 - 570 bottles</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>$1.05 each</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>600 - 870 bottles</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>$0.96 each</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>900 - 1,470 bottles</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>$0.94 each</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-secondary)' }}>Pallet (1,500+)</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>$0.90 each</span>
                </div>
              </div>
              <p 
                className="text-xs mt-1 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                White caps included. Black caps +$0.05, Blue/Other +$0.08 per bottle
              </p>
            </div>

            {/* Latest Orders */}
            <div 
              className="p-3 rounded-lg transition-all shadow-md"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                <span 
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Latest orders from:
                </span>
              </div>
              <div 
                className="text-xs transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Fazilka, IN <span style={{ color: 'var(--text-muted)' }}>7 hours ago</span>
              </div>
            </div>

            {/* Disclaimer */}
            <div 
              className="text-xs transition-colors mt-2 pt-2 space-y-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <p>
                * Pricing subject to tax. Deposit and Enviro included.
              </p>
              <p>
                * Every bottle is filled with our re-filtered and re-mineralized PH Emerald Water.
              </p>
              <p>
                * All customization, preparation and packaging done in-house.
              </p>
              <p className="mt-1">
                Visit <a href="https://www.emeraldwater.ca" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#4DB64F]">emeraldwater.ca</a> for examples of previous custom labeled projects.
              </p>
            </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
