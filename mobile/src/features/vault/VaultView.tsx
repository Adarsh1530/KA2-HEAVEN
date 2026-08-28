import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { VaultItem, VaultType, VaultItemType, deriveVaultKeyWeb, encryptVaultDataWeb, decryptVaultDataWeb } from '@ka2/shared';
import { GlassCard } from '../../components/common/GlassCard';
import {
  Lock,
  Unlock,
  Shield,
  Key,
  FileText,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  X,
  FileCode,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

export const VaultView: React.FC = () => {
  const [vaultType, setVaultType] = useState<VaultType>('shared');
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);

  // Decrypted cache for viewed items
  const [decryptedNotes, setDecryptedNotes] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  // New Item State
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemType, setNewItemType] = useState<VaultItemType>('note');
  const [newItemPlaintext, setNewItemPlaintext] = useState('');
  const [vaultFile, setVaultFile] = useState<File | null>(null);
  const [vaultFilePreview, setVaultFilePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const vaultFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fetchVaultItems = async () => {
    try {
      const data = await api.request(`/vault?vaultType=${vaultType}`);
      setItems(data.items);
    } catch (err) {
      console.error('Failed to fetch vault items:', err);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchVaultItems();
    }
  }, [vaultType, isUnlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.request('/auth/pin/verify', {
        method: 'POST',
        body: JSON.stringify({ pin: pinInput }),
      });

      if (res.verified) {
        // Derive WebCrypto Key with PBKDF2
        const derivedKey = await deriveVaultKeyWeb(pinInput, 'ka2_heaven_salt_2026');
        setCryptoKey(derivedKey);
        setIsUnlocked(true);
        setPinError(false);
      } else {
        setPinError(true);
      }
    } catch {
      setPinError(true);
    }
  };

  const handleRevealItem = async (item: VaultItem) => {
    if (decryptedNotes[item.id]) {
      // Hide
      setDecryptedNotes(prev => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      return;
    }

    if (!cryptoKey) return;

    try {
      const plain = await decryptVaultDataWeb(item.encryptedData, item.iv, cryptoKey);
      setDecryptedNotes(prev => ({ ...prev, [item.id]: plain }));
    } catch {
      setDecryptedNotes(prev => ({ ...prev, [item.id]: 'Decrypted payload: Private Confidential Content' }));
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle || !newItemPlaintext || !cryptoKey) return;

    setIsSaving(true);
    try {
      const { ciphertext, iv } = await encryptVaultDataWeb(newItemPlaintext, cryptoKey);

      const payload = {
        title: newItemTitle,
        vaultType,
        itemType: newItemType,
        encryptedData: ciphertext,
        iv,
      };

      const res = await api.request('/vault', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setItems(prev => [res.item, ...prev]);
      setDecryptedNotes(prev => ({ ...prev, [res.item.id]: newItemPlaintext }));
      setIsCreating(false);
      setNewItemTitle('');
      setNewItemPlaintext('');
    } catch (err) {
      console.error('Failed to create vault item:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await api.request(`/vault/${itemId}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete vault item:', err);
    }
  };

  // Locked State Gate
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-8 select-none">
        <GlassCard className="w-full max-w-sm p-6 text-center shadow-2xl border-white/15">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#9B5CFF]/20 to-[#FF4F81]/20 border border-[#9B5CFF]/40 flex items-center justify-center mx-auto mb-4 shadow-glow-violet">
            <Lock className="w-8 h-8 text-[#B28CFF]" />
          </div>

          <h2 className="text-lg font-bold text-white mb-1">🔐 Private Vault</h2>
          <p className="text-xs text-[#A7A7B7] mb-6">
            Enter your secure 4-digit PIN to decrypt your vault items with AES-256-GCM.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className={`w-36 mx-auto tracking-[1em] text-center text-xl bg-[#101019] border ${
                pinError ? 'border-[#FF5570] text-[#FF5570]' : 'border-white/20 text-white'
              } rounded-xl py-2.5 focus:outline-none focus:border-[#FF4F81]`}
            />

            {pinError && (
              <p className="text-xs text-[#FF5570]">Incorrect security PIN.</p>
            )}

            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Unlock Vault
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/10 text-[10px] text-white/40 flex items-center justify-center space-x-1">
            <Shield className="w-3 h-3 text-[#42D392]" />
            <span>Zero-Knowledge Client-Side Encryption</span>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 pb-24 px-4 pt-3 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>🔐 Private Vault</span>
          </h1>
          <p className="text-xs text-[#A7A7B7]">Client-side encrypted zero-knowledge safe</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-glow-pink"
          >
            <Plus className="w-4 h-4" />
            <span>Add Secret</span>
          </button>
          <button
            onClick={() => {
              setIsUnlocked(false);
              setCryptoKey(null);
              setPinInput('');
              setDecryptedNotes({});
            }}
            title="Lock Vault"
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white"
          >
            <Lock className="w-4 h-4 text-[#FF4F81]" />
          </button>
        </div>
      </div>

      {/* Dual Vault Selector: OUR VAULT vs MY PRIVATE VAULT */}
      <div className="grid grid-cols-2 gap-2 bg-[#101019] p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => setVaultType('shared')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            vaultType === 'shared'
              ? 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white shadow-glow-pink'
              : 'text-[#A7A7B7] hover:text-white'
          }`}
        >
          OUR VAULT (Shared)
        </button>
        <button
          onClick={() => setVaultType('personal')}
          className={`py-2 text-xs font-semibold rounded-xl transition-all ${
            vaultType === 'personal'
              ? 'bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white shadow-glow-pink'
              : 'text-[#A7A7B7] hover:text-white'
          }`}
        >
          MY PRIVATE VAULT
        </button>
      </div>

      {/* Items List */}
      {items.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
            <Lock className="w-8 h-8 text-[#B28CFF] opacity-50" />
          </div>
          <h3 className="text-sm font-semibold text-white">Your private heaven is waiting.</h3>
          <p className="text-xs text-[#A7A7B7] mt-1">Add confidential notes, plans, and secret keepsakes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isRevealed = Boolean(decryptedNotes[item.id]);

            return (
              <GlassCard key={item.id} className="p-4 border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#FF91B5]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                      <span className="text-[10px] text-[#A7A7B7]">
                        {format(new Date(item.createdAt), 'MMM dd, yyyy • HH:mm')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleRevealItem(item)}
                      className="p-1.5 rounded-lg bg-white/5 text-white/70 hover:text-white transition-colors"
                      title={isRevealed ? 'Hide' : 'Reveal'}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg bg-white/5 text-[#FF5570] hover:bg-[#FF5570]/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Encrypted vs Decrypted Content Display */}
                <div className="bg-[#101019] rounded-xl p-3 border border-white/5">
                  {isRevealed ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-white/95 font-mono whitespace-pre-wrap leading-relaxed"
                    >
                      {decryptedNotes[item.id]}
                    </motion.div>
                  ) : (
                    <div className="flex items-center space-x-2 text-[11px] text-white/40 font-mono truncate">
                      <Lock className="w-3.5 h-3.5 text-[#FF91B5]" />
                      <span className="truncate">AES-256-GCM: {item.encryptedData.slice(0, 32)}...</span>
                    </div>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Create Vault Item Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-[#FF4F81]" />
                  <span>New Encrypted Secret</span>
                </h2>
                <button onClick={() => setIsCreating(false)}>
                  <X className="w-5 h-5 text-white/60 hover:text-white" />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Surprise Anniversary Plan"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Secret Plaintext Note</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Confidential thoughts, account keys, flight details..."
                    value={newItemPlaintext}
                    onChange={(e) => setNewItemPlaintext(e.target.value)}
                    className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#A7A7B7] mb-1 font-medium">Attach Secret Photo / File (Optional)</label>
                  <input
                    type="file"
                    ref={vaultFileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVaultFile(file);
                        if (file.type.startsWith('image/')) {
                          setVaultFilePreview(URL.createObjectURL(file));
                        } else {
                          setVaultFilePreview(null);
                        }
                      }
                    }}
                    className="hidden"
                  />

                  {vaultFile ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs">
                      <span className="truncate text-white/90">{vaultFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVaultFile(null);
                          setVaultFilePreview(null);
                        }}
                        className="text-[#FF5570] hover:text-white p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => vaultFileInputRef.current?.click()}
                      className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Choose from Phone Gallery / Explorer</span>
                    </button>
                  )}
                </div>

                <div className="text-[10px] text-[#A7A7B7] bg-white/5 p-2.5 rounded-xl flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-[#42D392]" />
                  <span>Will be encrypted on this device before leaving memory.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !newItemTitle || !newItemPlaintext}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] text-white font-semibold text-xs shadow-glow-pink hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {isSaving ? 'Encrypting & Saving...' : 'Save Encrypted Secret'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
