import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { Smartphone, Shield, Trash2, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const list = await adminApi.getDevices();
      setDevices(list);
    } catch (err) {
      console.error('Failed to load devices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleRevoke = async (deviceId: string) => {
    if (!confirm('Are you sure you want to revoke this session? The device will be logged out immediately.')) return;
    try {
      await adminApi.revokeDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (err) {
      console.error('Failed to revoke device:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <Smartphone className="w-6 h-6 text-[#9B5CFF]" />
          <span>Device Sessions & Access Security</span>
        </h1>
        <p className="text-sm text-[#A7A7B7]">
          Monitor and revoke authorized hardware access for Keerthi & Anu
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Active Registered Hardware ({devices.length})
          </span>
          <span className="text-xs text-[#42D392] flex items-center space-x-1 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Strict Access Control Active</span>
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {devices.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#A7A7B7]">No active sessions found.</div>
          ) : (
            devices.map((dev) => (
              <div key={dev.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF91B5]">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                      <span>{dev.deviceName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#FF91B5] font-normal">
                        {dev.userName}
                      </span>
                    </h3>
                    <p className="text-xs text-[#A7A7B7] mt-0.5">
                      IP: {dev.ipAddress} • Platform: {dev.deviceType} • Registered: {format(new Date(dev.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(dev.id)}
                  className="px-3 py-1.5 rounded-xl bg-[#FF5570]/15 hover:bg-[#FF5570]/25 text-[#FF5570] text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revoke Session</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
