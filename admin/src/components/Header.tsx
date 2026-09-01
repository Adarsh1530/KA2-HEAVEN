import React from 'react';
import { ShieldCheck, Menu } from 'lucide-react';

interface HeaderProps {
  user: any;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onToggleMobileSidebar }) => {
  return (
    <header className="h-16 border-b border-white/10 bg-[#101019]/80 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between select-none sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-xs text-[#A7A7B7]">
          <ShieldCheck className="w-4 h-4 text-[#42D392] shrink-0" />
          <span className="hidden sm:inline">Authenticated as Administrator (Keerthi Adarsh)</span>
          <span className="sm:hidden font-semibold text-white">Admin Console</span>
        </div>
      </div>

      <div className="flex items-center space-x-2.5">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-white">Keerthi Adarsh</div>
          <div className="text-[10px] text-[#42D392]">System Admin</div>
        </div>
        <img
          src={user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
          alt="Admin"
          className="w-9 h-9 rounded-full object-cover border border-[#9B5CFF]"
        />
      </div>
    </header>
  );
};
