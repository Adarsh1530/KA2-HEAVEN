import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCustomServerUrl, setCustomServerUrl, testServerHealth } from '../../services/api';
import { socketService, SocketConnectionState, getSocketUrl } from '../../services/socket';
import {
  Globe,
  Radio,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Server,
  Zap,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({ isOpen, onClose }) => {
  const [serverUrl, setServerUrl] = useState('');
  const [socketState, setSocketState] = useState<SocketConnectionState>('disconnected');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message?: string;
  } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getCustomServerUrl();
      setServerUrl(current);
      setTestResult(null);
      // Run automatic test on open
      runTest(current);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = socketService.onStatusChange((state) => {
      setSocketState(state);
    });
    return unsub;
  }, []);

  const runTest = async (urlToTest?: string) => {
    setIsTesting(true);
    try {
      const result = await testServerHealth(urlToTest);
      setTestResult(result);
    } catch {
      setTestResult({ success: false, latencyMs: 0, message: 'Test failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = serverUrl.trim();
    setCustomServerUrl(cleanUrl);
    await runTest(cleanUrl);
    socketService.reconnect();
  };

  const handleResetToDefault = () => {
    setServerUrl('');
    setCustomServerUrl('');
    runTest('');
    socketService.reconnect();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl relative overflow-hidden"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#9B5CFF]/30 to-[#FF4F81]/30 border border-[#FF4F81]/30 flex items-center justify-center text-[#FF91B5]">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Cloud Server Connection</h3>
                <p className="text-[10px] text-[#A7A7B7]">Worldwide Realtime Sync & Calling</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Connection Status Pill */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="relative flex h-3 w-3">
                {socketState === 'connected' ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#42D392] opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#42D392]" />
                  </>
                ) : socketState === 'connecting' ? (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FFB800] animate-pulse" />
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF5570]" />
                )}
              </span>
              <div>
                <span className="text-xs font-semibold text-white">
                  {socketState === 'connected'
                    ? 'Cloud Realtime Active'
                    : socketState === 'connecting'
                    ? 'Connecting to Server...'
                    : 'Server Disconnected (Offline)'}
                </span>
                <p className="text-[9px] text-[#A7A7B7]">
                  {socketState === 'connected'
                    ? 'Chat & WebRTC calls online worldwide'
                    : 'Saved to local device storage only'}
                </p>
              </div>
            </div>

            <button
              onClick={() => runTest(serverUrl)}
              disabled={isTesting}
              title="Ping Server"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#FF4F81]' : ''}`} />
            </button>
          </div>

          {/* Ping Test Feedback Banner */}
          {testResult && (
            <div
              className={`p-2.5 rounded-xl text-xs mb-4 flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-[#42D392]/15 border-[#42D392]/30 text-[#42D392]'
                  : 'bg-[#FF5570]/15 border-[#FF5570]/30 text-[#FF5570]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-[11px] leading-tight">
                <p className="font-semibold">
                  {testResult.success ? `Connected (${testResult.latencyMs}ms)` : 'Connection Failed'}
                </p>
                <p className="opacity-80 mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Server URL Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-[#A7A7B7]">
                  Backend Server URL
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="text-[10px] text-[#FF91B5] flex items-center space-x-1 hover:underline"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>How to host free?</span>
                </button>
              </div>

              <div className="relative">
                <input
                  type="url"
                  placeholder="https://ka2-heaven-api.onrender.com"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#FF4F81] font-mono text-[11px]"
                />
              </div>
              <p className="text-[9px] text-[#A7A7B7] mt-1">
                Currently using: <span className="text-white/80 font-mono">{getSocketUrl()}</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-medium transition-colors"
              >
                Reset Default
              </button>
              <button
                type="submit"
                disabled={isTesting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90 transition-opacity flex items-center justify-center space-x-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Save & Connect</span>
              </button>
            </div>
          </form>

          {/* Free Hosting Guide Dropdown */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-3 border-t border-white/10 overflow-hidden text-[10px] text-white/80 space-y-1.5"
              >
                <p className="font-semibold text-white flex items-center space-x-1">
                  <span>💡 2-Minute Free Cloud Setup:</span>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-white/70">
                  <li>Deploy this repository on <strong className="text-white">Render.com</strong> (Web Service, Node environment).</li>
                  <li>Copy your free Render URL (e.g. <span className="text-[#FF91B5] font-mono">https://ka2-api.onrender.com</span>).</li>
                  <li>Paste it into the field above and tap <strong className="text-white">Save & Connect</strong>.</li>
                </ol>
                <p className="text-[9px] text-[#A7A7B7] pt-1">
                  Once set, chat and video calls will instantly work from any phone anywhere in the world!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
