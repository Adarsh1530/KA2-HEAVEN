import React from 'react';
import {
  LayoutDashboard,
  Smartphone,
  History,
  ExternalLink,
  LogOut,
  Database,
  X,
} from 'lucide-react';

export type AdminTab = 'overview' | 'devices' | 'audit' | 'maintenance';

interface SidebarProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const menuItems: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Telemetry & Health', icon: LayoutDashboard },
    { id: 'devices', label: 'Device Sessions', icon: Smartphone },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'maintenance', label: 'Data & Backups', icon: Database },
  ];

  const handleItemClick = (id: AdminTab) => {
    onSelectTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#101019] border-r border-white/10 flex flex-col justify-between p-4 min-h-screen select-none transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Monogram Brand Header */}
          <div className="flex items-center justify-between px-3 py-4 mb-6 border-b border-white/10">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#9B5CFF] to-[#FF4F81] flex items-center justify-center font-black text-white text-lg shadow-glow-pink">
                KA²
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">KA² — HEAVEN</h2>
                <p className="text-[10px] text-[#FF91B5] font-medium">Admin Infrastructure</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#9B5CFF]/30 to-[#FF4F81]/30 border border-[#FF4F81] text-white shadow-glow-pink'
                      : 'text-[#A7A7B7] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF4F81]' : 'text-white/60'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Mobile App link & Logout */}
        <div className="space-y-2 pt-4 border-t border-white/10">
          <a
            href={
              typeof window !== 'undefined' && window.location.port === '5174'
                ? `http://${window.location.hostname || 'localhost'}:5173`
                : '/'
            }
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <span>Open Mobile App</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#FF91B5]" />
          </a>

          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#FF5570] hover:bg-[#FF5570]/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Console</span>
          </button>
        </div>
      </aside>
    </>
  );
};
