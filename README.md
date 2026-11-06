# BODYVERSE — Webcam Body-Controlled 3D Ninja Game

> *"Your Body. Your Moves. Your Adventure."*

BODYVERSE is a high-performance browser-based 3D action runner and combat game where you control a cyber-ninja directly using your webcam and full-body motion. All vision and pose landmark processing runs 100% locally on-device in your browser using `@mediapipe/tasks-vision` and WebGL with Three.js.

---

## ⚡ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS (v4) with custom Glassmorphism & Cyberpunk Neon UI
- **3D Graphics**: Three.js, `@react-three/fiber`, custom WebGL shaders and materials
- **Computer Vision & AI**: `@mediapipe/tasks-vision` (PoseLandmarker Lite, GPU delegate with CPU fallback, runningMode VIDEO)
- **Signal Processing**: 1€ Filter (One-Euro Filter) + Exponential Moving Average (EMA) on all landmarks
- **Audio Engine**: Real-time procedural Web Audio API sound effects and cyber synthwave music synthesizer
- **State Management**: Zustand with persistent storage (`localStorage`) for high scores, player preferences, and sensitivity tuning

---

## 🎮 Game Controls & Gesture Recognition Specification

BODYVERSE normalizes all landmark measurements by **shoulder width** or **torso length**, guaranteeing consistent gameplay regardless of player distance or webcam resolution.

| Action | Body Motion (Webcam Vision) | Keyboard Fallback |
| :--- | :--- | :--- |
| **Move Lane Left** | Lean torso to the left | `A` or `Left Arrow` |
| **Move Lane Right** | Lean torso to the right | `D` or `Right Arrow` |
| **Jump** | Hop upward (hip center rises >16% of torso length with positive vertical velocity) | `W` or `Space` or `Up Arrow` |
| **Crouch / Slide** | Duck or squat low (hip center drops >18% of torso length) | `S` or `Down Arrow` |
| **Punch Strike** | Thrust either fist forward (elbow angle opens >145° with fast wrist speed) | `J` or `F` |
| **Energy Shield** | Extend both arms horizontally (T-Pose at shoulder height for 300ms) | `K` or `E` |
| **Special Shockwave** | Raise both wrists above head (above nose level for 400ms) | `L` or `Q` |
| **Dodge Burst** | Rapid sideways torso velocity burst (>0.45 velocity threshold) | `Z` (left), `X` (right) |
| **Pause Game** | Step out of frame (>500ms tracking loss triggers auto-pause) | `Pause Button` on HUD |

---

## 📐 Calibration System

Before jumping into the action, the **Motion Calibration Screen** guides the player through a quick 3-second hold:
1. **Neutral Baseline**: Establishes your rest shoulder-center X, standing hip-center Y, shoulder width, and torso length.
2. **Interactive Move Checks**: Green checkmarks light up in real-time as you test leaning, jumping, crouching, punching, shielding, and raising hands for special power.
3. **Safety Gate**: The "Start Mission" button enables only after successful baseline calibration and 2+ seconds of sustained stable tracking.

---

## ⚙️ Sensitivity & Motion Tuning

Open the **Settings & Tuning** dialog anytime from the landing page, setup page, or pause menu:
- **Lane Lean Sensitivity**: Adjusts the hysteresis threshold for lane switching (prevents jitter).
- **Jump Rise Threshold**: Configures the vertical torso rise required to register a leap.
- **Crouch / Slide Drop**: Tunes the squat depth needed to activate sliding.
- **Punch Extension Angle**: Adjusts the elbow extension required for martial punches.
- **Dodge Velocity**: Sets the acceleration required to trigger an evasive invulnerability spin.
- **Audio Channels**: Individual volume sliders for Master, Procedural Music Synth, and SFX impacts.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v20.18.0` or higher
- npm `10.8.0` or higher
- A standard laptop webcam or USB camera

### Installation

```bash
# Clone or navigate to the project directory
cd BODYVERSE

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build & Preview

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🛡️ Tracking Loss & Privacy

- **100% Private & Local**: Video frames never leave your computer. Pose landmark inferences occur exclusively in WebAssembly / WebGL on your device.
- **Graceful Tracking Recovery**: If the player steps out of frame for more than 500ms, the game immediately enters a safety pause state (`"STEP BACK INTO FRAME"`). Stepping back into view immediately resumes your game without penalty.
- **Hardware Fallback**: If a camera is unavailable or access is denied, players can seamlessly switch to the `KeyboardInputProvider` at any time with a single click.

---

## 🏆 Game Modes

- **Shadow Ninja** *(Active)*: 3-lane combat runner featuring procedural obstacle generation (spikes, high lasers, sentinel drones, plasma spheres), coin collection, kinetic punch combat, energy shields, and screen-clearing shockwaves.
- **Dragon Rider** *(Coming Soon)*: Canyon aerial flight navigation using wingspan arm controls.
- **Superhero Rescue** *(Coming Soon)*: Palm deflection and airborne rescue challenges.
