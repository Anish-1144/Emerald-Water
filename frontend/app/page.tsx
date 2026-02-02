'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Check, Truck, Package } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';

export default function LandingPage() {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('white');
  const [selectedSize, setSelectedSize] = useState('17');

  // Product images - using dummy images from public folder
  const productImages = [
    '/login.png',
    '/login1.png',
    '/login2.png',
    '/login3.png',
    '/logo.jpg',
  ];

  const colors = [
    { name: 'Black', value: 'black', color: '#000000' },
    { name: 'White', value: 'white', color: '#ffffff' },
  ];

  const sizes = ['17 oz', '21 oz', '32 oz'];

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
        className="flex-1 py-8 px-4 md:py-12 md:px-8 lg:py-16 lg:px-12 transition-colors"
        style={{ backgroundColor: 'var(--background)' }}
      >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20">
          {/* Left Side - Image Gallery */}
          <div className="space-y-6">
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

          {/* Right Side - Product Information */}
          <div className="space-y-8 pt-4">
            {/* Product Title */}
            <div className="mb-2">
              <h1 
                className="text-4xl md:text-5xl font-bold mb-4 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Emerald Water Bottle
          </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span 
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  304 Reviews
                </span>
              </div>
            </div>

            {/* Technique */}
            <div className="py-2">
              <span 
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Technique:
              </span>
              <span 
                className="ml-2 text-sm transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                UV printing
              </span>
            </div>

            {/* Color Selection */}
            <div className="py-2">
              <label 
                className="block text-sm font-medium mb-4 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Color
              </label>
              <div className="flex gap-4">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all shadow-sm ${
                      selectedColor === color.value
                        ? 'border-[#4DB64F] ring-2 ring-[#4DB64F]/30'
                        : 'border-gray-300'
                    }`}
                    style={{
                      backgroundColor: color.color,
                      borderColor: selectedColor === color.value ? '#4DB64F' : 'var(--border-color)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {selectedColor === color.value && (
                      <Check className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div className="py-2">
              <label 
                className="block text-sm font-medium mb-4 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Size
              </label>
              <div className="flex gap-4">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all font-medium shadow-sm ${
                      selectedSize === size
                        ? 'border-[#4DB64F] bg-[#4DB64F]/10'
                        : 'border-gray-300'
                    }`}
                    style={{
                      borderColor: selectedSize === size ? '#4DB64F' : 'var(--border-color)',
                      backgroundColor: selectedSize === size ? 'rgba(77, 182, 79, 0.1)' : 'var(--card-bg)',
                      color: 'var(--text-primary)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="py-6 px-2 border-t border-b my-4" style={{ borderColor: 'var(--border-color)' }}>
              <div 
                className="text-3xl md:text-4xl font-bold mb-2 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                $20.50
              </div>
              <div 
                className="text-sm transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Print included
              </div>
            </div>

            {/* Estimated Delivery */}
            <div 
              className="p-5 rounded-lg transition-all shadow-md"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                <span 
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Estimated delivery to India
                </span>
                <span className="text-2xl">🇮🇳</span>
              </div>
              <div 
                className="text-sm font-semibold mb-1 transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Feb 11-14
              </div>
              <div 
                className="text-xs transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                Shipping starts at $15.99
              </div>
            </div>

            {/* Bulk Price Calculator */}
            <div className="py-2">
              <label 
                className="block text-sm font-medium mb-3 transition-colors"
                style={{ color: 'var(--text-secondary)' }}
              >
                Bulk price calculator
              </label>
              <select
                className="w-full px-4 py-3 border rounded-lg transition-all shadow-sm"
                style={{ 
                  backgroundColor: 'var(--input-bg)', 
                  borderColor: 'var(--input-border)',
                  color: 'var(--text-primary)',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                <option>Select quantity</option>
                <option>100+ bottles</option>
                <option>500+ bottles</option>
                <option>1000+ bottles</option>
              </select>
            </div>

            {/* Start Designing Button */}
            <button
              onClick={() => router.push('/design')}
              className="w-full py-5 bg-[#4DB64F] hover:bg-[#45a049] text-white font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] text-lg mt-2"
              style={{
                boxShadow: '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(77, 182, 79, 0.4), 0 10px 10px -5px rgba(77, 182, 79, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.3), 0 4px 6px -2px rgba(77, 182, 79, 0.2)';
              }}
            >
          Start Designing
        </button>

            {/* Latest Orders */}
            <div 
              className="p-5 rounded-lg transition-all shadow-md"
              style={{ 
                backgroundColor: 'var(--card-bg)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <span 
                  className="text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Latest orders from:
                </span>
              </div>
              <div 
                className="text-sm transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                Fazilka, IN <span style={{ color: 'var(--text-muted)' }}>7 hours ago</span>
              </div>
            </div>

            {/* Disclaimer */}
            <p 
              className="text-xs transition-colors mt-4 pt-4"
              style={{ color: 'var(--text-muted)' }}
            >
              * Price varies depending on the production technique, print placement, product color and size, taxes, and shipping. See detailed info
            </p>
          </div>
        </div>
      </div>
        </div>
    </div>
  );
}
