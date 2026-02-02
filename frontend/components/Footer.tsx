'use client';

interface FooterProps {
  onAddToCart?: () => void;
}

export default function Footer({ onAddToCart }: FooterProps) {
  return (
    <footer 
      className="border-t px-6 py-4 transition-all shadow-lg"
      style={{ 
        backgroundColor: 'var(--background)', 
        borderColor: 'var(--border-color)',
        boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div 
        className="flex flex-col md:flex-row items-center justify-between text-sm gap-4 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="flex items-center">
          <span>© 2024 Emerald Water. All rights reserved.</span>
        </div>
        <div className="flex items-center">
          {onAddToCart && (
            <button
              onClick={onAddToCart}
              className="px-6 py-2 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-all font-medium"
              style={{
                boxShadow: '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(77, 182, 79, 0.4), 0 4px 6px -2px rgba(77, 182, 79, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(77, 182, 79, 0.3), 0 2px 4px -1px rgba(77, 182, 79, 0.2)';
              }}
            >
              Add to Cart
            </button>
          )}
        </div>
      </div>
    </footer>
  );
}

