import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Background3DScene } from '../game/scenes/Background3DScene';
import { soundManager } from '../audio/SoundManager';
import { ArrowLeft, Play, Lock, Zap, Shield, Swords, Award } from 'lucide-react';

export const ModeSelectPage: React.FC = () => {
  const { setScreen, highScores, difficulty, inputMethod } = useGameStore();

  const handleSelectShadowNinja = () => {
    soundManager.playPunch();
    setScreen('gameplay');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between text-white select-none">
      <Background3DScene />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <button
          onClick={() => {
            soundManager.playCoin();
            setScreen('setup');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-cyan-400/50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span>Back</span>
        </button>
        <div className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500">
          SELECT MISSION MODE
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 px-3 py-1.5 rounded-xl glass-panel">
          <Award className="w-4 h-4 text-amber-400" />
          <span>High Score: {highScores[difficulty] || 0}</span>
        </div>
      </header>

      {/* Mode Cards Grid */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* Mode 1: Shadow Ninja (Active & Primary) */}
          <div className="glass-panel-purple border-cyan-400/70 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-cyan-500/20 group hover:border-cyan-300 transition-all">
            <div className="absolute top-0 right-0 px-4 py-1 bg-gradient-to-l from-cyan-500 to-transparent text-[11px] font-black uppercase tracking-widest text-black">
              PRIMARY MODE
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-5 text-cyan-300 group-hover:scale-110 transition-transform">
                <Swords className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                Shadow Ninja
              </h3>
              <p className="text-xs font-semibold text-cyan-400 mt-1 uppercase tracking-wider">
                3-Lane Combat Runner
              </p>
              <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                Run through cyber-feudal Kyoto. Switch lanes with body leans, leap over spike barricades,
                slide under plasma beams, strike cyber-guards, and unleash shockwaves.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
                  {inputMethod === 'pose' ? '📷 Webcam Vision' : '⌨️ Keyboard Ready'}
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300">
                  Boss Milestone
                </span>
              </div>
            </div>

            <button
              onClick={handleSelectShadowNinja}
              className="mt-8 neon-btn w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 text-base shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>START MISSION</span>
            </button>
          </div>

          {/* Mode 2: Dragon Rider (Stretch Goal / Coming Soon) */}
          <div className="glass-panel p-6 rounded-3xl opacity-80 border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
              <Lock className="w-3 h-3" /> COMING SOON
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-5 text-amber-400">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-200">Dragon Rider</h3>
              <p className="text-xs font-semibold text-amber-400/80 mt-1 uppercase tracking-wider">
                Aerial Wingspan Flight
              </p>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Spread your arms as dragon wings to soar through sky chasms, bank around floating islands,
                and breathe cyber flame on target rings.
              </p>
            </div>

            <button
              disabled
              className="mt-8 w-full py-4 rounded-2xl bg-slate-800/60 border border-slate-700 font-bold text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>LOCKED • CHAPTER II</span>
            </button>
          </div>

          {/* Mode 3: Superhero Rescue (Stretch Goal / Coming Soon) */}
          <div className="glass-panel p-6 rounded-3xl opacity-80 border-slate-700/80 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[10px] font-bold">
              <Lock className="w-3 h-3" /> COMING SOON
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mb-5 text-pink-400">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-200">Superhero Rescue</h3>
              <p className="text-xs font-semibold text-pink-400/80 mt-1 uppercase tracking-wider">
                Deflection & Rescue
              </p>
              <p className="text-sm text-slate-400 mt-4 leading-relaxed">
                Use your palms to project forcefields, intercept falling debris, and deflect laser salvo
                barrages to protect the metropolis.
              </p>
            </div>

            <button
              disabled
              className="mt-8 w-full py-4 rounded-2xl bg-slate-800/60 border border-slate-700 font-bold text-slate-500 flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              <span>LOCKED • CHAPTER III</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-slate-500">
        Choose your destiny • All modes leverage Bodyverse Zero-Latency Pose Engine
      </footer>
    </div>
  );
};
