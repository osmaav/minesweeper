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

interface Melody {
  notes: number[];
  chords?: number[];
  tempo: number;
  type: OscillatorType;
  chordType?: OscillatorType;
}

const gameMelodies: Melody[] = [
{
    // L's Theme — Абсолютно полная версия (96 шагов)
    notes: [
      // === ЧАСТЬ 1: Классический фортепианный рифф (0-32) ===
      392.00, 329.63, 440.00, 329.63, 369.99, 392.00, 329.63, 493.88, 440.00, 392.00, 369.99, 329.63, 293.66, 0, 0, 0,
      392.00, 329.63, 440.00, 329.63, 369.99, 392.00, 329.63, 493.88, 440.00, 392.00, 369.99, 329.63, 293.66, 329.63, 0, 0,

      // === ЧАСТЬ 2: Кульминация (Вступают тяжелые гитары и орган) (32-64) ===
      // Рифф переходит на октаву выше и становится более агрессивным
      783.99, 659.25, 880.00, 659.25, 739.99, 783.99, 659.25, 987.77, 880.00, 783.99, 739.99, 659.25, 587.33, 0, 0, 0,
      783.99, 659.25, 880.00, 659.25, 739.99, 783.99, 659.25, 987.77, 880.00, 783.99, 739.99, 659.25, 587.33, 659.25, 0, 0,

      // === ЧАСТЬ 3: Мрачный брейкдаун / Тяжелый спад (64-96) ===
      // Мелодия замедляется по долям, создавая гнетущее интеллектуальное напряжение
      493.88, 0, 523.25, 0, 587.33, 0, 659.25, 0, 698.46, 0, 659.25, 0, 587.33, 0, 493.88, 0,
      392.00, 0, 369.99, 0, 329.63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    chords: [
      // Бас под ЧАСТЬ 1 (Ми-минор -> Си-минор -> Ля-минор -> Ми-минор)
      82.41,  82.41,  82.41,  82.41,  82.41,  82.41,  82.41,  82.41,  123.47, 123.47, 123.47, 123.47, 123.47, 0, 0, 0,
      110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 123.47, 123.47, 123.47, 123.47, 123.47, 82.41, 0, 0,

      // Бас под ЧАСТЬ 2 (Плотный, качающий power-chord басовый подклад)
      82.41,  0,      82.41,  0,      82.41,  0,      82.41,  0,      123.47, 0,      123.47, 0,      123.47, 0, 0, 0,
      110.00, 0,      110.00, 0,      110.00, 0,      110.00, 0,      123.47, 0,      123.47, 0,      82.41,  0, 0, 0,

      // Бас под ЧАСТЬ 3 (Тяжелые шаги баса вниз, подчеркивающие смену гармонии)
      123.47, 123.47, 130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 174.61, 174.61, 164.81, 164.81, 146.83, 146.83, 123.47, 123.47,
      82.41,  82.41,  82.41,  82.41,  82.41,  0,      0,      0,      0,      0,      0,      0,      0,      0, 0, 0
    ],
    tempo: 0.2,                         // Чуть ускорили для оригинального драйва саундтрека
    type: 'square' as OscillatorType,     // Острый лид-звук
    chordType: 'square' as OscillatorType // Тяжелый басовый фундамент
  },

];

const menuMelodies: Melody[] = [
  {
    // "К Элизе" — Полная версия (Правая рука)
    notes: [
      // [ЧАСТЬ 1] Главная тема (Первое предложение)
      659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00, 0, 
      261.63, 329.63, 440.00, 493.88, 0, 329.63, 415.30, 493.88, 523.25, 0,
      
      // [ЧАСТЬ 2] Главная тема (Второе предложение, уход наверх)
      329.63, 659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00,
      0, 261.63, 329.63, 440.00, 493.88, 0, 329.63, 523.25, 493.88, 440.00, 0,
      
      // [ЧАСТЬ 3] Классический мажорный переход (Кульминация)
      493.88, 523.25, 587.33, 659.25, 0, 783.99, 698.46, 659.25, 587.33, 0,
      659.25, 587.33, 523.25, 493.88, 0, 587.33, 523.25, 493.88, 440.00, 0,
      
      // [ЧАСТЬ 4] Возврат к главной теме и логический финал
      329.63, 659.25, 622.25, 659.25, 622.25, 659.25, 493.88, 587.33, 523.25, 440.00, 0,
      261.63, 329.63, 440.00, 493.88, 0, 329.63, 523.25, 493.88, 440.00, 0, 0, 0, 0
    ],
    // Левая рука (Полное гармоническое сопровождение, 85 шагов)
    chords: [
      // Под ЧАСТЬ 1
      0, 0, 0, 0, 0, 0, 0, 0, 110.00, 164.81, 
      261.63, 0, 0, 123.47, 164.81, 246.94, 329.63, 0, 110.00, 164.81, 
      
      // Под ЧАСТЬ 2
      261.63, 0, 0, 0, 0, 0, 0, 0, 0, 110.00,
      164.81, 261.63, 0, 0, 123.47, 164.81, 246.94, 329.63, 0, 110.00, 164.81,
      
      // Под ЧАСТЬ 3
      261.63, 0, 0, 130.81, 196.00, 329.63, 0, 0, 0, 146.83,
      220.00, 293.66, 0, 0, 0, 164.81, 246.94, 329.63, 0, 0,
      
      // Под ЧАСТЬ 4
      0, 0, 0, 0, 0, 0, 0, 0, 0, 110.00, 164.81,
      261.63, 0, 0, 123.47, 164.81, 246.94, 329.63, 0, 110.00, 0, 0, 0, 0, 0
    ],
    tempo: 0.2,                         // Слегка ускорили темп для сохранения динамики
    type: 'sine' as OscillatorType,      // Имитация мягкого пианино
    chordType: 'sine' as OscillatorType  // Глубокий, чистый бас без хрипов
  },

  {
    // L's Theme — Абсолютно полная версия (96 шагов)
    notes: [
      // === ЧАСТЬ 1: Классический фортепианный рифф (0-32) ===
      392.00, 329.63, 440.00, 329.63, 369.99, 392.00, 329.63, 493.88, 440.00, 392.00, 369.99, 329.63, 293.66, 0, 0, 0,
      392.00, 329.63, 440.00, 329.63, 369.99, 392.00, 329.63, 493.88, 440.00, 392.00, 369.99, 329.63, 293.66, 329.63, 0, 0,

      // === ЧАСТЬ 2: Кульминация (Вступают тяжелые гитары и орган) (32-64) ===
      // Рифф переходит на октаву выше и становится более агрессивным
      783.99, 659.25, 880.00, 659.25, 739.99, 783.99, 659.25, 987.77, 880.00, 783.99, 739.99, 659.25, 587.33, 0, 0, 0,
      783.99, 659.25, 880.00, 659.25, 739.99, 783.99, 659.25, 987.77, 880.00, 783.99, 739.99, 659.25, 587.33, 659.25, 0, 0,

      // === ЧАСТЬ 3: Мрачный брейкдаун / Тяжелый спад (64-96) ===
      // Мелодия замедляется по долям, создавая гнетущее интеллектуальное напряжение
      493.88, 0, 523.25, 0, 587.33, 0, 659.25, 0, 698.46, 0, 659.25, 0, 587.33, 0, 493.88, 0,
      392.00, 0, 369.99, 0, 329.63, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
    ],
    chords: [
      // Бас под ЧАСТЬ 1 (Ми-минор -> Си-минор -> Ля-минор -> Ми-минор)
      82.41,  82.41,  82.41,  82.41,  82.41,  82.41,  82.41,  82.41,  123.47, 123.47, 123.47, 123.47, 123.47, 0, 0, 0,
      110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 110.00, 123.47, 123.47, 123.47, 123.47, 123.47, 82.41, 0, 0,

      // Бас под ЧАСТЬ 2 (Плотный, качающий power-chord басовый подклад)
      82.41,  0,      82.41,  0,      82.41,  0,      82.41,  0,      123.47, 0,      123.47, 0,      123.47, 0, 0, 0,
      110.00, 0,      110.00, 0,      110.00, 0,      110.00, 0,      123.47, 0,      123.47, 0,      82.41,  0, 0, 0,

      // Бас под ЧАСТЬ 3 (Тяжелые шаги баса вниз, подчеркивающие смену гармонии)
      123.47, 123.47, 130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 174.61, 174.61, 164.81, 164.81, 146.83, 146.83, 123.47, 123.47,
      82.41,  82.41,  82.41,  82.41,  82.41,  0,      0,      0,      0,      0,      0,      0,      0,      0, 0, 0
    ],
    tempo: 0.2,                         // Чуть ускорили для оригинального драйва саундтрека
    type: 'square' as OscillatorType,     // Острый лид-звук
    chordType: 'square' as OscillatorType // Тяжелый басовый фундамент
  },

];


export function startBackgroundMusic(isMenu: boolean = false) {
  if (musicPlaying) return;
  musicPlaying = true;
  
  const ctx = getAudioContext();
  musicGain = ctx.createGain();
  
  // НАЧАЛО НАРАСТАНИЯ (FADE IN)
  // Ставим громкость в 0 в текущий момент времени
  musicGain.gain.setValueAtTime(0, ctx.currentTime);
  // Плавно поднимаем громкость до целевой за 1.5 секунды
  musicGain.gain.linearRampToValueAtTime(
    GAME_CONSTANTS.AUDIO_VOLUME.MUSIC, 
    ctx.currentTime + 1.5
  );
  
  musicGain.connect(ctx.destination);

  const melodies = isMenu ? menuMelodies : gameMelodies;
  currentMelodyIndex = Math.floor(Math.random() * melodies.length);

  function playMelodyLoop() {
    if (!musicPlaying || !musicGain) return;
    
    const melody = melodies[currentMelodyIndex];
    const now = ctx.currentTime;
    const noteLength = melody.tempo;
    
    // Создаём эффект эха (delay)
    const delayNode = ctx.createDelay();
    const delayGain = ctx.createGain();
    
    delayNode.delayTime.setValueAtTime(noteLength, now);
    delayGain.gain.setValueAtTime(0.35, now);
    
    delayNode.connect(delayGain);
    delayGain.connect(musicGain);
    delayGain.connect(delayNode); 

    const chordsLen = ('chords' in melody && melody.chords) ? melody.chords.length : 0;
    const maxLength = Math.max(melody.notes.length, chordsLen);

    for (let i = 0; i < maxLength; i++) {
      const freq = melody.notes[i] || 0;

      // 1. ПРАВАЯ РУКА (МЕЛОДИЯ)
      if (freq !== 0) {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
       
        osc.connect(noteGain);
        noteGain.connect(musicGain); 
        noteGain.connect(delayNode); 

        osc.type = melody.type;
        osc.frequency.setValueAtTime(freq, now + i * noteLength);
        
        noteGain.gain.setValueAtTime(0, now + i * noteLength);
        noteGain.gain.linearRampToValueAtTime(0.45, now + i * noteLength + 0.01); 
        noteGain.gain.linearRampToValueAtTime(0.25, now + i * noteLength + noteLength * 0.6); 
        noteGain.gain.linearRampToValueAtTime(0, now + i * noteLength + noteLength); 
        
        osc.start(now + i * noteLength);
        osc.stop(now + i * noteLength + noteLength);
        musicOscillators.push(osc);
      }

      // 2. ЛЕВУЯ РУКА (АККОРДЫ / БАС)
      if ('chords' in melody && melody.chords && melody.chords[i] && melody.chords[i] !== 0) {
        const chordFreq = melody.chords[i];
        const chordOsc = ctx.createOscillator();
        const chordGain = ctx.createGain();
        
        chordOsc.connect(chordGain);
        chordGain.connect(musicGain);
        
        chordOsc.type = (melody as any).chordType || 'triangle'; 
        chordOsc.frequency.setValueAtTime(chordFreq, now + i * noteLength);
        
        chordGain.gain.setValueAtTime(0, now + i * noteLength);
        chordGain.gain.linearRampToValueAtTime(0.5, now + i * noteLength + 0.03);
        chordGain.gain.linearRampToValueAtTime(0.3, now + i * noteLength + noteLength * 0.8);
        chordGain.gain.linearRampToValueAtTime(0, now + i * noteLength + noteLength);
        
        chordOsc.start(now + i * noteLength);
        chordOsc.stop(now + i * noteLength + noteLength);
        musicOscillators.push(chordOsc); 
      }
    }

    melodyTimeout = window.setTimeout(() => {
      if (musicPlaying) {
        currentMelodyIndex = (currentMelodyIndex + 1) % melodies.length;
        playMelodyLoop();
      }
    }, maxLength * noteLength * 1000);
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
