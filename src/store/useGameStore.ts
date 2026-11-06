import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ScreenType = 'landing' | 'setup' | 'calibration' | 'modeSelect' | 'gameplay' | 'results';
export type Difficulty = 'normal' | 'hard' | 'master';
export type InputMethod = 'pose' | 'keyboard';

export interface GestureSettings {
  laneHysteresis: number; // Torso X sensitivity
  jumpThreshold: number; // Torso rise percentage
  crouchThreshold: number; // Torso drop percentage
  punchThreshold: number; // Elbow extension angle
  shieldDuration: number; // ms
  dodgeVelocityThreshold: number;
  smoothingFactor: number; // EMA / OneEuro
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  showSkeletonPreview: boolean;
  gestureSettings: GestureSettings;
}

export interface PlayerStats {
  score: number;
  coins: number;
  distance: number;
  enemiesDefeated: number;
  timeAlive: number;
  accuracy: number;
  perfectDodges: number;
}

export interface GameStoreState {
  currentScreen: ScreenType;
  playerName: string;
  selectedCharacter: string;
  difficulty: Difficulty;
  inputMethod: InputMethod;
  settings: GameSettings;
  highScores: { [key in Difficulty]: number };
  lastRunStats: PlayerStats;

  // Realtime transient HUD state
  fps: number;
  isPaused: boolean;
  trackingLost: boolean;
  trackingLostTime: number;
  activeGestureName: string | null;
  activeGestureTime: number;

  // Actions
  setScreen: (screen: ScreenType) => void;
  setPlayerName: (name: string) => void;
  setSelectedCharacter: (id: string) => void;
  setDifficulty: (diff: Difficulty) => void;
  setInputMethod: (method: InputMethod) => void;
  updateSettings: (partial: Partial<GameSettings>) => void;
  updateGestureSettings: (partial: Partial<GestureSettings>) => void;
  setPaused: (paused: boolean) => void;
  setTrackingLost: (lost: boolean) => void;
  triggerGestureFeedback: (name: string) => void;
  updateFps: (fps: number) => void;
  recordRunStats: (stats: PlayerStats) => void;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      currentScreen: 'landing',
      playerName: 'ShadowRunner',
      selectedCharacter: 'cyber_ninja',
      difficulty: 'normal',
      inputMethod: 'pose',
      settings: {
        masterVolume: 0.8,
        musicVolume: 0.7,
        sfxVolume: 0.9,
        isMuted: false,
        showSkeletonPreview: true,
        gestureSettings: {
          laneHysteresis: 0.12,
          jumpThreshold: 0.16,
          crouchThreshold: 0.18,
          punchThreshold: 145, // degrees
          shieldDuration: 3000,
          dodgeVelocityThreshold: 0.45,
          smoothingFactor: 0.35,
        },
      },
      highScores: {
        normal: 1250,
        hard: 0,
        master: 0,
      },
      lastRunStats: {
        score: 0,
        coins: 0,
        distance: 0,
        enemiesDefeated: 0,
        timeAlive: 0,
        accuracy: 100,
        perfectDodges: 0,
      },
      fps: 60,
      isPaused: false,
      trackingLost: false,
      trackingLostTime: 0,
      activeGestureName: null,
      activeGestureTime: 0,

      setScreen: (screen) => set({ currentScreen: screen, isPaused: false }),
      setPlayerName: (name) => set({ playerName: name }),
      setSelectedCharacter: (id) => set({ selectedCharacter: id }),
      setDifficulty: (diff) => set({ difficulty: diff }),
      setInputMethod: (method) => set({ inputMethod: method }),
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
      updateGestureSettings: (partial) =>
        set((state) => ({
          settings: {
            ...state.settings,
            gestureSettings: { ...state.settings.gestureSettings, ...partial },
          },
        })),
      setPaused: (paused) => set({ isPaused: paused }),
      setTrackingLost: (lost) =>
        set((state) => ({
          trackingLost: lost,
          trackingLostTime: lost ? Date.now() : state.trackingLostTime,
        })),
      triggerGestureFeedback: (name) =>
        set({ activeGestureName: name, activeGestureTime: Date.now() }),
      updateFps: (fps) => set({ fps }),
      recordRunStats: (stats) => {
        const { difficulty, highScores } = get();
        const currentHigh = highScores[difficulty] || 0;
        const newHigh = Math.max(currentHigh, stats.score);
        set({
          lastRunStats: stats,
          highScores: {
            ...highScores,
            [difficulty]: newHigh,
          },
        });
      },
    }),
    {
      name: 'bodyverse_game_data',
      partialize: (state) => ({
        playerName: state.playerName,
        selectedCharacter: state.selectedCharacter,
        difficulty: state.difficulty,
        inputMethod: state.inputMethod,
        settings: state.settings,
        highScores: state.highScores,
      }),
    }
  )
);
