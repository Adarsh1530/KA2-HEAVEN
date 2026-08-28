import React, { useState, useEffect } from 'react';
import { adminApi } from './services/adminApi';
import { Sidebar, AdminTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardOverview } from './pages/DashboardOverview';
import { ThemeCustomizer } from './pages/ThemeCustomizer';
import { DeviceManagement } from './pages/DeviceManagement';
import { AuditLogs } from './pages/AuditLogs';
import { AdminLogin } from './pages/AdminLogin';

export const App: React.FC = () => {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={adminUser} />
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'customizer' && <ThemeCustomizer />}
          {activeTab === 'devices' && <DeviceManagement />}
          {activeTab === 'audit' && <AuditLogs />}
        </main>
      </div>
    </div>
  );
};

export default App;
