import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { Difficulty } from '../store/useGameStore';
import { Background3DScene } from '../game/scenes/Background3DScene';
import { soundManager } from '../audio/SoundManager';
import { ArrowLeft, Camera, Keyboard, Sparkles, Check, Play, User, Flame } from 'lucide-react';

const CHARACTERS = [
  {
    id: 'cyber_ninja',
    name: 'KAGE (Shadow Ninja)',
    tag: 'Agile & Precision',
    description: 'Master of lightning strikes and dimensional shifting. Best balanced speed and agility.',
    color: '#00f0ff',
  },
  {
    id: 'plasma_ronin',
    name: 'RAIDEN (Plasma Ronin)',
    tag: 'Heavy Defense & Force',
    description: 'Cybernetic warrior wielding twin kinetic blade emitters. Increased shield duration.',
    color: '#a855f7',
  },
  {
    id: 'neon_spectre',
    name: 'HOTARU (Neon Spectre)',
    tag: 'Rapid Special Charge',
    description: 'Bio-luminescent phantom runner. Special power fills 20% faster.',
    color: '#f43f5e',
  },
];

export const PlayerSetupPage: React.FC = () => {
  const {
    playerName,
    setPlayerName,
    selectedCharacter,
    setSelectedCharacter,
    difficulty,
    setDifficulty,
    inputMethod,
    setInputMethod,
    setScreen,
  } = useGameStore();

  const [hasCameraAccess, setHasCameraAccess] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const checkCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setHasCameraAccess(true);
      // Clean up test stream
      stream.getTracks().forEach((track) => track.stop());
      soundManager.playCoin();
    } catch (err: unknown) {
      setHasCameraAccess(false);
      setCameraError((err as Error).message || 'Webcam permission was denied or device not found.');
    }
  };

  const handleProceed = () => {
    soundManager.playPunch();
    if (inputMethod === 'pose') {
      setScreen('calibration');
    } else {
      setScreen('modeSelect');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between text-white select-none">
      <Background3DScene />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <button
          onClick={() => {
            soundManager.playCoin();
            setScreen('landing');
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-slate-300 hover:text-white hover:border-cyan-400/50 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-cyan-400" />
          <span>Back</span>
        </button>
        <div className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
          WARRIOR CONFIGURATION
        </div>
        <div className="w-24"></div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-6 py-4 flex flex-col justify-center overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Player & Character */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Player Name Card */}
            <div className="glass-panel p-5 rounded-2xl">
              <label className="text-xs uppercase font-bold tracking-wider text-cyan-300 flex items-center gap-2 mb-2">
                <User className="w-4 h-4" /> Codename / Player ID
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 18))}
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-cyan-400 px-4 py-3 rounded-xl text-lg font-bold text-white outline-none transition-colors"
                placeholder="Enter Ninja Codename"
              />
            </div>

            {/* Character Selection */}
            <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col">
              <label className="text-xs uppercase font-bold tracking-wider text-cyan-300 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" /> Select Avatar
              </label>
              <div className="flex flex-col gap-3">
                {CHARACTERS.map((char) => {
                  const isSelected = selectedCharacter === char.id;
                  return (
                    <div
                      key={char.id}
                      onClick={() => {
                        soundManager.playCoin();
                        setSelectedCharacter(char.id);
                      }}
                      className={`p-4 rounded-xl cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-900/40 border-slate-700/60 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-base" style={{ color: char.color }}>
                          {char.name}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {char.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{char.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Difficulty */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Input Method */}
            <div className="glass-panel p-5 rounded-2xl">
              <label className="text-xs uppercase font-bold tracking-wider text-cyan-300 flex items-center gap-2 mb-3">
                Input Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCoin();
                    setInputMethod('pose');
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    inputMethod === 'pose'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Camera className="w-6 h-6" />
                  <span className="font-bold text-xs">Body Motion (AI)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundManager.playCoin();
                    setInputMethod('keyboard');
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                    inputMethod === 'keyboard'
                      ? 'bg-cyan-950/50 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <Keyboard className="w-6 h-6" />
                  <span className="font-bold text-xs">Keyboard Controls</span>
                </button>
              </div>

              {/* Camera permission check status */}
              {inputMethod === 'pose' && (
                <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                  {hasCameraAccess === true ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <Check className="w-4 h-4" /> Camera Ready & Connected
                    </div>
                  ) : cameraError ? (
                    <div className="text-rose-400 flex flex-col gap-1.5">
                      <span>{cameraError}</span>
                      <button
                        onClick={checkCamera}
                        className="text-cyan-400 underline font-semibold text-left cursor-pointer"
                      >
                        Retry Permission Check
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Verify webcam access:</span>
                      <button
                        onClick={checkCamera}
                        className="px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold hover:bg-cyan-500/30 cursor-pointer transition-all"
                      >
                        Test Camera
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Difficulty */}
            <div className="glass-panel p-5 rounded-2xl">
              <label className="text-xs uppercase font-bold tracking-wider text-cyan-300 flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4" /> Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'hard', 'master'] as Difficulty[]).map((diff) => {
                  const isSelected = difficulty === diff;
                  return (
                    <button
                      key={diff}
                      onClick={() => {
                        soundManager.playCoin();
                        setDifficulty(diff);
                      }}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer transition-all ${
                        isSelected
                          ? diff === 'normal'
                            ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                            : diff === 'hard'
                            ? 'bg-amber-950/60 border-amber-400 text-amber-300 shadow-md shadow-amber-500/20'
                            : 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-md shadow-rose-500/20'
                          : 'bg-slate-900/40 border-slate-700/60 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {diff}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={handleProceed}
              className="mt-auto neon-btn group py-4 px-6 rounded-2xl font-black text-white text-base flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <span>{inputMethod === 'pose' ? 'PROCEED TO CALIBRATION' : 'PROCEED TO MODE SELECT'}</span>
              <Play className="w-5 h-5 fill-white" />
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-slate-300">
        BODYVERSE • Next-Gen AI Motion Tracking System
      </footer>
    </div>
  );
};
