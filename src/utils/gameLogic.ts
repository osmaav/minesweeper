export type Difficulty = 'easy' | 'medium' | 'hard' | 'super';

export interface CellData {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, GameConfig> = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard: { rows: 16, cols: 30, mines: 99 },
  super: { rows: 4100, cols: 4100, mines: 3342350}
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Лёгкий',
  medium: 'Средний',
  hard: 'Сложный',
  super: 'Полный...' 
};

export function createBoard(config: GameConfig): CellData[][] {
  const board: CellData[][] = [];
  for (let r = 0; r < config.rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < config.cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

export function placeMines(
  board: CellData[][],
  config: GameConfig,
  safeRow: number,
  safeCol: number
): CellData[][] {
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  let minesPlaced = 0;

  while (minesPlaced < config.mines) {
    const r = Math.floor(Math.random() * config.rows);
    const c = Math.floor(Math.random() * config.cols);
    
    // Don't place mine on first click or adjacent cells
    const isSafeZone = Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;
    
    if (!newBoard[r][c].isMine && !isSafeZone) {
      newBoard[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate adjacent mines
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        getNeighbors(r, c, config).forEach(([nr, nc]) => {
          if (newBoard[nr][nc].isMine) count++;
        });
        newBoard[r][c].adjacentMines = count;
      }
    }
  }

  return newBoard;
}

function getNeighbors(row: number, col: number, config: GameConfig): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

export function revealCell(board: CellData[][], row: number, col: number, config: GameConfig): {
  newBoard: CellData[][];
  revealed: [number, number][];
  hitMine: boolean;
} {
  const newBoard = board.map(r => r.map(c => ({ ...c })));
  const revealed: [number, number][] = [];
  let hitMine = false;

  if (newBoard[row][col].isMine) {
    newBoard[row][col].isRevealed = true;
    hitMine = true;
    revealed.push([row, col]);
    return { newBoard, revealed, hitMine };
  }

  // BFS to reveal cells
  const queue: [number, number][] = [[row, col]];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const key = `${r},${c}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue;

    newBoard[r][c].isRevealed = true;
    revealed.push([r, c]);

    if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
      getNeighbors(r, c, config).forEach(([nr, nc]) => {
        if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
          queue.push([nr, nc]);
        }
      });
    }
  }

  return { newBoard, revealed, hitMine };
}

export function revealAllMines(board: CellData[][]): CellData[][] {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      isRevealed: cell.isMine ? true : cell.isRevealed,
    }))
  );
}

export function checkWin(board: CellData[][], config: GameConfig): boolean {
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < config.cols; c++) {
      const cell = board[r][c];
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

export function countFlags(board: CellData[][]): number {
  let count = 0;
  board.forEach(row => row.forEach(cell => { if (cell.isFlagged) count++; }));
  return count;
}

export function chordReveal(board: CellData[][], row: number, col: number, config: GameConfig): {
  newBoard: CellData[][];
  revealed: [number, number][];
  hitMine: boolean;
} {
  const cell = board[row][col];
  if (!cell.isRevealed || cell.adjacentMines === 0) {
    return { newBoard: board, revealed: [], hitMine: false };
  }

  const neighbors = getNeighbors(row, col, config);
  const flagCount = neighbors.filter(([nr, nc]) => board[nr][nc].isFlagged).length;

  if (flagCount !== cell.adjacentMines) {
    return { newBoard: board, revealed: [], hitMine: false };
  }

  let newBoard = board.map(r => r.map(c => ({ ...c })));
  let allRevealed: [number, number][] = [];
  let hitMine = false;

  for (const [nr, nc] of neighbors) {
    if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
      const result = revealCell(newBoard, nr, nc, config);
      newBoard = result.newBoard;
      allRevealed = [...allRevealed, ...result.revealed];
      if (result.hitMine) hitMine = true;
    }
  }

  return { newBoard, revealed: allRevealed, hitMine };
}
