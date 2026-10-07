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
    // Правая рука (мелодия остается в 4-й октаве для контраста)
    notes: [
      392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66,
      392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66, 329.63
    ],
    // Левая рука (бас в Большой октаве — звучит тяжело и зловеще)
    chords: [
      // Под Em: 6 нот звучит E (164.81), следующие 7 нот звучит B (246.94)
      164.81, 164.81, 164.81, 164.81, 164.81, 164.81, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94,
      // Под Am и Bm во второй половине
      220.00, 220.00, 220.00, 220.00, 220.00, 220.00, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 164.81
    ],
    tempo: 0.2,
    type: 'square',
    chordType: 'square'
  },
];

const menuMelodies: Melody[] = [
  // {
  //   // Правая рука (мелодия остается в 4-й октаве для контраста)
  //   notes: [
  //     392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66,
  //     392, 329.63, 440, 329.63, 369.99, 392, 329.63, 493.88, 440, 392, 369.99, 329.63, 293.66, 329.63
  //   ],
  //   // Левая рука (бас в Большой октаве — звучит тяжело и зловеще)
  //   chords: [
  //     // Под Em: 6 нот звучит E (164.81), следующие 7 нот звучит B (246.94)
  //     164.81, 164.81, 164.81, 164.81, 164.81, 164.81, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94,
  //     // Под Am и Bm во второй половине
  //     220.00, 220.00, 220.00, 220.00, 220.00, 220.00, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 246.94, 164.81
  //   ],
  //   tempo: 0.2,
  //   type: 'square',
  //   chordType: 'square'
  // },
  
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
}

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
    
    // Создаём эффект эха (delay)
    const delayNode = ctx.createDelay();
    const delayGain = ctx.createGain();
    
    delayNode.delayTime.setValueAtTime(noteLength, now);
    delayGain.gain.setValueAtTime(0.35, now);
    
    // Соединяем цепочку эха
    delayNode.connect(delayGain);
    delayGain.connect(musicGain);
    delayGain.connect(delayNode); // Обратная связь для красивого хвоста

    // Вычисляем максимальную длину, чтобы не потерять ноты баса или мелодии
    const chordsLen = ('chords' in melody && melody.chords) ? melody.chords.length : 0;
    const maxLength = Math.max(melody.notes.length, chordsLen);

    // Заменяем forEach на классический for, чтобы пройти по всей длине трека
    for (let i = 0; i < maxLength; i++) {
      const freq = melody.notes[i] || 0;

      // 1. ИГРАЕМ ПРАВУЮ РУКУ (МЕЛОДИЯ)
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

      // 2. ИГРАЕМ ЛЕВУЮ РУКУ (АККОРДЫ / БАС)
      if ('chords' in melody && melody.chords && melody.chords[i] && melody.chords[i] !== 0) {
        const chordFreq = melody.chords[i];
        const chordOsc = ctx.createOscillator();
        const chordGain = ctx.createGain();

        chordOsc.connect(chordGain);
        chordGain.connect(musicGain);

        chordOsc.type = (melody as any).chordType || 'triangle'; 
        chordOsc.frequency.setValueAtTime(chordFreq, now + i * noteLength);

        // ИСПРАВЛЕНО: Изменяем chordGain вместо несуществующей noteGain
        chordGain.gain.setValueAtTime(0, now + i * noteLength);
        chordGain.gain.linearRampToValueAtTime(0.12, now + i * noteLength + 0.03);
        chordGain.gain.linearRampToValueAtTime(0.10, now + i * noteLength + noteLength * 0.8);
        chordGain.gain.linearRampToValueAtTime(0, now + i * noteLength + noteLength);

        chordOsc.start(now + i * noteLength);
        chordOsc.stop(now + i * noteLength + noteLength);
        musicOscillators.push(chordOsc); 
      }
    }

    // Планируем следующий цикл по максимальной длине трека
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
