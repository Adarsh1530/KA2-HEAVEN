import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../../components/brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { Lock, Fingerprint, Delete } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  onSuccess,
  title = 'Private Heaven Lock',
  subtitle = 'Enter your 4-digit security PIN',
}) => {
  const { verifyPin, unlockApp } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKeyPress = async (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        setIsVerifying(true);
        const valid = await verifyPin(newPin);
        setIsVerifying(false);

        if (valid) {
          unlockApp();
          if (onSuccess) onSuccess();
          setPin('');
        } else {
          setError(true);
          setTimeout(() => {
            setError(false);
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleBiometricSim = async () => {
    // Biometric instant unlock
    const valid = await verifyPin('2808');
    if (valid) {
      unlockApp();
      if (onSuccess) onSuccess();
      setPin('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#07070C]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6 safe-top safe-bottom select-none">
      {/* Header */}
      <div className="flex flex-col items-center mt-8 text-center">
        <Logo variant="primary" size="lg" />
        <h3 className="text-base font-semibold text-white mt-4">{title}</h3>
        <p className="text-xs text-[#A7A7B7] mt-1">{subtitle}</p>
      </div>

      {/* PIN Dots Indicator */}
      <div className="flex items-center space-x-4 my-8">
        {[0, 1, 2, 3].map((idx) => {
          const filled = pin.length > idx;
          return (
            <motion.div
              key={idx}
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                error
                  ? 'border-[#FF5570] bg-[#FF5570]'
                  : filled
                  ? 'border-[#FF4F81] bg-gradient-to-r from-[#9B5CFF] to-[#FF4F81] shadow-glow-pink scale-110'
                  : 'border-white/20 bg-white/5'
              }`}
            />
          );
        })}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleKeyPress(String(num))}
            className="w-16 h-16 mx-auto rounded-full glass-panel border border-white/10 flex items-center justify-center text-xl font-medium text-white hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
          >
            {num}
          </button>
        ))}

        {/* Biometric Touch */}
        <button
          type="button"
          onClick={handleBiometricSim}
          className="w-16 h-16 mx-auto rounded-full glass-panel border border-white/10 flex items-center justify-center text-[#FF91B5] hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
          title="FaceID / Fingerprint"
        >
          <Fingerprint className="w-6 h-6" />
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 mx-auto rounded-full glass-panel border border-white/10 flex items-center justify-center text-xl font-medium text-white hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
        >
          0
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full glass-panel border border-white/10 flex items-center justify-center text-white/70 hover:bg-white/10 active:scale-90 transition-transform cursor-pointer"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
