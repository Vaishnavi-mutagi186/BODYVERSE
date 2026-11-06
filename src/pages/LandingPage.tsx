import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Background3DScene } from '../game/scenes/Background3DScene';
import { soundManager } from '../audio/SoundManager';
import { SettingsModal } from '../components/SettingsModal';
import { Play, HelpCircle, Sparkles, Shield, Zap, Swords, ChevronRight, Eye, Volume2, VolumeX, Sliders } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setScreen, settings, updateSettings } = useGameStore();
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleStart = () => {
    soundManager.startBGM();
    soundManager.playPunch();
    setScreen('setup');
  };

  const toggleSound = () => {
    const nextMuted = !settings.isMuted;
    updateSettings({ isMuted: nextMuted });
    soundManager.setConfig(settings.masterVolume, settings.musicVolume, settings.sfxVolume, nextMuted);
    if (!nextMuted) {
      soundManager.playCoin();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between text-white select-none">
      {/* 3D Cinematic Canvas */}
      <Background3DScene />

      {/* Top Navigation */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Swords className="w-6 h-6 text-black" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500">
              BODYVERSE
            </span>
            <span className="text-xs ml-2 px-2 py-0.5 rounded-full border border-cyan-500/40 text-cyan-300 bg-cyan-950/40">
              3D AI MOTION
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSettings(true)}
            className="p-3 rounded-xl glass-panel text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50 transition-all cursor-pointer"
            title="Settings & Tuning"
          >
            <Sliders className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSound}
            className="p-3 rounded-xl glass-panel text-slate-300 hover:text-cyan-400 hover:border-cyan-400/50 transition-all cursor-pointer"
            title="Toggle Sound"
          >
            {settings.isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowHowToPlay(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-panel text-sm font-medium hover:border-cyan-400/60 hover:text-cyan-300 transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>How to Play</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wide uppercase mb-6 animate-pulse-glow">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Zero Controller • Webcam Vision • True 3D Action
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
          Your Body. <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 neon-text-cyan">
            Your Moves. Your Adventure.
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
          Step into a cyber-feudal realm. Lean to switch lanes, jump over deadly spikes, slide under lasers,
          throw punches to smash enemies, and raise your hands to summon mystical powers.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-5">
          <button
            onClick={handleStart}
            className="neon-btn group flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-white shadow-xl shadow-cyan-500/20 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-white text-white group-hover:scale-110 transition-transform" />
            <span>ENTER THE BODYVERSE</span>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="px-6 py-4 rounded-2xl glass-panel hover:border-purple-400/50 hover:bg-purple-950/30 text-slate-200 font-semibold transition-all cursor-pointer flex items-center gap-2"
          >
            <Eye className="w-5 h-5 text-purple-400" />
            <span>View Gestures</span>
          </button>
        </div>

        {/* Feature Badges */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          <div className="glass-panel p-3.5 rounded-xl flex items-center gap-3">
            <Zap className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">30-60 FPS</div>
              <div className="text-[10px] text-slate-400">Low-latency tracking</div>
            </div>
          </div>
          <div className="glass-panel p-3.5 rounded-xl flex items-center gap-3">
            <Shield className="w-5 h-5 text-purple-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Full Privacy</div>
              <div className="text-[10px] text-slate-400">100% on-device AI</div>
            </div>
          </div>
          <div className="glass-panel p-3.5 rounded-xl flex items-center gap-3">
            <Swords className="w-5 h-5 text-pink-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Shadow Ninja</div>
              <div className="text-[10px] text-slate-400">Combat endless runner</div>
            </div>
          </div>
          <div className="glass-panel p-3.5 rounded-xl flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Keyboard Backup</div>
              <div className="text-[10px] text-slate-400">Always playable</div>
            </div>
          </div>
        </div>
      </main>

      {/* Mode Previews Footer */}
      <footer className="relative z-10 w-full px-8 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mode 1 */}
          <div className="glass-panel-purple p-4 rounded-2xl border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-cyan-300">Shadow Ninja</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">READY</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">3-Lane dynamic ninja runner with martial combat & power surges.</p>
            </div>
          </div>

          {/* Mode 2 */}
          <div className="glass-panel p-4 rounded-2xl opacity-75 border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-300">Dragon Rider</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">COMING SOON</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Wingspan flight control through canyon checkpoints & aerial fire.</p>
            </div>
          </div>

          {/* Mode 3 */}
          <div className="glass-panel p-4 rounded-2xl opacity-75 border-slate-700 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-300">Superhero Rescue</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">COMING SOON</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Deflect incoming laser attacks and catch falling civilians in midair.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* How To Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-purple max-w-2xl w-full p-6 md:p-8 rounded-3xl border-cyan-500/40 relative">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Zap className="text-cyan-400 w-6 h-6" />
              Body Gestures & Controls
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Stand 4-7 feet away from your webcam so your torso and wrists are visible.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-cyan-300 font-bold text-sm">↔ Lean Left / Right</div>
                <div className="text-xs text-slate-300 mt-1">Shift your torso sideways to switch between the 3 lanes. (Keyboard: A/D or Left/Right)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-cyan-300 font-bold text-sm">↑ Jump</div>
                <div className="text-xs text-slate-300 mt-1">Hop upward to leap over spike barriers and pits. (Keyboard: W or Space)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-cyan-300 font-bold text-sm">↓ Crouch / Slide</div>
                <div className="text-xs text-slate-300 mt-1">Squat or duck low to slide under high lasers and archways. (Keyboard: S or Down)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-cyan-300 font-bold text-sm">🥊 Punch Strike</div>
                <div className="text-xs text-slate-300 mt-1">Thrust either fist forward with speed to defeat cyber guards. (Keyboard: J or F)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-cyan-300 font-bold text-sm">🛡️ Energy Shield</div>
                <div className="text-xs text-slate-300 mt-1">Spread both arms horizontally (T-Pose) for 300ms to activate invulnerability. (Keyboard: K or E)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
                <div className="text-cyan-300 font-bold text-sm">⚡ Special Shockwave</div>
                <div className="text-xs text-slate-300 mt-1">Raise both hands high above your head to trigger a full-screen clearance blast! (Keyboard: L or Q)</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHowToPlay(false)}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm cursor-pointer transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Settings Modal */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
};
