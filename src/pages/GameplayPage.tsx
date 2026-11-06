import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ShadowNinjaGame } from '../game/scenes/ShadowNinjaGame';
import { KeyboardInputProvider } from '../input/KeyboardInputProvider';
import { PoseInputProvider } from '../input/PoseInputProvider';
import { PoseTracker } from '../vision/poseTracker/PoseTracker';
import { CameraSkeletonOverlay } from '../components/CameraSkeletonOverlay';
import { soundManager } from '../audio/SoundManager';
import type { InputProvider } from '../input/InputTypes';
import type { Point3D } from '../vision/smoothing/OneEuroFilter';
import { SettingsModal } from '../components/SettingsModal';
import {
  Heart,
  Coins,
  Shield,
  Zap,
  Pause,
  Play,
  RotateCcw,
  Home,
  Camera,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
} from 'lucide-react';

interface HUDData {
  health: number;
  score: number;
  coins: number;
  distance: number;
  specialMeter: number;
  shieldActive: boolean;
  shieldCooldown: number;
  fps: number;
}

export const GameplayPage: React.FC = () => {
  const {
    isPaused,
    setPaused,
    setScreen,
    difficulty,
    inputMethod,
    settings,
    activeGestureName,
    activeGestureTime,
    trackingLost,
    setTrackingLost,
  } = useGameStore();

  const [hud, setHud] = useState<HUDData>({
    health: 100,
    score: 0,
    coins: 0,
    distance: 0,
    specialMeter: 0,
    shieldActive: false,
    shieldCooldown: 0,
    fps: 60,
  });

  const [showCornerCamera, setShowCornerCamera] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [landmarks, setLandmarks] = useState<Point3D[] | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<PoseTracker | null>(null);

  // Default calibrated baseline
  const poseProvider = useMemo(() => {
    return new PoseInputProvider(
      {
        neutralShoulderCenterX: 0.5,
        neutralHipCenterY: 0.55,
        shoulderWidth: 0.22,
        torsoLength: 0.35,
        standingHipHeight: 0.55,
        isCalibrated: true,
      },
      settings.gestureSettings
    );
  }, [settings.gestureSettings]);

  const keyboardProvider = useMemo(() => new KeyboardInputProvider(), []);

  const activeProvider: InputProvider = inputMethod === 'pose' ? poseProvider : keyboardProvider;

  // Initialize Pose Tracker if pose method is active
  useEffect(() => {
    if (inputMethod !== 'pose') return;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    const tracker = new PoseTracker();
    trackerRef.current = tracker;

    tracker
      .initialize(video, {
        onPose: (pts, ts) => {
          setLandmarks(pts);
          poseProvider.onNewPose(pts, ts);
        },
        onTrackingLost: (lost) => {
          setTrackingLost(lost);
          if (lost) {
            setPaused(true);
          } else {
            // Auto-resume when player steps back into frame
            setPaused(false);
          }
        },
        onError: (err) => {
          console.error('Pose tracker error:', err);
        },
      })
      .catch((err) => {
        console.error('Camera stream error:', err);
      });

    return () => {
      tracker.stop();
    };
  }, [inputMethod, poseProvider, setPaused, setTrackingLost]);

  const handleUpdateHUD = useCallback((data: HUDData) => {
    setHud(data);
  }, []);

  const handleGameOver = useCallback(() => {
    soundManager.playHit();
    setScreen('results');
  }, [setScreen]);

  const togglePause = () => {
    soundManager.playCoin();
    setPaused(!isPaused);
  };

  const isGestureFlashActive = Date.now() - activeGestureTime < 800;

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-black text-white">
      {/* 3D WebGL Game Canvas */}
      <ShadowNinjaGame
        inputProvider={activeProvider}
        onUpdateHUD={handleUpdateHUD}
        onGameOver={handleGameOver}
      />

      {/* CORNER DOCKED WEBCAM PREVIEW (Small, mirrored, semi-transparent, never covers gameplay) */}
      {inputMethod === 'pose' && (
        <div className="absolute bottom-6 right-6 z-30 flex flex-col items-end gap-2">
          {showCornerCamera && (
            <div className="w-56 h-42 transition-all">
              <CameraSkeletonOverlay
                landmarks={landmarks}
                videoRef={videoRef}
                width={224}
                height={168}
                activeGesture={activeGestureName}
                trackingLost={trackingLost}
              />
            </div>
          )}

          <button
            onClick={() => setShowCornerCamera(!showCornerCamera)}
            className="px-3 py-1.5 rounded-xl glass-panel text-[11px] font-semibold text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            {showCornerCamera ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{showCornerCamera ? 'Hide Vision Feed' : 'Show Vision Feed'}</span>
          </button>
        </div>
      )}

      {/* TRACKING LOSS OVERLAY MODAL */}
      {trackingLost && inputMethod === 'pose' && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel-purple max-w-sm w-full p-8 rounded-3xl border-rose-500 text-center animate-pulse">
            <AlertCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-rose-300 mb-2">TRACKING PAUSED</h2>
            <p className="text-sm text-slate-200 mb-4 leading-relaxed">
              Step back into the webcam frame. The game will automatically resume once your body is detected.
            </p>
            <button
              onClick={() => {
                setTrackingLost(false);
                setPaused(false);
              }}
              className="mt-2 text-xs text-cyan-400 underline cursor-pointer"
            >
              Resume Manually
            </button>
          </div>
        </div>
      )}

      {/* TOP HUD BAR */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-start justify-between pointer-events-none z-20">
        {/* Left: Health & Shield */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
          {/* Health Bar */}
          <div className="glass-panel p-3 rounded-2xl flex items-center gap-3 w-64 shadow-lg shadow-black/40">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs font-black tracking-wider mb-1">
                <span className="text-slate-300">HP</span>
                <span className={hud.health < 35 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}>
                  {Math.round(hud.health)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${
                    hud.health < 35
                      ? 'bg-rose-500 shadow-md shadow-rose-500/50'
                      : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                  }`}
                  style={{ width: `${hud.health}%` }}
                />
              </div>
            </div>
          </div>

          {/* Shield Status Badge */}
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                hud.shieldActive
                  ? 'glass-panel border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/30 animate-pulse'
                  : hud.shieldCooldown > 0
                  ? 'bg-slate-900/60 border-slate-700 text-slate-500'
                  : 'glass-panel border-slate-600 text-slate-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span className="text-xs font-bold">
                {hud.shieldActive
                  ? 'SHIELD ACTIVE'
                  : hud.shieldCooldown > 0
                  ? `CD: ${hud.shieldCooldown.toFixed(1)}s`
                  : inputMethod === 'pose'
                  ? 'SHIELD READY (T-POSE)'
                  : 'SHIELD READY (K)'}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Score & Distance */}
        <div className="flex flex-col items-center">
          <div className="text-4xl md:text-5xl font-black tracking-tight text-white neon-text-cyan drop-shadow-md">
            {hud.score.toLocaleString()}
          </div>
          <div className="flex items-center gap-3 text-xs font-bold text-slate-300 mt-1">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-slate-700">
              {hud.distance}m
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 uppercase">
              {difficulty}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">{hud.fps} FPS</span>
            {inputMethod === 'pose' && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-300">
                <Camera className="w-3 h-3 text-cyan-400" /> AI Pose
              </span>
            )}
          </div>
        </div>

        {/* Right: Coins, Controls & Pause */}
        <div className="flex items-center gap-3 pointer-events-auto">
          {/* Coins */}
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-lg">
            <Coins className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-black text-amber-300 text-base">{hud.coins}</span>
          </div>

          {/* Pause Button */}
          <button
            onClick={togglePause}
            className="p-3 rounded-2xl glass-panel hover:border-cyan-400/60 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Pause Game"
          >
            {isPaused ? <Play className="w-5 h-5 fill-white" /> : <Pause className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* GESTURE ACTION FEEDBACK NOTIFICATION */}
      {isGestureFlashActive && activeGestureName && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
          <div className="px-5 py-2 rounded-full glass-panel-purple border-cyan-400 text-cyan-300 font-black text-sm tracking-widest uppercase flex items-center gap-2 shadow-xl shadow-cyan-500/30">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>{activeGestureName}</span>
          </div>
        </div>
      )}

      {/* BOTTOM HUD: SPECIAL POWER METER & CONTROLS HELPER */}
      <div className="absolute bottom-6 left-0 right-0 px-6 flex flex-col items-center gap-3 pointer-events-none z-20">
        {/* Special Meter Bar */}
        <div className="max-w-md w-full glass-panel p-3.5 rounded-2xl pointer-events-auto flex items-center gap-3 shadow-xl">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              hud.specialMeter >= 100
                ? 'bg-fuchsia-500 text-black shadow-lg shadow-fuchsia-500/50 animate-pulse'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Zap className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-black tracking-wider mb-1">
              <span className={hud.specialMeter >= 100 ? 'text-fuchsia-400 animate-pulse' : 'text-slate-300'}>
                {hud.specialMeter >= 100
                  ? inputMethod === 'pose'
                    ? '⚡ SHOCKWAVE READY (HANDS UP)'
                    : '⚡ SHOCKWAVE READY (PRESS L)'
                  : 'SPECIAL METER'}
              </span>
              <span className="text-slate-400">{Math.round(hud.specialMeter)}%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  hud.specialMeter >= 100
                    ? 'bg-gradient-to-r from-purple-400 to-pink-500 shadow-md shadow-pink-500/50'
                    : 'bg-gradient-to-r from-purple-600 to-cyan-500'
                }`}
                style={{ width: `${hud.specialMeter}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Controls Legend */}
        <div className="text-[11px] text-slate-400 font-medium px-4 py-1.5 rounded-full bg-slate-950/70 border border-slate-800">
          {inputMethod === 'pose'
            ? 'Lean: Lane • Hop: Jump • Duck: Slide • Thrust Fist: Punch • T-Pose: Shield • Hands Up: Shockwave'
            : 'A/D: Lane • W/Space: Jump • S: Slide • J: Punch • K: Shield • L: Shockwave'}
        </div>
      </div>

      {/* PAUSE OVERLAY MODAL */}
      {isPaused && !trackingLost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-purple max-w-sm w-full p-8 rounded-3xl border-cyan-400 text-center relative shadow-2xl">
            <h2 className="text-3xl font-black text-white tracking-wider mb-6">GAME PAUSED</h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPaused(false)}
                className="neon-btn py-3.5 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>Resume Action</span>
              </button>

              <button
                onClick={() => {
                  setPaused(false);
                  soundManager.playPunch();
                  setScreen('gameplay');
                }}
                className="glass-panel py-3.5 px-6 rounded-xl font-bold text-slate-200 hover:text-white hover:border-cyan-400/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-5 h-5 text-cyan-400" />
                <span>Restart Run</span>
              </button>

              <button
                onClick={() => setShowSettings(true)}
                className="glass-panel py-3.5 px-6 rounded-xl font-bold text-slate-200 hover:text-white hover:border-cyan-400/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>Motion & Audio Tuning</span>
              </button>

              <button
                onClick={() => {
                  setPaused(false);
                  soundManager.playCoin();
                  setScreen('modeSelect');
                }}
                className="glass-panel py-3.5 px-6 rounded-xl font-bold text-slate-400 hover:text-rose-400 hover:border-rose-500/50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Home className="w-5 h-5" />
                <span>Quit to Mode Select</span>
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
