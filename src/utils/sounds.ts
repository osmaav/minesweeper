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
  {
  // L's Theme: Первая половина (13 нот) + Вторая половина с концовкой (14 нот)
    notes: [
      // 1-я половина
      392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66,
      // 2-я половина
      392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66, 329.63
    ],
    tempo: 0.2, // Быстрый темп для оригинального звучания
    type: 'square' as OscillatorType // Тип 'square' (меандр) идеально имитирует 8-битный/синтезаторный звук
  },
];

const menuMelodies = [
{
  // Правая рука (мелодия)
  notes: [
    392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66,
    392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66, 329.63
  ],
  // Левая рука (аккорды на фоне) - массив такой же длины
  chords: [
    // Под Em: 6 нот звучит E (164.81), следующие 7 нот звучит B (246.94)
    164.81, 164.81, 164.81, 164.81, 164.81, 164.81, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94,
    // Под Am и Bm во второй половине
    220.00, 220.00, 220.00, 220.00, 220.00, 220.00, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 164.81
  ],
  tempo: 0.2,
  type: 'square' as OscillatorType,
  chordType: 'triangle' as OscillatorType // Мягкий тип волны для баса, чтобы не заглушал мелодию
},

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
  const melody = melodies[currentMelodyIndex];
  const now = ctx.currentTime;
  const noteLength = melody.tempo;
  
  melody.notes.forEach((freq, i) => {
    // 1. ИГРАЕМ ПРАВУЮ РУКУ (МЕЛОДИЯ)
    if (freq !== 0) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.connect(noteGain);
      noteGain.connect(musicGain!);
      osc.type = melody.type;
      osc.frequency.setValueAtTime(freq, now + i * noteLength);
      
      // Атака и затухание для правой руки
      noteGain.gain.setValueAtTime(0, now + i * noteLength);
      noteGain.gain.linearRampToValueAtTime(0.7, now + i * noteLength + 0.02);
      noteGain.gain.linearRampToValueAtTime(0.5, now + i * noteLength + noteLength * 0.7);
      noteGain.gain.linearRampToValueAtTime(0, now + i * noteLength + noteLength);
      
      osc.start(now + i * noteLength);
      osc.stop(now + i * noteLength + noteLength);
      musicOscillators.push(osc);
    }

    // 2. ИГРАЕМ ЛЕВУЮ РУКУ (АККОРДЫ / БАС)
    // Проверяем, есть ли аккорды у этой мелодии, и не равны ли они 0
    if ('chords' in melody && melody.chords && melody.chords[i] !== 0) {
      const chordFreq = melody.chords[i];
      const chordOsc = ctx.createOscillator();
      const chordGain = ctx.createGain();
      
      chordOsc.connect(chordGain);
      chordGain.connect(musicGain!);
      // Используем chordType из объекта или падаем на обычный triangle
      chordOsc.type = (melody as any).chordType || 'triangle'; 
      chordOsc.frequency.setValueAtTime(chordFreq, now + i * noteLength);
      
      // Настройки громкости баса (делаем его тише правой руки, например, max 0.2)
      chordGain.gain.setValueAtTime(0, now + i * noteLength);
      chordGain.gain.linearRampToValueAtTime(0.5, now + i * noteLength + 0.01);
      chordGain.gain.linearRampToValueAtTime(0.3, now + i * noteLength + noteLength * 0.9);
      chordGain.gain.linearRampToValueAtTime(0, now + i * noteLength + noteLength);
      
      chordOsc.start(now + i * noteLength);
      chordOsc.stop(now + i * noteLength + noteLength);
      musicOscillators.push(chordOsc); // Добавляем в общий массив для очистки при остановке
    }
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
