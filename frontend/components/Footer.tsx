'use client';

interface FooterProps {
  onAddToCart?: () => void;
}

export default function Footer({ onAddToCart }: FooterProps) {
  return (
    <footer className="bg-[#1E1E1E] border-t border-white/10 px-6 py-4">
      <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400 gap-4">
        <div className="flex items-center">
          <span>© 2024 Emerald Water. All rights reserved.</span>
        </div>
        <div className="flex items-center">
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              className="px-6 py-2 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

