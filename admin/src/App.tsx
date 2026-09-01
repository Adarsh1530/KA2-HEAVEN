import React, { useState, useEffect } from 'react';
import { adminApi } from './services/adminApi';
import { Sidebar, AdminTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './pages/DashboardOverview';
import { CallLogs } from './pages/CallLogs';
import { ChatViewer } from './pages/ChatViewer';
import { MemoryViewer } from './pages/MemoryViewer';
import { DeviceManagement } from './pages/DeviceManagement';
import { AuditLogs } from './pages/AuditLogs';
import { DataMaintenance } from './pages/DataMaintenance';
import { AdminLogin } from './pages/AdminLogin';

export const App: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const token = adminApi.getToken();
    if (token) {
      adminApi.request('/auth/me')
        .then(data => {
          if (data.user.role === 'admin') {
            setAdminUser(data.user);
          } else {
            adminApi.clearToken();
            setAdminUser(null);
          }
        })
        .catch(() => {
          adminApi.clearToken();
          setAdminUser(null);
        })
        .finally(() => setIsCheckingAuth(false));
    } else {
      setIsCheckingAuth(false);
    }
  }, []);

  const handleLogout = () => {
    adminApi.clearToken();
    setAdminUser(null);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF4F81] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onSuccess={(user) => setAdminUser(user)} />;
  }

  return (
    <div className="flex min-h-screen bg-[#07070C] text-white">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          user={adminUser}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'calls' && <CallLogs />}
          {activeTab === 'chats' && <ChatViewer />}
          {activeTab === 'memories' && <MemoryViewer />}
          {activeTab === 'devices' && <DeviceManagement />}
          {activeTab === 'audit' && <AuditLogs />}
          {activeTab === 'maintenance' && <DataMaintenance />}
        </main>
      </div>
    </div>
  );
};

export default App;
