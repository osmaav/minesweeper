import { type Difficulty } from './constants';
// ИСПРАВЛЕНИЕ БАГА: подключаем надёжное хранилище на базе localStorage.
// Причина бага «результаты побед не сохраняются в статистике и рекордах»:
// вся история игр писалась в один cookie `minesweeper_results`. Cookie
// ограничен ~4096 байтами, а encodeURIComponent() раздувает кириллицу в ~3
// раза. При переполнении браузер МОЛЧА отбрасывал запись — функция
// saveGameResult() не бросала ошибку, но данные не сохранялись.
import { rawRead, rawWrite, LS_RESULTS_KEY, LS_PLAYER_KEY } from './storage';

export interface GameResult {
  playerName: string;
  difficulty: Difficulty;
  time: number;
  date: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimes: {
    [key in Difficulty]: number | null;
  };
}

function setCookie(name: string, value: string, days: number = 365) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/;SameSite=Lax";
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return null;
}

// ИСПРАВЛЕНИЕ: имя игрока теперь хранится в localStorage (основное место),
// а cookie остаётся фолбэком для обратной совместимости со старыми данными.
export function savePlayerName(name: string) {
  rawWrite(LS_PLAYER_KEY, name);
  setCookie('minesweeper_player', name);
}

export function getPlayerName(): string | null {
  return rawRead(LS_PLAYER_KEY) ?? getCookie('minesweeper_player');
}

/**
 * ИСПРАВЛЕНИЕ: сохранение результатов переведено на localStorage.
 * localStorage вмещает мегабайты данных, поэтому список результатов больше
 * не упирается в 4-КБ лимит cookie и победы надёжно попадают в статистику
 * и таблицу рекордов. Дополнительно ведём компактный cookie-зеркало
 * (последние записи) — на случай полностью недоступного localStorage.
 */
export function saveGameResult(result: GameResult) {
  const existing = getResults();
  existing.push(result);

  // Защита от бесконечного роста списка (достаточно с запасом для топ-рекордов).
  const MAX_STORED_RESULTS = 500;
  const trimmed = existing.length > MAX_STORED_RESULTS
    ? existing.slice(existing.length - MAX_STORED_RESULTS)
    : existing;

  // Основное хранилище — localStorage.
  rawWrite(LS_RESULTS_KEY, JSON.stringify(trimmed));

  // Фолбэк — cookie: только последние записи, чтобы не превысить лимит куки.
  const COOKIE_MIRROR_SIZE = 10;
  setCookie('minesweeper_results', JSON.stringify(trimmed.slice(-COOKIE_MIRROR_SIZE)));
}

export function getResults(): GameResult[] {
  // Сначала читаем полный список из localStorage…
  const rawLS = rawRead(LS_RESULTS_KEY);
  if (rawLS) {
    try {
      const parsed = JSON.parse(rawLS);
      if (Array.isArray(parsed)) return parsed as GameResult[];
    } catch {
      // повреждённые данные игнорируем и пробуем фолбэк ниже
    }
  }

  // …если пусто (первый запуск после обновления или localStorage недоступен) —
  // читаем старые данные из cookie, чтобы история пользователя не потерялась.
  const rawCookie = getCookie('minesweeper_results');
  if (!rawCookie) return [];
  try {
    const parsed = JSON.parse(rawCookie);
    return Array.isArray(parsed) ? (parsed as GameResult[]) : [];
  } catch {
    return [];
  }
}

export function getPlayerStats(playerName: string): PlayerStats {
  const results = getResults().filter(r => r.playerName === playerName);
  const wins = results.filter(r => r.time > 0);
  
  const bestTimes: PlayerStats['bestTimes'] = {
    easy: null,
    medium: null,
    hard: null,
    super: null,
  };

  wins.forEach(r => {
    const current = bestTimes[r.difficulty];
    if (current === null || r.time < current) {
      bestTimes[r.difficulty] = r.time;
    }
  });

  return {
    gamesPlayed: results.length,
    gamesWon: wins.length,
    bestTimes,
  };
}

export function getLeaderboard(difficulty: Difficulty): GameResult[] {
  return getResults()
    .filter(r => r.difficulty === difficulty && r.time > 0)
    .sort((a, b) => a.time - b.time)
    .slice(0, 10);
}

export function saveSoundPreference(enabled: boolean) {
  setCookie('minesweeper_sound', enabled ? '1' : '0');
}

export function getSoundPreference(): boolean {
  const val = getCookie('minesweeper_sound');
  return val !== '0';
}

export function saveMusicPreference(enabled: boolean) {
  setCookie('minesweeper_music', enabled ? '1' : '0');
}

export function getMusicPreference(): boolean {
  const val = getCookie('minesweeper_music');
  return val !== '0';
}
