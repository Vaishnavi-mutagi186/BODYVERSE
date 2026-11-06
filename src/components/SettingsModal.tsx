import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { soundManager } from '../audio/SoundManager';
import { X, Sliders, Volume2, VolumeX, Activity } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { settings, updateSettings, updateGestureSettings } = useGameStore();

  const handleVolumeChange = (key: 'masterVolume' | 'musicVolume' | 'sfxVolume', val: number) => {
    updateSettings({ [key]: val });
    soundManager.setConfig(
      key === 'masterVolume' ? val : settings.masterVolume,
      key === 'musicVolume' ? val : settings.musicVolume,
      key === 'sfxVolume' ? val : settings.sfxVolume,
      settings.isMuted
    );
  };

  const handleMuteToggle = () => {
    const nextMuted = !settings.isMuted;
    updateSettings({ isMuted: nextMuted });
    soundManager.setConfig(settings.masterVolume, settings.musicVolume, settings.sfxVolume, nextMuted);
    if (!nextMuted) soundManager.playCoin();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel-purple max-w-xl w-full p-6 md:p-8 rounded-3xl border-cyan-400/60 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/60 mb-6">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-black text-white tracking-wider">SYSTEM & MOTION TUNING</h2>
          </div>
          <button
            onClick={() => {
              soundManager.playCoin();
              onClose();
            }}
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Settings */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase font-black tracking-wider text-cyan-300 flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Audio Channels
            </span>
            <button
              onClick={handleMuteToggle}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg glass-panel text-xs font-bold text-slate-300 cursor-pointer"
            >
              {settings.isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{settings.isMuted ? 'Muted' : 'Unmuted'}</span>
            </button>
          </div>

          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Master Volume</span>
                <span className="text-cyan-400 font-mono">{Math.round(settings.masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.masterVolume}
                onChange={(e) => handleVolumeChange('masterVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Music Synth (BGM)</span>
                <span className="text-cyan-400 font-mono">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleVolumeChange('musicVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">SFX / Impact Volume</span>
                <span className="text-cyan-400 font-mono">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfxVolume', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* Gesture Recognition Tuning */}
        <section className="mb-6">
          <div className="text-xs uppercase font-black tracking-wider text-cyan-300 flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4" /> Gesture Sensitivity Sliders
          </div>

          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
            {/* Lane Hysteresis */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Lane Lean Sensitivity</span>
                <span className="text-cyan-400 font-mono">{settings.gestureSettings.laneHysteresis.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.06"
                max="0.22"
                step="0.01"
                value={settings.gestureSettings.laneHysteresis}
                onChange={(e) => updateGestureSettings({ laneHysteresis: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Jump Threshold */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Jump Rise Threshold</span>
                <span className="text-cyan-400 font-mono">{(settings.gestureSettings.jumpThreshold * 100).toFixed(0)}% Torso</span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.30"
                step="0.02"
                value={settings.gestureSettings.jumpThreshold}
                onChange={(e) => updateGestureSettings({ jumpThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Crouch Threshold */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Crouch / Slide Drop</span>
                <span className="text-cyan-400 font-mono">{(settings.gestureSettings.crouchThreshold * 100).toFixed(0)}% Torso</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.35"
                step="0.02"
                value={settings.gestureSettings.crouchThreshold}
                onChange={(e) => updateGestureSettings({ crouchThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Punch Elbow Angle */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Punch Elbow Extension Angle</span>
                <span className="text-cyan-400 font-mono">{settings.gestureSettings.punchThreshold}°</span>
              </div>
              <input
                type="range"
                min="130"
                max="165"
                step="1"
                value={settings.gestureSettings.punchThreshold}
                onChange={(e) => updateGestureSettings({ punchThreshold: parseInt(e.target.value, 10) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Dodge Velocity */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-slate-300">Dodge Sideways Burst Sensitivity</span>
                <span className="text-cyan-400 font-mono">{settings.gestureSettings.dodgeVelocityThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.25"
                max="0.80"
                step="0.05"
                value={settings.gestureSettings.dodgeVelocityThreshold}
                onChange={(e) => updateGestureSettings({ dodgeVelocityThreshold: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            onClick={() => {
              soundManager.playCoin();
              onClose();
            }}
            className="neon-btn px-6 py-2.5 rounded-xl font-bold text-white text-sm cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
