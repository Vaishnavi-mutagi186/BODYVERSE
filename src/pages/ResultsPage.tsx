import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Background3DScene } from '../game/scenes/Background3DScene';
import { soundManager } from '../audio/SoundManager';
import { Trophy, Coins, Swords, Route, Clock, RotateCcw, Home, Sparkles } from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const { lastRunStats, highScores, difficulty, setScreen } = useGameStore();
  const currentHigh = highScores[difficulty] || 0;
  const isNewHighScore = lastRunStats.score >= currentHigh && lastRunStats.score > 0;

  const handleRetry = () => {
    soundManager.playPunch();
    setScreen('gameplay');
  };

  const handleHome = () => {
    soundManager.playCoin();
    setScreen('modeSelect');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between text-white select-none">
      <Background3DScene />

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full my-auto">
        <div className="glass-panel-purple border-cyan-400 p-8 rounded-3xl w-full shadow-2xl relative overflow-hidden text-center">
          {/* Header Banner */}
          {isNewHighScore && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 animate-pulse">
              <Sparkles className="w-4 h-4 text-amber-400" />
              NEW HIGH SCORE RECORD!
            </div>
          )}

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
            MISSION REPORT
          </h1>
          <p className="text-sm text-cyan-300 font-semibold uppercase tracking-wider mt-1">
            SHADOW RUNNER • {difficulty.toUpperCase()} SECTOR
          </p>

          {/* Primary Score */}
          <div className="my-6 py-4 px-6 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Score
            </div>
            <div className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-500 neon-text-cyan my-1">
              {lastRunStats.score.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Personal Best: {currentHigh.toLocaleString()}</span>
            </div>
          </div>

          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Coins className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <div className="text-base font-extrabold text-white">{lastRunStats.coins}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Coins Grabbed</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Swords className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <div className="text-base font-extrabold text-white">{lastRunStats.enemiesDefeated}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Guards Smashed</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Route className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <div className="text-base font-extrabold text-white">{lastRunStats.distance}m</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Distance Covered</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <div className="text-base font-extrabold text-white">{lastRunStats.timeAlive}s</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Survival Time</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleRetry}
              className="flex-1 neon-btn py-4 rounded-xl font-black text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <RotateCcw className="w-5 h-5" />
              <span>PLAY AGAIN</span>
            </button>

            <button
              onClick={handleHome}
              className="flex-1 glass-panel py-4 rounded-xl font-bold text-slate-300 hover:text-white hover:border-cyan-400/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>MODE SELECT</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
