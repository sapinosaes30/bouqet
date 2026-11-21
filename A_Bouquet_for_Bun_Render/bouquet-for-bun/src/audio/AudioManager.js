export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.started = false;
    this.timers = [];
    this.chordIndex = 0;
    this.noteIndex = 0;
    this.chords = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [87.31, 110.00, 130.81, 164.81],  // Fmaj7
      [98.00, 123.47, 146.83, 196.00],  // G6
    ];
    this.scale = [523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33];
  }

  async start() {
    if (this.started) {
      if (this.context?.state === 'suspended') await this.context.resume();
      return;
    }
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      this.context = new AudioContextClass();
      await this.context.resume();
      const ctx = this.context;
      this.master = ctx.createGain();
      this.master.gain.value = 0.0001;
      this.master.connect(ctx.destination);
      this.master.gain.setTargetAtTime(0.48, ctx.currentTime, 2.8);
      this.createWind();
      this.createStringPad();
      this.startPianoPattern();
      this.scheduleBirds();
      this.started = true;
    } catch (error) {
      console.warn('Ambient audio could not be started:', error);
    }
  }

  createWind() {
    const ctx = this.context;
    const bufferSize = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.975 + white * 0.025;
      data[i] = last * 2.4;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = 340;
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 70;
    const gain = ctx.createGain();
    gain.gain.value = 0.032;
    const pan = ctx.createStereoPanner();
    pan.pan.value = -0.12;
    noise.connect(low).connect(high).connect(gain).connect(pan).connect(this.master);
    noise.start();
  }

  createStringPad() {
    const ctx = this.context;
    this.padVoices = [];
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 760;
    filter.Q.value = 0.45;
    filter.connect(this.master);
    this.chords[0].forEach((frequency, index) => {
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const gain = ctx.createGain();
      oscA.type = 'sawtooth';
      oscB.type = 'triangle';
      oscA.frequency.value = frequency;
      oscB.frequency.value = frequency * 1.004;
      gain.gain.value = index === 0 ? 0.010 : 0.007;
      oscA.connect(gain);
      oscB.connect(gain);
      gain.connect(filter);
      oscA.start();
      oscB.start();
      this.padVoices.push({ oscA, oscB, gain });
    });
    this.chordTimer = window.setInterval(() => {
      this.chordIndex = (this.chordIndex + 1) % this.chords.length;
      const chord = this.chords[this.chordIndex];
      const now = ctx.currentTime;
      this.padVoices.forEach((voice, index) => {
        voice.oscA.frequency.setTargetAtTime(chord[index], now, 1.8);
        voice.oscB.frequency.setTargetAtTime(chord[index] * 1.004, now, 1.8);
      });
    }, 10000);
  }

  playPianoNote(frequency, velocity = 0.035, duration = 3.2) {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const harmonic = ctx.createOscillator();
    const envelope = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.setValueAtTime(2600, now);
    tone.frequency.exponentialRampToValueAtTime(850, now + 1.8);
    osc.type = 'triangle';
    harmonic.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    harmonic.frequency.setValueAtTime(frequency * 2.002, now);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(velocity, now + 0.025);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(tone);
    harmonic.connect(tone);
    tone.connect(envelope).connect(this.master);
    osc.start(now);
    harmonic.start(now);
    osc.stop(now + duration + 0.1);
    harmonic.stop(now + duration + 0.1);
  }

  startPianoPattern() {
    const tick = () => {
      const index = this.noteIndex % this.scale.length;
      const octave = this.noteIndex % 9 === 0 ? 0.5 : 1;
      const note = this.scale[index] * octave;
      this.playPianoNote(note, 0.022 + Math.random() * 0.018, 2.7 + Math.random() * 1.4);
      if (Math.random() > 0.66) {
        window.setTimeout(() => this.playPianoNote(note * 1.5, 0.013, 2.4), 420);
      }
      this.noteIndex += Math.random() > 0.72 ? 2 : 1;
      const next = 1400 + Math.random() * 1100;
      this.pianoTimer = window.setTimeout(tick, next);
    };
    this.pianoTimer = window.setTimeout(tick, 850);
  }

  playBird() {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const pan = ctx.createStereoPanner();
    osc.type = 'sine';
    const start = 1750 + Math.random() * 700;
    osc.frequency.setValueAtTime(start, now);
    osc.frequency.exponentialRampToValueAtTime(start * (1.35 + Math.random() * 0.2), now + 0.13);
    osc.frequency.exponentialRampToValueAtTime(start * 0.92, now + 0.31);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.006, now + 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
    pan.pan.value = Math.random() * 1.2 - 0.6;
    osc.connect(gain).connect(pan).connect(this.master);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  scheduleBirds() {
    const tick = () => {
      if (Math.random() > 0.23) this.playBird();
      this.birdTimer = window.setTimeout(tick, 6500 + Math.random() * 9000);
    };
    this.birdTimer = window.setTimeout(tick, 2400);
  }
}
