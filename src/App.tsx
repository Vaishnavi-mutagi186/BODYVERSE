import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { LandingPage } from './pages/LandingPage';
import { PlayerSetupPage } from './pages/PlayerSetupPage';
import { CalibrationPage } from './pages/CalibrationPage';
import { ModeSelectPage } from './pages/ModeSelectPage';
import { GameplayPage } from './pages/GameplayPage';
import { ResultsPage } from './pages/ResultsPage';
import { soundManager } from './audio/SoundManager';

export const App: React.FC = () => {
  const { currentScreen, settings } = useGameStore();

  useEffect(() => {
    soundManager.setConfig(
      settings.masterVolume,
      settings.musicVolume,
      settings.sfxVolume,
      settings.isMuted
    );
  }, [settings]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#050711] text-white">
      {currentScreen === 'landing' && <LandingPage />}
      {currentScreen === 'setup' && <PlayerSetupPage />}
      {currentScreen === 'calibration' && <CalibrationPage />}
      {currentScreen === 'modeSelect' && <ModeSelectPage />}
      {currentScreen === 'gameplay' && <GameplayPage />}
      {currentScreen === 'results' && <ResultsPage />}
    </div>
  );
};

export default App;
