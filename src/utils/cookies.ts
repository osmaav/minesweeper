export interface GameResult {
  playerName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time: number;
  date: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimes: {
    easy: number | null;
    medium: number | null;
    hard: number | null;
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

export function savePlayerName(name: string) {
  setCookie('minesweeper_player', name);
}

export function getPlayerName(): string | null {
  return getCookie('minesweeper_player');
}

export function saveGameResult(result: GameResult) {
  const existing = getResults();
  existing.push(result);
  setCookie('minesweeper_results', JSON.stringify(existing));
}

export function getResults(): GameResult[] {
  const raw = getCookie('minesweeper_results');
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getPlayerStats(playerName: string): PlayerStats {
  const results = getResults().filter(r => r.playerName === playerName);
  const wins = results.filter(r => r.time > 0);
  
  const bestTimes = {
    easy: null as number | null,
    medium: null as number | null,
    hard: null as number | null,
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

export function getLeaderboard(difficulty: 'easy' | 'medium' | 'hard'): GameResult[] {
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
  return val !== '0'; // Default to true
}

export function saveMusicPreference(enabled: boolean) {
  setCookie('minesweeper_music', enabled ? '1' : '0');
}

export function getMusicPreference(): boolean {
  const val = getCookie('minesweeper_music');
  return val !== '0'; // Default to true
}
