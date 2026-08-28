import React from 'react';
import { ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  user: any;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="h-16 border-b border-white/10 bg-[#101019]/80 backdrop-blur-xl px-6 flex items-center justify-between select-none">
      <div className="flex items-center space-x-2 text-xs text-[#A7A7B7]">
        <ShieldCheck className="w-4 h-4 text-[#42D392]" />
        <span>Authenticated as Administrator (Keerthi Adarsh)</span>
      </div>

      <div className="flex items-center space-x-3">
        <div className="text-right">
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
