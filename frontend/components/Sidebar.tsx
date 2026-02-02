'use client';

import { useRouter, usePathname } from 'next/navigation';
import { 
  Layers, 
  Upload, 
  Image as ImageIcon,
  Package,
  ShoppingCart
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isNavigation?: boolean;
  route?: string;
}

interface SidebarProps {
  activeTab: string | null;
  onTabChange: (tab: string | null) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesignPage = pathname === '/design';
  
  const items: SidebarItem[] = [
    { id: 'label-design', label: 'Label Design', icon: <Layers className="w-6 h-6" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-6 h-6" /> },
    { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-6 h-6" /> },
    { id: 'my-orders', label: 'My Orders', icon: <Package className="w-6 h-6" />, isNavigation: true, route: '/orders' },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart className="w-6 h-6" /> },
  ];

  const handleItemClick = (item: SidebarItem) => {
    if (item.isNavigation && item.route) {
      router.push(item.route);
    } else {
      // If not on design page, navigate to design page with tab info
      if (!isDesignPage) {
        // Store the tab in sessionStorage before navigation
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pendingTab', item.id);
        }
        router.push('/design');
      } else {
        // On design page, use the onTabChange handler
        onTabChange(activeTab === item.id ? null : item.id);
      }
    }
  };

  return (
    <aside 
      className="w-24 border-r flex flex-col items-center py-6 gap-2 transition-all shadow-md"
      style={{ 
        backgroundColor: 'var(--background)', 
        borderColor: 'var(--border-color)',
        boxShadow: '2px 0 8px -2px rgba(0, 0, 0, 0.1)'
      }}
    >
      {items.map((item) => (
        <div key={item.id} className="w-full px-2">
          <button
            onClick={() => handleItemClick(item)}
            className="w-full flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all shadow-sm"
            style={{
              backgroundColor: activeTab === item.id ? 'var(--card-bg)' : 'transparent',
              color: activeTab === item.id ? '#4DB64F' : 'var(--text-muted)',
              boxShadow: activeTab === item.id ? '0 2px 4px -1px rgba(0, 0, 0, 0.1)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== item.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }
            }}
            title={item.label}
          >
            {item.icon}
            <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
          </button>
        </div>
      ))}
    </aside>
  );
}
