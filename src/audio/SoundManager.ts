class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVol: number = 0.8;
  private musicVol: number = 0.7;
  private sfxVol: number = 0.9;
  private musicTimer: number | null = null;
  private isMusicPlaying: boolean = false;
  private step: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setConfig(master: number, music: number, sfx: number, muted: boolean) {
    this.masterVol = master;
    this.musicVol = music;
    this.sfxVol = sfx;
    this.isMuted = muted;
  }

  public playJump() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

    const vol = this.masterVol * this.sfxVol * 0.4;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playPunch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low punch thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    const vol = this.masterVol * this.sfxVol * 0.6;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);

    // High swoosh
    const swoosh = this.ctx.createOscillator();
    const sGain = this.ctx.createGain();
    swoosh.type = 'sine';
    swoosh.frequency.setValueAtTime(650, now);
    swoosh.frequency.exponentialRampToValueAtTime(180, now + 0.12);

    sGain.gain.setValueAtTime(vol * 0.35, now);
    sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    swoosh.connect(sGain);
    sGain.connect(this.ctx.destination);

    swoosh.start(now);
    swoosh.stop(now + 0.12);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(987.77, now); // B5
    osc1.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    osc2.frequency.setValueAtTime(1975.53, now + 0.08); // B6

    const vol = this.masterVol * this.sfxVol * 0.35;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.3);
    osc2.stop(now + 0.3);
  }

  public playHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.25);

    const vol = this.masterVol * this.sfxVol * 0.7;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playShield() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.25);

    const vol = this.masterVol * this.sfxVol * 0.45;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playSpecial() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Shockwave surge
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

    const vol = this.masterVol * this.sfxVol * 0.8;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.8);
  }

  public playDodge() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.16);

    const vol = this.masterVol * this.sfxVol * 0.3;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public startBGM() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.step = 0;

    const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42]; // A1, C2, D2, E2
    const leadNotes = [220, 261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63];

    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || this.isMuted || this.musicVol <= 0) return;

      const now = this.ctx.currentTime;
      const bassFreq = bassNotes[this.step % bassNotes.length];
      const leadFreq = leadNotes[(this.step * 2) % leadNotes.length];

      // Bass pulse
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      const bVol = this.masterVol * this.musicVol * 0.22;
      bassGain.gain.setValueAtTime(bVol, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      bassOsc.connect(bassGain);
      bassGain.connect(this.ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 0.2);

      // Cyber Synth Arpeggio
      if (this.step % 2 === 0) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'sine';
        leadOsc.frequency.setValueAtTime(leadFreq, now);

        const lVol = this.masterVol * this.musicVol * 0.12;
        leadGain.gain.setValueAtTime(lVol, now);
        leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        leadOsc.connect(leadGain);
        leadGain.connect(this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + 0.15);
      }

      this.step++;
    }, 150); // ~100 BPM 16th feel
  }

  public stopBGM() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundManager();
