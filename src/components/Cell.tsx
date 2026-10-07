import { memo, useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { CellData } from '../utils/gameLogic';

interface CellProps {
  cell: CellData;
  gameOver: boolean;
  gameWon: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
  cellSize: number;
}

const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-600',
  2: 'text-green-700',
  3: 'text-red-600',
  4: 'text-purple-700',
  5: 'text-red-800',
  6: 'text-teal-600',
  7: 'text-gray-800',
  8: 'text-gray-500',
};

function CellComponent({ cell, gameOver, gameWon, onReveal, onFlag, onChord, cellSize }: CellProps) {
  const { row, col, isMine, isRevealed, isFlagged, adjacentMines } = cell;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handleAction = useCallback(() => {
    if (gameOver || gameWon) return;
    if (isFlagged) return;
    if (isRevealed) {
      onChord(row, col);
      return;
    }
    onReveal(row, col);
  }, [gameOver, gameWon, isFlagged, isRevealed, row, col, onReveal, onChord]);

  const handleFlagAction = useCallback(() => {
    if (gameOver || gameWon) return;
    if (isRevealed) return;
    onFlag(row, col);
  }, [gameOver, gameWon, isRevealed, row, col, onFlag]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isLongPress.current = false;
    setIsPressed(true);
    
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setIsPressed(false);
      handleFlagAction();
      if (navigator.vibrate) {
        navigator.vibrate(30);
      }
    }, 500);
  }, [handleFlagAction]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current && touchStartPos.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        setIsPressed(false);
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressed(false);
    if (!isLongPress.current) {
      handleAction();
    }
    isLongPress.current = false;
    touchStartPos.current = null;
  }, [handleAction]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleAction();
  }, [handleAction]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleFlagAction();
  }, [handleFlagAction]);

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
    <motion.button
      className={`
        flex items-center justify-center font-bold select-none
        border border-gray-400/20
        transition-all duration-75
        ${isRevealed
          ? isMine
            ? gameWon
              ? 'bg-green-200'
              : 'bg-red-300'
            : 'bg-gray-100'
          : isPressed
            ? 'bg-gradient-to-br from-yellow-200 to-yellow-300 scale-95'
            : 'bg-gradient-to-br from-slate-200 to-slate-300'
        }
        ${!isRevealed && !isPressed ? 'shadow-[inset_1px_1px_2px_rgba(255,255,255,0.7),inset_-1px_-1px_2px_rgba(0,0,0,0.15)]' : ''}
        ${!isRevealed && isPressed ? 'shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)]' : ''}
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
        touchAction: 'none',
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        setIsPressed(false);
      }}
      initial={false}
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className={`${isRevealed && !isMine && adjacentMines > 0 ? NUMBER_COLORS[adjacentMines] || '' : ''} pointer-events-none`}
      >
        {getContent()}
      </motion.span>
    </motion.button>
  );
}

export default memo(CellComponent);
