# BODYVERSE — Asset Sources and Licensing

This document records the provenance, attribution, and licensing of all visual, 3D, motion, and audio assets utilized in **BODYVERSE**.

---

## 1. 3D Character & Environment Architecture

- **Ninja Character**: 
  - **Source**: Custom procedural articulated 3D mesh hierarchy authored specifically for BODYVERSE.
  - **Design**: Cyber-Ninja with multi-layered carbon fiber chest armor, glowing cybernetic emblem, ninja cowl with cyber visor, dual wind-simulated trailing scarf ribbons, dual back-mounted ninjato katana sheaths, kinetic knuckle wrap fists, and dynamic geodesic hexagonal energy shield.
  - **Animation Controller**: Programmatic skeletal kinematic animation system driving running cycle strides, jump leg tucks and arm flaring, low sliding posture, punch thrust extensions, 360-degree dodge roll spin, and hit recoil.
  - **License**: MIT License (Bodyverse Open Game Engine).

- **Environment & Track Chunks**:
  - **Source**: Custom procedural modular cyberpunk Japanese track pieces.
  - **Elements**: 3-Lane illuminated highway, glowing neon curbs, lane divider guides, procedural traditional Torii gates, floating octagonal lanterns with point lights, cyber-sakura additive particle systems.
  - **License**: MIT License.

- **Obstacles & Collectibles**:
  - **Source**: Custom procedural geometries.
  - **Types**: High-voltage hurdle spikes, high plasma laser beam arches, cyber-sentry sentinel drones with glowing red ocular sensors, pulsing plasma vortex spheres, spinning golden coin octahedrons, and emerald health kits.
  - **License**: MIT License.

---

## 2. Computer Vision & Machine Learning Models

- **MediaPipe PoseLandmarker (Lite)**:
  - **Provider**: Google MediaPipe Team (@mediapipe/tasks-vision)
  - **Model**: `pose_landmarker_lite.task` (Float16, 5.5 MB)
  - **WASM Modules**: `vision_wasm_internal.wasm`, `vision_wasm_internal.js`
  - **License**: Apache License 2.0 (Google LLC)
  - **Usage Note**: Local offline hosting in `/models` and `/wasm` ensures zero third-party telemetry, 100% on-device private processing, and network independence.

---

## 3. Audio & Synthesis

- **SFX & Music Engine**:
  - **Engine**: Procedural Web Audio API sound generator (`SoundManager.ts`).
  - **Sound Effects**:
    - `Jump`: Rising exponential frequency sweep (160 Hz -> 480 Hz)
    - `Punch`: Dual-layer low triangle thud (220 Hz -> 45 Hz) + high air-swoosh (650 Hz -> 180 Hz)
    - `Coin`: Polyphonic chime (B5 987 Hz -> E6 1318 Hz + B6 1975 Hz)
    - `Hit`: Crunchy low sawtooth distortion (120 Hz -> 30 Hz)
    - `Shield`: Resonant frequency sweep (300 Hz -> 800 Hz)
    - `Special Shockwave`: Deep rumble surge (80 Hz -> 600 Hz -> 40 Hz)
    - `Dodge`: Airy whoosh filter sweep (420 Hz -> 210 Hz)
  - **Background Music**: Real-time generative cyber synthwave loop (100 BPM) with 16th-note sawtooth basslines and high sine arpeggios.
  - **License**: MIT License.

---

## 4. UI & Icons

- **Lucide React Icons**:
  - **Authors**: Lucide Contributors
  - **License**: ISC License (Compatible with commercial & open-source distribution)

---

## 5. Mixamo / Third-Party Notice

- In accordance with Mixamo's service terms, no raw Mixamo skeleton FBX/GLB files are redistributed as standalone downloadable archives. All character kinematics in this release are generated procedurally through code-driven bone transformations for maximum performance and license safety.
