import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi } from '../services/adminApi';
import {
  BackupConfig,
  AutoBackupSchedule,
  FullBackupSnapshot,
  AdminTelemetry,
} from '@ka2/shared';
import {
  Database,
  Download,
  Upload,
  Calendar,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  X,
  FileJson,
  Layers,
} from 'lucide-react';
import { format } from 'date-fns';

export const DataMaintenance: React.FC = () => {
  const [telemetry, setTelemetry] = useState<AdminTelemetry | null>(null);
  const [backupConfig, setBackupConfig] = useState<BackupConfig | null>(null);
  const [schedule, setSchedule] = useState<AutoBackupSchedule>('daily');
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Clear Data Modal State
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearTarget, setClearTarget] = useState<'all' | 'messages' | 'memories' | 'vault' | 'loveNotes'>('all');
  const [pinInput, setPinInput] = useState('');
  const [confirmationPhrase, setConfirmationPhrase] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  const restoreFileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = async () => {
    try {
      const [t, c] = await Promise.all([
        adminApi.getTelemetry(),
        adminApi.getBackupConfig(),
      ]);
      setTelemetry(t);
      setBackupConfig(c);
      if (c?.autoBackupSchedule) {
        setSchedule(c.autoBackupSchedule);
      }
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleChange = async (newSchedule: AutoBackupSchedule) => {
    setSchedule(newSchedule);
    setIsSavingSchedule(true);
    try {
      const updated = await adminApi.updateBackupConfig({ autoBackupSchedule: newSchedule });
      setBackupConfig(updated);
      setStatusMessage({ type: 'success', text: `Auto-backup schedule updated to ${newSchedule.toUpperCase()}.` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update schedule.' });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const snapshot = await adminApi.exportBackup();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `KA2_HEAVEN_BACKUP_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatusMessage({ type: 'success', text: 'Full system backup downloaded successfully.' });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to download backup.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const text = await file.text();
      const snapshot: FullBackupSnapshot = JSON.parse(text);

      if (!snapshot.data) {
        throw new Error('Invalid backup file structure.');
      }

      const res = await adminApi.restoreBackup(snapshot);
      setStatusMessage({
        type: 'success',
        text: `Restored successfully! (${res.stats?.messagesCount || 0} messages, ${res.stats?.memoriesCount || 0} memories, ${res.stats?.vaultItemsCount || 0} vault items)`,
      });
      await loadData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to restore backup.' });
    } finally {
      setIsRestoring(false);
      if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
    }
  };

  const handleExecuteClearData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmationPhrase !== 'CLEAR HEAVEN DATA' || pinInput.length < 4) return;

    setIsClearing(true);
    try {
      const res = await adminApi.clearData({
        pin: pinInput,
        confirmationPhrase,
        target: clearTarget,
      });

      setStatusMessage({ type: 'success', text: res.message || 'Selected data wiped successfully.' });
      setIsClearModalOpen(false);
      setPinInput('');
      setConfirmationPhrase('');
      await loadData();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Clear data operation rejected.' });
    } finally {
      setIsClearing(false);
    }
  };

  const scheduleOptions: { id: AutoBackupSchedule; label: string; desc: string }[] = [
    { id: 'hourly', label: 'Hourly', desc: 'Continuous protection' },
    { id: 'daily', label: 'Daily (Recommended)', desc: 'Automatic snapshot at midnight' },
    { id: 'weekly', label: 'Weekly', desc: 'Every Sunday at 00:00' },
    { id: 'monthly', label: 'Monthly', desc: '1st of each month' },
    { id: 'disabled', label: 'Disabled', desc: 'Manual backups only' },
  ];

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Hidden file input for restore */}
      <input
        type="file"
        ref={restoreFileInputRef}
        accept=".json,application/json"
        onChange={handleRestoreFile}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-[#9B5CFF]" />
            <span>Data, Backups & Maintenance</span>
          </h1>
          <p className="text-xs text-[#A7A7B7]">Automated disaster recovery, JSON snapshots, and data lifecycle management</p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center space-x-1.5 border border-white/10 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3.5 rounded-2xl text-xs flex items-center space-x-2.5 border ${
            statusMessage.type === 'success'
              ? 'bg-[#42D392]/15 border-[#42D392]/40 text-[#42D392]'
              : 'bg-[#FF5570]/15 border-[#FF5570]/40 text-[#FF5570]'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{statusMessage.text}</span>
        </motion.div>
      )}

      {/* 1. Storage Stats Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-[#101019] p-4 rounded-2xl border border-white/10">
          <span className="text-[11px] text-[#A7A7B7]">Total Messages</span>
          <p className="text-xl font-bold text-white mt-1">{telemetry?.totalMessagesCount ?? 0}</p>
        </div>
        <div className="bg-[#101019] p-4 rounded-2xl border border-white/10">
          <span className="text-[11px] text-[#A7A7B7]">Shared Memories</span>
          <p className="text-xl font-bold text-white mt-1">{telemetry?.totalMemoriesCount ?? 0}</p>
        </div>
        <div className="bg-[#101019] p-4 rounded-2xl border border-white/10">
          <span className="text-[11px] text-[#A7A7B7]">Encrypted Vault Items</span>
          <p className="text-xl font-bold text-white mt-1">{telemetry?.totalVaultItemsCount ?? 0}</p>
        </div>
        <div className="bg-[#101019] p-4 rounded-2xl border border-white/10">
          <span className="text-[11px] text-[#A7A7B7]">Disk Storage Used</span>
          <p className="text-xl font-bold text-white mt-1">
            {((telemetry?.totalStorageBytes ?? 0) / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>

      {/* 2. Automated Scheduled Backups & Export */}
      <div className="bg-[#101019] p-6 rounded-3xl border border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#FF91B5]" />
              <span>Automated Backup Scheduler</span>
            </h2>
            <p className="text-xs text-[#A7A7B7] mt-0.5">
              Automatically creates periodic zero-knowledge data snapshots of your Heaven world.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-pink hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Generating Backup...' : 'Download Instant Backup'}</span>
            </button>

            <button
              onClick={() => restoreFileInputRef.current?.click()}
              disabled={isRestoring}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center space-x-1.5 border border-white/10 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-[#42D392]" />
              <span>{isRestoring ? 'Restoring...' : 'Restore from File'}</span>
            </button>
          </div>
        </div>

        {/* Schedule Selector Radio Grid */}
        <div>
          <label className="block text-xs font-semibold text-white/90 mb-3">Backup Frequency</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {scheduleOptions.map((opt) => {
              const isSelected = schedule === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleScheduleChange(opt.id)}
                  disabled={isSavingSchedule}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#9B5CFF]/20 to-[#FF4F81]/20 border-[#FF4F81] text-white shadow-glow-pink'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF4F81]" />}
                  </div>
                  <p className="text-[10px] text-[#A7A7B7]">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-[#A7A7B7] gap-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#B28CFF]" />
            <span>
              Last Snapshot:{' '}
              <strong className="text-white">
                {backupConfig?.lastBackupTimestamp
                  ? format(new Date(backupConfig.lastBackupTimestamp), 'MMM dd, yyyy • HH:mm')
                  : 'Never'}
              </strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#42D392]" />
            <span>
              Auto-Retention: <strong className="text-white">10 Rolling Snapshots</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Danger Zone / Clear All Data */}
      <div className="bg-[#101019] p-6 rounded-3xl border border-[#FF5570]/30 shadow-[0_0_30px_rgba(255,85,112,0.1)] space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF5570]/20 flex items-center justify-center text-[#FF5570]">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#FF5570]">Danger Zone — Wipe & Clear System Data</h2>
            <p className="text-xs text-[#A7A7B7]">Permanently wipe messages, media, memories, or confidential vault records.</p>
          </div>
        </div>

        <p className="text-xs text-white/70 leading-relaxed bg-[#FF5570]/10 p-3.5 rounded-2xl border border-[#FF5570]/20">
          ⚠️ <strong>Warning:</strong> This action cannot be undone unless you have downloaded a JSON backup snapshot beforehand. User accounts and admin credentials will remain preserved.
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[#A7A7B7]">Double PIN & phrase confirmation required.</span>
          <button
            onClick={() => setIsClearModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#FF5570] hover:bg-[#FF4560] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data...</span>
          </button>
        </div>
      </div>

      {/* 4. Clear Data Confirmation Modal */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#101019] border border-[#FF5570]/50 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-[#FF5570] flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-[#FF5570]" />
                  <span>Confirm Irreversible Data Wipe</span>
                </h3>
                <button
                  onClick={() => setIsClearModalOpen(false)}
                  className="text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleExecuteClearData} className="space-y-4">
                {/* Target Selector */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-semibold">Select Target to Wipe</label>
                  <select
                    value={clearTarget}
                    onChange={(e) => setClearTarget(e.target.value as any)}
                    className="w-full bg-[#07070C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5570]"
                  >
                    <option value="all">🔥 ALL Couple Data (Messages, Memories, Vault, Love Notes)</option>
                    <option value="messages">💬 Chat Messages & Reactions Only</option>
                    <option value="memories">📸 Photos & Videos (Memories) Only</option>
                    <option value="vault">🔐 Encrypted Vault Secrets Only</option>
                    <option value="loveNotes">💌 Love Notes & Letters Only</option>
                  </select>
                </div>

                {/* PIN Verification */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-semibold">
                    Enter Admin Security PIN (Default: 1530)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="w-full bg-[#07070C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white tracking-widest text-center font-mono focus:outline-none focus:border-[#FF5570]"
                  />
                </div>

                {/* Safety Confirmation Phrase */}
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-semibold">
                    Type <strong className="text-white">CLEAR HEAVEN DATA</strong> to confirm
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CLEAR HEAVEN DATA"
                    value={confirmationPhrase}
                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                    className="w-full bg-[#07070C] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF5570]"
                  />
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsClearModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isClearing ||
                      confirmationPhrase !== 'CLEAR HEAVEN DATA' ||
                      pinInput.length < 4
                    }
                    className="flex-1 py-2.5 rounded-xl bg-[#FF5570] hover:bg-[#FF4560] text-white text-xs font-bold disabled:opacity-40 transition-opacity cursor-pointer flex items-center justify-center space-x-1.5 shadow-lg"
                  >
                    {isClearing ? (
                      <span>Wiping Data...</span>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirm & Wipe</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
