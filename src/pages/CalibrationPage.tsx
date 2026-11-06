import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { PoseTracker } from '../vision/poseTracker/PoseTracker';
import { PoseCalibration } from '../vision/calibration/PoseCalibration';
import { GestureRecognizer } from '../vision/gestures/GestureRecognizer';
import type { RecognizedGestures } from '../vision/gestures/GestureRecognizer';
import { CameraSkeletonOverlay } from '../components/CameraSkeletonOverlay';
import { soundManager } from '../audio/SoundManager';
import type { Point3D } from '../vision/smoothing/OneEuroFilter';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  Keyboard,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const CalibrationPage: React.FC = () => {
  const { setScreen, settings, setInputMethod } = useGameStore();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const trackerRef = useRef<PoseTracker | null>(null);
  const calibrationRef = useRef<PoseCalibration>(new PoseCalibration());
  const recognizerRef = useRef<GestureRecognizer>(new GestureRecognizer());

  const [landmarks, setLandmarks] = useState<Point3D[] | null>(null);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [trackingLost, setTrackingLost] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeGesture, setActiveGesture] = useState<string | null>(null);

  // Guided test moves checklist
  const [testedMoves, setTestedMoves] = useState({
    leanLeft: false,
    leanRight: false,
    jump: false,
    crouch: false,
    punch: false,
    shield: false,
    special: false,
  });

  const [stableTrackingTime, setStableTrackingTime] = useState(0);

  useEffect(() => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    videoRef.current = video;

    const tracker = new PoseTracker();
    trackerRef.current = tracker;

    let stableTimer: number | null = null;

    tracker
      .initialize(video, {
        onPose: (pts, timestamp) => {
          setLandmarks(pts);

          // Update calibration if not yet completed
          if (!calibrationRef.current.getBaselines().isCalibrated) {
            const { progress, isComplete } = calibrationRef.current.updateCalibration(pts, timestamp);
            setCalibrationProgress(progress);
            if (isComplete) {
              setIsCalibrated(true);
              soundManager.playCoin();
            }
          } else {
            // Once calibrated, test gestures
            const baselines = calibrationRef.current.getBaselines();
            const gestures: RecognizedGestures = recognizerRef.current.process(
              pts,
              timestamp,
              baselines,
              settings.gestureSettings
            );

            if (gestures.targetLane === -1) {
              setTestedMoves((m) => ({ ...m, leanLeft: true }));
              setActiveGesture('LEAN LEFT (LANE 1)');
            } else if (gestures.targetLane === 1) {
              setTestedMoves((m) => ({ ...m, leanRight: true }));
              setActiveGesture('LEAN RIGHT (LANE 3)');
            } else if (gestures.jumpTriggered) {
              setTestedMoves((m) => ({ ...m, jump: true }));
              setActiveGesture('JUMP DETECTED');
              soundManager.playJump();
            } else if (gestures.isCrouching) {
              setTestedMoves((m) => ({ ...m, crouch: true }));
              setActiveGesture('CROUCH DETECTED');
            } else if (gestures.attackTriggered) {
              setTestedMoves((m) => ({ ...m, punch: true }));
              setActiveGesture('PUNCH DETECTED');
              soundManager.playPunch();
            } else if (gestures.isShielding) {
              setTestedMoves((m) => ({ ...m, shield: true }));
              setActiveGesture('SHIELD T-POSE');
              soundManager.playShield();
            } else if (gestures.specialTriggered) {
              setTestedMoves((m) => ({ ...m, special: true }));
              setActiveGesture('SPECIAL POWER');
              soundManager.playSpecial();
            }
          }
        },
        onTrackingLost: (lost) => {
          setTrackingLost(lost);
        },
        onError: (err) => {
          setCameraError(err.message || 'Unable to access webcam or load pose model.');
        },
      })
      .then(() => {
        // Track stability timer
        stableTimer = window.setInterval(() => {
          setStableTrackingTime((prev) => prev + 0.5);
        }, 500);
      })
      .catch((err) => {
        setCameraError(err.message || 'Camera initialization error.');
      });

    return () => {
      if (stableTimer) clearInterval(stableTimer);
      tracker.stop();
    };
  }, [settings.gestureSettings]);

  const handleRecalibrate = () => {
    calibrationRef.current.resetCalibration();
    setIsCalibrated(false);
    setCalibrationProgress(0);
    soundManager.playCoin();
  };

  const handleStartGame = () => {
    soundManager.playPunch();
    setScreen('modeSelect');
  };

  const handleSwitchToKeyboard = () => {
    setInputMethod('keyboard');
    soundManager.playCoin();
    setScreen('modeSelect');
  };

  const canStart = isCalibrated && stableTrackingTime >= 2.0;

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col justify-between text-white select-none bg-[#050711]">
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

        <div className="text-center">
          <div className="text-xl font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">
            MOTION CALIBRATION & TRIAL
          </div>
          <div className="text-xs text-slate-400">Stand 4-7 feet back so your torso and hands are visible</div>
        </div>

        <button
          onClick={handleSwitchToKeyboard}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-xs text-slate-400 hover:text-cyan-300 hover:border-cyan-400/50 transition-all cursor-pointer"
        >
          <Keyboard className="w-4 h-4 text-cyan-400" />
          <span>Use Keyboard Instead</span>
        </button>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 flex flex-col justify-center">
        {cameraError ? (
          <div className="max-w-md mx-auto p-8 rounded-3xl glass-panel-purple border-rose-500 text-center">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-xl font-black text-rose-300 mb-2">Camera Access Blocked</h2>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">{cameraError}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSwitchToKeyboard}
                className="neon-btn py-3 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                <Keyboard className="w-5 h-5" />
                <span>Play With Keyboard Controls</span>
              </button>
              <button
                onClick={() => window.location.reload()}
                className="glass-panel py-3 px-6 rounded-xl text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Retry Camera Access
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Live Mirrored Camera Preview */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <div className="w-full max-w-lg aspect-4/3 relative rounded-3xl overflow-hidden border-2 border-cyan-400/60 shadow-2xl shadow-cyan-500/20 bg-black">
                <CameraSkeletonOverlay
                  landmarks={landmarks}
                  videoRef={videoRef}
                  width={560}
                  height={420}
                  activeGesture={activeGesture}
                  trackingLost={trackingLost}
                />
              </div>

              {/* Recalibrate Button */}
              {isCalibrated && (
                <button
                  onClick={handleRecalibrate}
                  className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>Recalibrate Baseline (3s Hold)</span>
                </button>
              )}
            </div>

            {/* Calibration Status & Guided Checklist */}
            <div className="lg:col-span-5 flex flex-col gap-5">
              {/* Step 1: Calibration Hold Meter */}
              <div className="glass-panel-purple p-6 rounded-3xl border-cyan-400/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Step 1: Neutral Standing Baseline
                  </span>
                  <span className="text-xs font-bold font-mono text-cyan-400">
                    {Math.round(calibrationProgress * 100)}%
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-700 overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-150 rounded-full"
                    style={{ width: `${calibrationProgress * 100}%` }}
                  />
                </div>

                <p className="text-xs text-slate-300">
                  {isCalibrated
                    ? '✅ Baseline calibrated! Shoulder width and hip height locked.'
                    : 'Stand straight facing your camera for 3 seconds to establish your baseline.'}
                </p>
              </div>

              {/* Step 2: Guided Test Moves Checklist */}
              <div className="glass-panel p-6 rounded-3xl">
                <div className="text-xs font-black uppercase tracking-wider text-slate-300 mb-4">
                  Step 2: Gesture Test Verification
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${testedMoves.leanLeft || testedMoves.leanRight ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900/40 border-slate-700 text-slate-400'}`}>
                    {testedMoves.leanLeft || testedMoves.leanRight ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <span>Lean Left / Right</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${testedMoves.jump ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900/40 border-slate-700 text-slate-400'}`}>
                    {testedMoves.jump ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <span>Hop Up (Jump)</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${testedMoves.crouch ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900/40 border-slate-700 text-slate-400'}`}>
                    {testedMoves.crouch ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <span>Duck Low (Slide)</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${testedMoves.punch ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900/40 border-slate-700 text-slate-400'}`}>
                    {testedMoves.punch ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <span>Fist Thrust (Punch)</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${testedMoves.shield ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900/40 border-slate-700 text-slate-400'}`}>
                    {testedMoves.shield ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <span>T-Pose (Shield)</span>
                  </div>

                  <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${testedMoves.special ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300' : 'bg-slate-900/40 border-slate-700 text-slate-400'}`}>
                    {testedMoves.special ? <CheckCircle2 className="w-4 h-4 text-cyan-400" /> : <Circle className="w-4 h-4 text-slate-500" />}
                    <span>Hands Up (Special)</span>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                disabled={!canStart}
                className={`py-4 px-8 rounded-2xl font-black text-base flex items-center justify-center gap-3 transition-all ${
                  canStart
                    ? 'neon-btn text-white cursor-pointer shadow-xl shadow-cyan-500/25 animate-pulse-glow'
                    : 'bg-slate-800/60 border border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>{canStart ? 'START MISSION WITH BODY TRACKING' : 'HOLD NEUTRAL POSE TO CALIBRATE...'}</span>
                <Play className="w-5 h-5 fill-current" />
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 text-center py-4 text-xs text-slate-500">
        All vision computations are processed strictly in your local browser sandbox.
      </footer>
    </div>
  );
};
