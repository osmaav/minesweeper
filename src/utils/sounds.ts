import { GAME_CONSTANTS, MELODY_TEMPOS } from './constants';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// ============ ЗВУКИ ДЕЙСТВИЙ ============

export function playRevealSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(GAME_CONSTANTS.AUDIO_VOLUME.REVEAL, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

export function playFlagSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.setValueAtTime(900, ctx.currentTime + 0.05);
  osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
  gain.gain.setValueAtTime(GAME_CONSTANTS.AUDIO_VOLUME.FLAG, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

export function playExplosionSound() {
  const ctx = getAudioContext();
  
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(100, ctx.currentTime);
  osc1.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);
  gain1.gain.setValueAtTime(GAME_CONSTANTS.AUDIO_VOLUME.EXPLOSION, ctx.currentTime);
  gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.5);

  const bufferSize = ctx.sampleRate * 0.3;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
  noise.start(ctx.currentTime);
}

export function playWinSound() {
  const ctx = getAudioContext();
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
    gain.gain.linearRampToValueAtTime(GAME_CONSTANTS.AUDIO_VOLUME.WIN, ctx.currentTime + i * 0.15 + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
    osc.start(ctx.currentTime + i * 0.15);
    osc.stop(ctx.currentTime + i * 0.15 + 0.3);
  });
}

export function playClickSound() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  gain.gain.setValueAtTime(GAME_CONSTANTS.AUDIO_VOLUME.CLICK, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.05);
}

// ============ ФОНОВАЯ МУЗЫКА ============

let musicOscillators: OscillatorNode[] = [];
let musicGain: GainNode | null = null;
let musicPlaying = false;
let currentMelodyIndex = 0;
let melodyTimeout: number | null = null;

const gameMelodies = [
  { notes: [523, 587, 659, 698, 784, 698, 659, 587, 523, 587, 659, 784, 880, 784, 659, 523], tempo: MELODY_TEMPOS.MEDIUM, type: 'sine' as OscillatorType },
  { notes: [262, 330, 392, 523, 392, 330, 262, 330, 392, 523, 659, 523, 392, 330, 262, 330], tempo: 0.25, type: 'triangle' as OscillatorType },
  { notes: [659, 0, 784, 0, 880, 784, 0, 659, 0, 587, 0, 523, 587, 659, 0, 784], tempo: MELODY_TEMPOS.FAST, type: 'square' as OscillatorType },
  { notes: [262, 294, 330, 349, 392, 440, 494, 523, 494, 440, 392, 349, 330, 294, 262, 294], tempo: 0.35, type: 'sine' as OscillatorType },
  { notes: [523, 523, 0, 659, 0, 784, 784, 0, 659, 0, 523, 523, 0, 659, 784, 880], tempo: 0.22, type: 'triangle' as OscillatorType },
  { notes: [784, 880, 988, 1047, 988, 880, 784, 880, 784, 659, 587, 523, 587, 659, 784, 880], tempo: 0.4, type: 'sine' as OscillatorType },
  { notes: [392, 392, 440, 523, 523, 440, 392, 330, 262, 262, 330, 392, 392, 330, 330, 262], tempo: MELODY_TEMPOS.MEDIUM, type: 'square' as OscillatorType },
  { notes: [523, 784, 659, 880, 523, 784, 659, 880, 523, 659, 784, 880, 1047, 880, 784, 659], tempo: 0.28, type: 'triangle' as OscillatorType },
  { notes: [659, 0, 784, 0, 880, 0, 784, 659, 0, 523, 0, 587, 0, 659, 0, 784], tempo: MELODY_TEMPOS.SLOW, type: 'sine' as OscillatorType },
  { notes: [440, 494, 523, 587, 659, 587, 523, 494, 440, 494, 523, 659, 784, 659, 523, 440], tempo: 0.32, type: 'triangle' as OscillatorType },
  { notes: [523, 659, 784, 1047, 784, 659, 523, 659, 784, 659, 523, 440, 523, 587, 659, 784], tempo: 0.26, type: 'square' as OscillatorType },
  { notes: [392, 440, 494, 523, 587, 523, 494, 440, 392, 440, 494, 587, 659, 587, 494, 392], tempo: 0.38, type: 'sine' as OscillatorType },
];

const menuMelodies = [
  { notes: [523, 659, 784, 880, 784, 659, 523, 0, 587, 698, 880, 988, 880, 698, 587, 0], tempo: 0.5, type: 'sine' as OscillatorType },
  { notes: [330, 392, 494, 392, 330, 262, 330, 392, 494, 587, 494, 392, 330, 262, 330, 0], tempo: 0.6, type: 'triangle' as OscillatorType },
  { notes: [262, 330, 392, 523, 659, 784, 659, 523, 392, 330, 262, 330, 392, 523, 392, 262], tempo: 0.55, type: 'sine' as OscillatorType },
  { notes: [784, 880, 988, 1047, 988, 880, 784, 0, 659, 784, 880, 988, 880, 784, 659, 0], tempo: 0.48, type: 'triangle' as OscillatorType },
  { notes: [440, 523, 659, 784, 880, 784, 659, 523, 440, 523, 659, 784, 659, 523, 440, 0], tempo: 0.52, type: 'sine' as OscillatorType },
];

export function startBackgroundMusic(isMenu: boolean = false) {
  if (musicPlaying) return;
  musicPlaying = true;
  
  const ctx = getAudioContext();
  musicGain = ctx.createGain();
  musicGain.gain.setValueAtTime(GAME_CONSTANTS.AUDIO_VOLUME.MUSIC, ctx.currentTime);
  musicGain.connect(ctx.destination);

  const melodies = isMenu ? menuMelodies : gameMelodies;
  currentMelodyIndex = Math.floor(Math.random() * melodies.length);

  function playMelodyLoop() {
    if (!musicPlaying || !musicGain) return;
    
    const melody = melodies[currentMelodyIndex];
    const now = ctx.currentTime;
    const noteLength = melody.tempo;
    
    melody.notes.forEach((freq, i) => {
      if (freq === 0) return;
      
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.connect(noteGain);
      noteGain.connect(musicGain!);
      osc.type = melody.type;
      osc.frequency.setValueAtTime(freq, now + i * noteLength);
      
      noteGain.gain.setValueAtTime(0, now + i * noteLength);
      noteGain.gain.linearRampToValueAtTime(0.6, now + i * noteLength + 0.05);
      noteGain.gain.linearRampToValueAtTime(0.4, now + i * noteLength + noteLength * 0.7);
      noteGain.gain.linearRampToValueAtTime(0, now + i * noteLength + noteLength);
      
      osc.start(now + i * noteLength);
      osc.stop(now + i * noteLength + noteLength);
      musicOscillators.push(osc);
    });

    melodyTimeout = window.setTimeout(() => {
      if (musicPlaying) {
        currentMelodyIndex = (currentMelodyIndex + 1) % melodies.length;
        playMelodyLoop();
      }
    }, melody.notes.length * noteLength * 1000);
  }

  playMelodyLoop();
}

export function stopBackgroundMusic() {
  musicPlaying = false;
  if (melodyTimeout) {
    clearTimeout(melodyTimeout);
    melodyTimeout = null;
  }
  musicOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  musicOscillators = [];
  if (musicGain) {
    musicGain.disconnect();
    musicGain = null;
  }
}

export function switchMelody(isMenu: boolean = false) {
  if (!musicPlaying) return;
  const melodies = isMenu ? menuMelodies : gameMelodies;
  currentMelodyIndex = (currentMelodyIndex + 1) % melodies.length;
}
