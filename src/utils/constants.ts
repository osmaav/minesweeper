// ============ ИГРОВЫЕ КОНСТАНТЫ ============

export const GAME_CONSTANTS = {
  // Размеры ячеек
  CELL_SIZE_MIN: 25,
  CELL_SIZE_MAX: 44,
  CELL_GAP: 1,
  
  // Таймеры
  LONG_PRESS_DURATION: 500,
  TIMER_INTERVAL: 1000,
  
  // Звуки
  AUDIO_VOLUME: {
    MUSIC: 0.08,
    REVEAL: 0.3,
    FLAG: 0.2,
    EXPLOSION: 0.5,
    WIN: 0.3,
    CLICK: 0.15,
  },
  
  // Анимации
  ANIMATION: {
    SCALE_TAP: 0.88,
    SPRING_STIFFNESS: 500,
    SPRING_DAMPING: 25,
  },
  
  // Виртуализация
  VIRTUALIZATION: {
    BUFFER_CELLS: 5, // Дополнительные ячейки за пределами viewport
    SCROLL_THRESHOLD: 10,
  },
  
  // Cookies
  COOKIE_EXPIRY_DAYS: 365,
  
  // Ограничения
  MAX_PLAYER_NAME_LENGTH: 50,
  MAX_LEADERBOARD_ENTRIES: 10,
  
  // UI
  OVERLAY_DURATION: 3000, // 3 секунд показа сообщения
} as const;

// ============ УРОВНИ СЛОЖНОСТИ ============

export type Difficulty = 'easy' | 'medium' | 'hard' | 'super';

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, GameConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 30, cols: 30, mines: 99 },
  super: { rows: 410, cols: 410, mines: 333 }, //{ rows: 4100, cols: 4100, mines: 3342350 },
} as const;

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
  super: 'Экстремальный',
} as const;

export const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  easy: '😊',
  medium: '😎',
  hard: '🔥',
  super: '💀',
} as const;

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  easy: '9×9 • 10 мин',
  medium: '16×16 • 40 мин',
  hard: '30×30 • 99 мин',
  super: '410×410 • 333 мины', //'4100×4100 • 3,342,350 мин',
} as const;

// ============ ЦВЕТА ЧИСЕЛ ============

export const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-700',
  3: 'text-red-600',
  4: 'text-purple-700',
  5: 'text-red-800',
  6: 'text-teal-600',
  7: 'text-gray-800',
  8: 'text-gray-500',
} as const;

// ============ МЕЛОДИИ ============

export const MELODY_TEMPOS = {
  FAST: 0.2,
  MEDIUM: 0.3,
  SLOW: 0.45,
} as const;
