'use client';

import { 
  Layers, 
  Upload, 
  Image as ImageIcon,
  Ticket,
  ShoppingCart,
  User
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: string | null;
  onTabChange: (tab: string | null) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const items: SidebarItem[] = [
    { id: 'label-design', label: 'Label Design', icon: <Layers className="w-6 h-6" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-6 h-6" /> },
    { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-6 h-6" /> },
    { id: 'ticket', label: 'Ticket', icon: <Ticket className="w-6 h-6" /> },
    { id: 'cart', label: 'Cart', icon: <ShoppingCart className="w-6 h-6" /> },
    { id: 'edit-profile', label: 'Edit Profile', icon: <User className="w-6 h-6" /> },
  ];

  return (
    <aside className="w-24 bg-[#1E1E1E] border-r border-white/10 flex flex-col items-center py-6 gap-2">
      {items.map((item) => (
        <div key={item.id} className="w-full px-2">
          <button
            onClick={() => onTabChange(activeTab === item.id ? null : item.id)}
            className={`w-full flex flex-col items-center gap-1.5 p-3 rounded-lg transition-colors ${
              activeTab === item.id
                ? 'bg-white/10 text-[#4DB64F]'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
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
