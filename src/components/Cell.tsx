import { memo } from 'react';
import { motion } from 'framer-motion';
import { CellRenderData } from '../utils/gameLogic';
import { NUMBER_COLORS } from '../utils/constants';

interface CellProps {
  cell: CellRenderData;
  gameOver: boolean;
  gameWon: boolean;
  cellSize: number;
  miniMapMode?: boolean;
  disabled?: boolean;
}

function CellComponent({ cell, gameOver, gameWon, cellSize, miniMapMode = false, disabled = false }: CellProps) {
  const { row, col, isMine, isRevealed, isFlagged, adjacentMines } = cell;

  const getContent = () => {
    if (isFlagged && !isRevealed) return '🚩';
    if (!isRevealed) return '';
    if (isMine) return gameWon ? '🚩' : '💣';
    if (adjacentMines > 0) return adjacentMines.toString();
    return '';
  };

  const isFontSize = Math.max(cellSize * 0.5, 10);
  const isEmojiSize = Math.max(cellSize * 0.55, 12);

  return (
    <div
      className={`
        flex items-center justify-center font-bold select-none
        border border-gray-400/20
        transition-all duration-75
        ${isRevealed
          ? isMine
            ? gameWon
              ? 'bg-green-200'
              : 'bg-red-300'
            : miniMapMode
              ? 'bg-green-400'
              : 'bg-gray-100'
          : 'bg-gradient-to-br from-slate-200 to-slate-300'
        }
        ${!isRevealed ? 'shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),inset_-1px_-1px_2px_rgba(0,0,0,0.15)]' : ''}
        ${isRevealed ? 'shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]' : ''}
      `}
      style={{
        width: cellSize,
        height: cellSize,
        fontSize: adjacentMines > 0 ? isFontSize : isEmojiSize,
        lineHeight: 1,
        padding: 0,
        minWidth: cellSize,
        minHeight: cellSize,
      }}
      data-row={row}
      data-col={col}
      data-disabled={disabled || gameOver || gameWon}
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ 
          type: 'spring', 
          stiffness: 500, 
          damping: 25 
        }}
        className={`${isRevealed && !isMine && adjacentMines > 0 ? NUMBER_COLORS[adjacentMines] || '' : ''} pointer-events-none`}
      >
        {getContent()}
      </motion.span>
    </div>
  );
}

export default memo(CellComponent);
