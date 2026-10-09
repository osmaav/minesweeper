import { DIFFICULTY_CONFIG, type Difficulty, type GameConfig } from './constants';

// ============ ОПТИМИЗИРОВАННАЯ СТРУКТУРА ДАННЫХ ============

// Для больших полей используем typed arrays вместо массивов объектов
// Каждая ячейка хранится как битовые флаги в Uint8Array
export interface OptimizedBoard {
  rows: number;
  cols: number;
  // Битовые флаги: 0x01 = мина, 0x02 = открыта, 0x04 = флаг
  flags: Uint8Array;
  // Количество соседних мин (0-8)
  adjacentMines: Uint8Array;
  // Общее количество ячеек
  totalCells: number;
}

// Битовые маски
const MINE_BIT = 0x01; //мина
const REVEALED_BIT = 0x02; //ячейка открыта
const FLAGGED_BIT = 0x04; // установлен флажок

// ============ ФАБРИКИ ============

export function createOptimizedBoard(config: GameConfig): OptimizedBoard {
  const totalCells = config.rows * config.cols;
  return {
    rows: config.rows,
    cols: config.cols,
    flags: new Uint8Array(totalCells),
    adjacentMines: new Uint8Array(totalCells),
    totalCells,
  };
}

// Получение индекса ячейки
function getIndex(board: OptimizedBoard, row: number, col: number): number {
  return row * board.cols + col;
}

// Проверка флагов
export function isMine(board: OptimizedBoard, row: number, col: number): boolean {
  return (board.flags[getIndex(board, row, col)] & MINE_BIT) !== 0; //мина
}

export function isRevealed(board: OptimizedBoard, row: number, col: number): boolean {
  return (board.flags[getIndex(board, row, col)] & REVEALED_BIT) !== 0; //открыта
}

export function isFlagged(board: OptimizedBoard, row: number, col: number): boolean {
  return (board.flags[getIndex(board, row, col)] & FLAGGED_BIT) !== 0; //флажок
}

export function getAdjacentMines(board: OptimizedBoard, row: number, col: number): number {
  return board.adjacentMines[getIndex(board, row, col)];
}

// Установка флагов
function setMine(board: OptimizedBoard, row: number, col: number): void {
  board.flags[getIndex(board, row, col)] |= MINE_BIT;
}

function setRevealed(board: OptimizedBoard, row: number, col: number): void {
  board.flags[getIndex(board, row, col)] |= REVEALED_BIT;
}

function toggleFlag(board: OptimizedBoard, row: number, col: number): void {
  board.flags[getIndex(board, row, col)] ^= FLAGGED_BIT;
}

// ============ РАЗМЕЩЕНИЕ МИН ============

export function placeMines(
  board: OptimizedBoard,
  safeRow: number,
  safeCol: number,
  mineCount: number
): void {
  let placed = 0;
  const { rows, cols } = board;
  
  while (placed < mineCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    
    // Безопасная зона вокруг первого клика
    const dr = Math.abs(r - safeRow);
    const dc = Math.abs(c - safeCol);
    if (dr <= 1 && dc <= 1) continue;
    
    const idx = getIndex(board, r, c);
    if ((board.flags[idx] & MINE_BIT) === 0) {
      board.flags[idx] |= MINE_BIT;
      placed++;
    }
  }
  
  // Вычисление соседних мин
  calculateAdjacentMines(board);
}

function calculateAdjacentMines(board: OptimizedBoard): void {
  const { rows, cols } = board;
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isMine(board, r, c)) continue;
      
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (isMine(board, nr, nc)) count++;
          }
        }
      }
      board.adjacentMines[getIndex(board, r, c)] = count;
    }
  }
}

// ============ ОТКРЫТИЕ ЯЧЕЕК ============

export interface RevealResult {
  revealed: Array<[number, number]>;
  hitMine: boolean;
}

export function revealCell(
  board: OptimizedBoard,
  row: number,
  col: number
): RevealResult {
  const revealed: Array<[number, number]> = [];
  
  if (isMine(board, row, col)) {
    setRevealed(board, row, col);
    return { revealed: [[row, col]], hitMine: true };
  }
  
  // BFS для открытия пустых областей
  const queue: Array<[number, number]> = [[row, col]];
  const visited = new Set<number>();
  
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = getIndex(board, r, c);
    
    if (visited.has(key)) continue;
    visited.add(key);
    
    if (isRevealed(board, r, c) || isFlagged(board, r, c)) continue;
    
    setRevealed(board, r, c);
    revealed.push([r, c]);
    
    const adj = getAdjacentMines(board, r, c);
    if (adj === 0) {
      // Добавляем соседей в очередь
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
            if (!isRevealed(board, nr, nc) && !isFlagged(board, nr, nc)) {
              queue.push([nr, nc]);
            }
          }
        }
      }
    }
  }
  
  return { revealed, hitMine: false };
}

// ============ ФЛАГИ ============

export function toggleCellFlag(board: OptimizedBoard, row: number, col: number): void {
  if (isRevealed(board, row, col)) return;
  toggleFlag(board, row, col);
}

export function countFlags(board: OptimizedBoard): number {
  let count = 0;
  for (let i = 0; i < board.totalCells; i++) {
    if ((board.flags[i] & FLAGGED_BIT) !== 0) count++;
  }
  return count;
}

// ============ ПРОВЕРКА ПОБЕДЫ ===========

export function checkWin(board: OptimizedBoard): boolean {
  for (let i = 0; i < board.totalCells; i++) {
    const isMineCell = (board.flags[i] & MINE_BIT) !== 0;
    const isRevealedCell = (board.flags[i] & REVEALED_BIT) !== 0;
    if (!isMineCell && !isRevealedCell) return false;
  }
  return true;
}

// ============ ОТКРЫТИЕ ВСЕХ МИН =========

export function revealAllMines(board: OptimizedBoard): void {
  for (let i = 0; i < board.totalCells; i++) {
    if ((board.flags[i] & MINE_BIT) !== 0) {
      board.flags[i] |= REVEALED_BIT;
    }
  }
}

// ============ ОТКРЫТИЕ ГРУПП ЯЧЕЕК ======

export function chordReveal(
  board: OptimizedBoard,
  row: number,
  col: number
): RevealResult {
  if (!isRevealed(board, row, col)) {
    return { revealed: [], hitMine: false };
  }
  
  const adj = getAdjacentMines(board, row, col);
  if (adj === 0) return { revealed: [], hitMine: false };
  
  // Подсчёт флагов вокруг
  let flagCount = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
        if (isFlagged(board, nr, nc)) flagCount++;
      }
    }
  }
  
  if (flagCount !== adj) return { revealed: [], hitMine: false };
  
  // Открываем все неотмеченные соседние ячейки
  const allRevealed: Array<[number, number]> = [];
  let hitMine = false;
  
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
        if (!isRevealed(board, nr, nc) && !isFlagged(board, nr, nc)) {
          const result = revealCell(board, nr, nc);
          allRevealed.push(...result.revealed);
          if (result.hitMine) hitMine = true;
        }
      }
    }
  }
  
  return { revealed: allRevealed, hitMine };
}

// ============ ПОЛУЧЕНИЕ ДАННЫХ ЯЧЕЙКИ ДЛЯ РЕНДЕРА ============

export interface CellRenderData {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}
 
export function getCellData(board: OptimizedBoard, row: number, col: number): CellRenderData {
  const idx = getIndex(board, row, col);
  const flags = board.flags[idx];
  return {
    row,
    col,
    isMine: (flags & MINE_BIT) !== 0,
    isRevealed: (flags & REVEALED_BIT) !== 0,
    isFlagged: (flags & FLAGGED_BIT) !== 0,
    adjacentMines: board.adjacentMines[idx],
  };
}

// ============ ПОЛУЧЕНИЕ ВИДИМЫХ ЯЧЕЕК ============

export function getVisibleCells(
  board: OptimizedBoard,
  scrollTop: number,
  scrollLeft: number,
  viewportHeight: number,
  viewportWidth: number,
  cellSize: number,
  buffer: number = 5
): CellRenderData[] {
  const startRow = Math.max(0, Math.floor(scrollTop / cellSize) - buffer);
  const endRow = Math.min(board.rows - 1, Math.ceil((scrollTop + viewportHeight) / cellSize) + buffer);
  const startCol = Math.max(0, Math.floor(scrollLeft / cellSize) - buffer);
  const endCol = Math.min(board.cols - 1, Math.ceil((scrollLeft + viewportWidth) / cellSize) + buffer);
  
  const cells: CellRenderData[] = [];
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      cells.push(getCellData(board, r, c));
    }
  }
  return cells;
}

// Экспорт конфигурации
export { DIFFICULTY_CONFIG };
export type { Difficulty, GameConfig };
