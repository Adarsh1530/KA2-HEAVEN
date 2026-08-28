import React, { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';
import { MobileDevicePreview } from '../components/MobileDevicePreview';
import { AppSettings, INITIAL_APP_SETTINGS } from '@ka2/shared';
import { Palette, Save, Check, Sparkles, Sliders, Smartphone, RefreshCw } from 'lucide-react';

export const ThemeCustomizer: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(INITIAL_APP_SETTINGS);
  const [previewTab, setPreviewTab] = useState<'home' | 'chat'>('home');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const remote = await adminApi.getSettings();
        setSettings(remote);
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (key: keyof AppSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Palette className="w-6 h-6 text-[#FF4F81]" />
            <span>Theme & Branding Customizer</span>
          </h1>
          <p className="text-sm text-[#A7A7B7]">
            Customize KA² brand palette, typography, particle density and live mobile experience
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#9B5CFF] via-[#FF4F81] to-[#FF91B5] text-white font-semibold text-xs shadow-glow-pink hover:opacity-95 disabled:opacity-50 flex items-center space-x-2 transition-all cursor-pointer"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span>Published Live!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Publish Live</span>
            </>
          )}
        </button>
      </div>

      {/* Main Grid: Left Controls Form vs Right Live Device Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Customizer Controls (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          {/* 1. Brand Identity */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#FF4F81]" />
              <span>Brand Identity & Taglines</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A7A7B7] mb-1">
                  Application Full Name
                </label>
                <input
                  type="text"
                  value={settings.appName}
                  onChange={(e) => handleChange('appName', e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A7A7B7] mb-1">
                  Short Brand Monogram
                </label>
                <input
                  type="text"
                  value={settings.shortBrandMark}
                  onChange={(e) => handleChange('shortBrandMark', e.target.value)}
                  className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#FF4F81]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A7A7B7] mb-1">
                Primary Brand Tagline
              </label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#A7A7B7] mb-1">
                Secondary Romantic Tagline
              </label>
              <input
                type="text"
                value={settings.secondaryTagline}
                onChange={(e) => handleChange('secondaryTagline', e.target.value)}
                className="w-full bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF4F81]"
              />
            </div>
          </div>

          {/* 2. Color Palette & Aesthetics */}
          <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Palette className="w-4 h-4 text-[#9B5CFF]" />
              <span>Color Palette & Accents</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#A7A7B7] mb-1">
                  Primary Accent Color (Rose)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                    className="flex-1 bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A7A7B7] mb-1">
                  Secondary Accent Color (Deep Violet)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                    className="flex-1 bg-[#101019] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#FF4F81]"
                  />
                </div>
              </div>
            </div>

            {/* Particle Intensity Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-[#A7A7B7]">
                  3D Particle Connection Speed & Intensity: {settings.particleIntensity}x
                </label>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.particleIntensity}
                onChange={(e) => handleChange('particleIntensity', parseFloat(e.target.value))}
                className="w-full accent-[#FF4F81] cursor-pointer"
              />
            </div>

            {/* Theme Mode Selector */}
            <div>
              <label className="block text-xs font-medium text-[#A7A7B7] mb-1.5">
                Default Theme Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('themeMode', 'dark')}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    settings.themeMode === 'dark'
                      ? 'bg-gradient-to-r from-[#9B5CFF]/30 to-[#FF4F81]/30 border-[#FF4F81] text-white shadow-glow-pink'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  🌌 Dark Romantic Luxury
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('themeMode', 'light')}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    settings.themeMode === 'light'
                      ? 'bg-white text-black font-bold border-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  ✨ Light Heaven
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Right Column: Live Interactive Device Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="flex items-center justify-between w-full max-w-[340px] mb-3">
            <span className="text-xs font-bold text-white flex items-center space-x-1.5">
              <Smartphone className="w-4 h-4 text-[#FF4F81]" />
              <span>Realtime Device Preview</span>
            </span>

            {/* Screen Tab Switcher */}
            <div className="flex items-center space-x-1 bg-[#101019] p-1 rounded-xl border border-white/10 text-[10px]">
              <button
                type="button"
                onClick={() => setPreviewTab('home')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                  previewTab === 'home' ? 'bg-[#FF4F81] text-white' : 'text-white/60'
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('chat')}
                className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                  previewTab === 'chat' ? 'bg-[#FF4F81] text-white' : 'text-white/60'
                }`}
              >
                Chat
              </button>
            </div>
          </div>

          <MobileDevicePreview settings={settings} previewScreen={previewTab} />
        </div>
      </div>
    </div>
  );
};
