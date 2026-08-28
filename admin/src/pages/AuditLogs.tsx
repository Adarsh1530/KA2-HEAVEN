import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { AuditLog } from '@ka2/shared';
import { ShieldCheck, History, User, Globe, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await adminApi.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
          <History className="w-6 h-6 text-[#42D392]" />
          <span>Security & Infrastructure Audit Trail</span>
        </h1>
        <p className="text-sm text-[#A7A7B7]">
          Zero-Knowledge audit log records. Plaintext chat/media contents are strictly excluded.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Audit Events ({logs.length})
          </span>
          <span className="text-xs text-[#FF91B5] font-semibold">
            Immutable Chronological Ledger
          </span>
        </div>

        <div className="divide-y divide-white/5 font-mono text-xs">
          {logs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-[#FF91B5] text-xs">
                    {log.userEmail || 'System Core'}
                  </span>
                </div>
                <p className="text-white/80 text-[11px] font-sans">{log.details}</p>
              </div>

              <div className="flex items-center space-x-4 text-[10px] text-[#A7A7B7] whitespace-nowrap">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3 h-3 text-white/50" />
                  <span>{log.ipAddress}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-white/50" />
                  <span>{format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
