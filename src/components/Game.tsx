import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type Difficulty,
  type OptimizedBoard,
  DIFFICULTY_CONFIG,
  createOptimizedBoard,
  placeMines,
  revealCell,
  revealAllMines,
  checkWin,
  countFlags,
  chordReveal,
  toggleCellFlag,
  getVisibleCells,
} from '../utils/gameLogic';
import {
  DIFFICULTY_LABELS,
  GAME_CONSTANTS,
} from '../utils/constants';
import {
  saveGameResult,
  getSoundPreference,
  saveSoundPreference,
  getMusicPreference,
  saveMusicPreference,
} from '../utils/cookies';
import {
  playRevealSound,
  playFlagSound,
  playExplosionSound,
  playWinSound,
  playClickSound,
  startBackgroundMusic,
  stopBackgroundMusic,
  switchMelody,
} from '../utils/sounds';
import CellComponent from './Cell';

interface GameProps {
  difficulty: Difficulty;
  playerName: string;
  onBackToMenu: () => void;
}

type GameState = 'playing' | 'won' | 'lost';

export default function Game({ difficulty, playerName, onBackToMenu }: GameProps) {
  const config = DIFFICULTY_CONFIG[difficulty];
  const [board, setBoard] = useState<OptimizedBoard>(() => createOptimizedBoard(config));
  const [gameState, setGameState] = useState<GameState>('playing');
  const [timer, setTimer] = useState(0);
  const [firstClick, setFirstClick] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(getSoundPreference());
  const [musicEnabled, setMusicEnabled] = useState(getMusicPreference());
  const [showSettings, setShowSettings] = useState(false);
  const [cellSize, setCellSize] = useState(32);
  const [isShaking, setIsShaking] = useState(false);
  const [renderVersion, setRenderVersion] = useState(0); // Force re-render
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [showExplosionOverlay, setShowExplosionOverlay] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = нормальный масштаб
  
  const timerRef = useRef<number | null>(null);
  const explosionTimerRef = useRef<number | null>(null);
  const gameStateRef = useRef(gameState);
  const firstClickRef = useRef(firstClick);
  const timerValueRef = useRef(timer);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef<number>(1);

  // Keep refs in sync
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { firstClickRef.current = firstClick; }, [firstClick]);
  useEffect(() => { timerValueRef.current = timer; }, [timer]);

  // Calculate cell size based on screen and zoom
  useEffect(() => {
    function calculateCellSize() {
      const screenWidth = window.innerWidth;
      const padding = screenWidth * 0.05; // 5% отступы по бокам
      const availableWidth = screenWidth - padding * 2;
      
      // Базовый размер: 20 столбцов на экран при zoom = 1
      const baseCellSize = availableWidth / 20;
      
      // Применяем zoom
      const zoomedCellSize = baseCellSize * zoomLevel;
      
      // Ограничения:
      // Минимум: 200 столбцов на экран (очень мелко)
      // Максимум: 9 столбцов на экран (очень крупно)
      const minCellSize = availableWidth / 200;
      const maxCellSize = availableWidth / 9;
      
      const finalSize = Math.max(minCellSize, Math.min(maxCellSize, zoomedCellSize));
      setCellSize(finalSize);
    }
    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);
    window.addEventListener('orientationchange', calculateCellSize);
    return () => {
      window.removeEventListener('resize', calculateCellSize);
      window.removeEventListener('orientationchange', calculateCellSize);
    };
  }, [config, zoomLevel]);

  // Viewport size tracking
  useEffect(() => {
    function updateViewport() {
      if (scrollContainerRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    }
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Scroll handler
  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  }, []);

  // Pinch zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
      pinchStartZoom.current = zoomLevel;
    }
  }, [zoomLevel]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistance.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      const scale = currentDistance / pinchStartDistance.current;
      const newZoom = pinchStartZoom.current * scale;
      
      // Ограничения zoom:
      // Минимум: 200 столбцов на экран (zoom = 20/200 = 0.1)
      // Максимум: 9 столбцов на экран (zoom = 20/9 ≈ 2.22)
      const minZoom = 20 / 200; // 0.1
      const maxZoom = 20 / 9;   // ≈ 2.22
      setZoomLevel(Math.max(minZoom, Math.min(maxZoom, newZoom)));
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDistance.current = null;
    }
  }, []);

  // Timer
  useEffect(() => {
    if (gameState === 'playing' && !firstClick) {
      timerRef.current = window.setInterval(() => {
        setTimer(t => t + 1);
      }, GAME_CONSTANTS.TIMER_INTERVAL);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, firstClick]);

  // Music
  useEffect(() => {
    if (musicEnabled) {
      startBackgroundMusic(false);
    } else {
      stopBackgroundMusic();
    }
    return () => stopBackgroundMusic();
  }, [musicEnabled]);

  // Explosion overlay auto-hide
  useEffect(() => {
    if (gameState === 'lost') {
      setShowExplosionOverlay(true);
      explosionTimerRef.current = window.setTimeout(() => {
        setShowExplosionOverlay(false);
      }, GAME_CONSTANTS.EXPLOSION_OVERLAY_DURATION);
    } else {
      setShowExplosionOverlay(false);
    }
    return () => {
      if (explosionTimerRef.current) {
        clearTimeout(explosionTimerRef.current);
        explosionTimerRef.current = null;
      }
    };
  }, [gameState]);

  const triggerReRender = useCallback(() => {
    setRenderVersion(v => v + 1);
  }, []);

  const handleReveal = useCallback((row: number, col: number) => {
    if (gameStateRef.current !== 'playing') return;

    setBoard(currentBoard => {
      if (firstClickRef.current) {
        placeMines(currentBoard, row, col, config.mines);
        setFirstClick(false);
      }

      const result = revealCell(currentBoard, row, col);
      
      if (soundEnabled) {
        if (result.hitMine) {
          playExplosionSound();
        } else {
          playRevealSound();
        }
      }

      if (result.hitMine) {
        setGameState('lost');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        saveGameResult({
          playerName,
          difficulty,
          time: 0,
          date: new Date().toISOString(),
        });
        revealAllMines(currentBoard);
        triggerReRender();
        return currentBoard;
      }

      if (checkWin(currentBoard)) {
        setGameState('won');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (soundEnabled) playWinSound();
        if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 200]);
        saveGameResult({
          playerName,
          difficulty,
          time: timerValueRef.current,
          date: new Date().toISOString(),
        });
      }

      triggerReRender();
      return currentBoard;
    });
  }, [config, soundEnabled, playerName, difficulty, triggerReRender]);

  const handleFlag = useCallback((row: number, col: number) => {
    if (gameStateRef.current !== 'playing') return;
    if (firstClickRef.current) return;

    setBoard(currentBoard => {
      toggleCellFlag(currentBoard, row, col);
      if (soundEnabled) playFlagSound();
      triggerReRender();
      return currentBoard;
    });
  }, [soundEnabled, triggerReRender]);

  const handleChord = useCallback((row: number, col: number) => {
    if (gameStateRef.current !== 'playing') return;

    setBoard(currentBoard => {
      const result = chordReveal(currentBoard, row, col);
      
      if (result.revealed.length === 0) return currentBoard;

      if (soundEnabled) {
        if (result.hitMine) {
          playExplosionSound();
        } else {
          playRevealSound();
        }
      }

      if (result.hitMine) {
        setGameState('lost');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        saveGameResult({
          playerName,
          difficulty,
          time: 0,
          date: new Date().toISOString(),
        });
        revealAllMines(currentBoard);
        triggerReRender();
        return currentBoard;
      }

      if (checkWin(currentBoard)) {
        setGameState('won');
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (soundEnabled) playWinSound();
        saveGameResult({
          playerName,
          difficulty,
          time: timerValueRef.current,
          date: new Date().toISOString(),
        });
      }

      triggerReRender();
      return currentBoard;
    });
  }, [soundEnabled, playerName, difficulty, triggerReRender]);

  const handleRestart = () => {
    if (soundEnabled) playClickSound();
    setBoard(createOptimizedBoard(config));
    setGameState('playing');
    setTimer(0);
    setFirstClick(true);
    setIsShaking(false);
    setShowExplosionOverlay(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (explosionTimerRef.current) {
      clearTimeout(explosionTimerRef.current);
      explosionTimerRef.current = null;
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      scrollContainerRef.current.scrollLeft = 0;
    }
    triggerReRender();
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    saveSoundPreference(newVal);
  };

  const toggleMusic = () => {
    const newVal = !musicEnabled;
    setMusicEnabled(newVal);
    saveMusicPreference(newVal);
  };

  const handleSwitchMelody = () => {
    switchMelody(false);
    if (soundEnabled) playClickSound();
  };

  const flagCount = countFlags(board);
  const minesLeft = config.mines - flagCount;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Get visible cells for virtualization
  const visibleCells = getVisibleCells(
    board,
    scrollTop,
    scrollLeft,
    viewportSize.height,
    viewportSize.width,
    cellSize,
    GAME_CONSTANTS.VIRTUALIZATION.BUFFER_CELLS
  );

  const totalBoardWidth = config.cols * (cellSize + GAME_CONSTANTS.CELL_GAP) + GAME_CONSTANTS.CELL_GAP;
  const totalBoardHeight = config.rows * (cellSize + GAME_CONSTANTS.CELL_GAP) + GAME_CONSTANTS.CELL_GAP;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 bg-black/40 backdrop-blur-sm border-b border-white/10 shrink-0"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top))' }}>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { if (soundEnabled) playClickSound(); onBackToMenu(); }}
          className="px-3 py-2 rounded-lg bg-white/10 text-white/80 text-xs sm:text-sm font-medium active:bg-white/20"
        >
          ← Меню
        </motion.button>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-center min-w-[50px]">
            <div className="text-[10px] text-white/50 uppercase tracking-wide">💣 Мины</div>
            <div className="text-base sm:text-lg font-bold text-red-400 font-mono">{minesLeft}</div>
          </div>
          <div className="text-center min-w-[50px]">
            <div className="text-[10px] text-white/50 uppercase tracking-wide">⏱ Время</div>
            <div className="text-base sm:text-lg font-bold text-yellow-400 font-mono">{formatTime(timer)}</div>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowSettings(!showSettings)}
          className="px-3 py-2 rounded-lg bg-white/10 text-white/80 text-sm font-medium active:bg-white/20"
        >
          ⚙️
        </motion.button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-black/40 backdrop-blur-sm border-b border-white/10 shrink-0"
          >
            <div className="p-3 flex flex-wrap gap-2 justify-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleSound}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  soundEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/50 border border-white/10'
                }`}
              >
                🔊 Звуки {soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMusic}
                className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  musicEnabled ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/50 border border-white/10'
                }`}
              >
                🎵 Музыка {musicEnabled ? 'ВКЛ' : 'ВЫКЛ'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSwitchMelody}
                className="px-3 py-2 rounded-lg text-xs sm:text-sm font-medium bg-white/5 text-white/50 border border-white/10 active:bg-white/10"
              >
                🎶 Мелодия
              </motion.button>
              <div className="px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs sm:text-sm border border-white/10">
                👤 {playerName} • {DIFFICULTY_LABELS[difficulty]}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Board - Virtualized */}
      <div 
        ref={scrollContainerRef}
        className={`flex-1 overflow-auto transition-all duration-500 ${
          gameState === 'lost' ? 'opacity-70' : ''
        }`}
        style={{ 
          marginTop: '5vh', 
          marginBottom: '5vh',
          touchAction: 'pan-x pan-y'
        }}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.div
          animate={isShaking ? { x: [0, -5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="relative"
          style={{
            width: totalBoardWidth,
            height: totalBoardHeight,
          }}
        >
          {/* Render only visible cells */}
          {visibleCells.map((cell) => (
            <div
              key={`${cell.row}-${cell.col}`}
              style={{
                position: 'absolute',
                left: cell.col * (cellSize + GAME_CONSTANTS.CELL_GAP) + GAME_CONSTANTS.CELL_GAP,
                top: cell.row * (cellSize + GAME_CONSTANTS.CELL_GAP) + GAME_CONSTANTS.CELL_GAP,
              }}
            >
              <CellComponent
                cell={cell}
                gameOver={gameState === 'lost'}
                gameWon={gameState === 'won'}
                onReveal={handleReveal}
                onFlag={handleFlag}
                onChord={handleChord}
                cellSize={cellSize}
                miniMapMode={zoomLevel < 1}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Hint for mobile */}
      <div className="text-center text-[10px] text-white/30 pb-1 shrink-0">
        Нажмите — открыть • Удерживайте — поставить флаг
      </div>

      {/* Bottom bar */}
      <div className="flex justify-center gap-2 pb-2 shrink-0 px-2"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {gameState === 'lost' && !showExplosionOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleRestart}
              className="px-4 py-2.5 rounded-xl bg-red-500/20 text-red-300 font-medium border border-red-500/30 text-sm active:bg-red-500/30"
            >
              🔄 Заново
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBackToMenu}
              className="px-4 py-2.5 rounded-xl bg-white/10 text-white/80 font-medium border border-white/10 text-sm active:bg-white/20"
            >
              ← В меню
            </motion.button>
          </motion.div>
        )}
        {gameState !== 'lost' && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRestart}
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white/80 font-medium border border-white/10 text-sm active:bg-white/20"
          >
            🔄 Новая игра
          </motion.button>
        )}
      </div>

      {/* Game Over / Win Overlay */}
      <AnimatePresence>
        {(gameState === 'won' || (gameState === 'lost' && showExplosionOverlay)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`w-full max-w-xs rounded-3xl p-8 text-center shadow-2xl ${
                gameState === 'won'
                  ? 'bg-gradient-to-br from-green-500 to-emerald-700'
                  : 'bg-gradient-to-br from-red-500 to-red-800'
              }`}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="text-6xl mb-4"
              >
                {gameState === 'won' ? '🎉' : '💥'}
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {gameState === 'won' ? 'Победа!' : 'Взрыв!'}
              </h2>
              <p className="text-white/80 mb-1">
                {gameState === 'won' ? 'Все мины найдены!' : 'Вы наступили на мину'}
              </p>
              {gameState === 'won' && (
                <p className="text-xl font-mono text-yellow-200 mb-2">
                  ⏱ {formatTime(timer)}
                </p>
              )}
              <div className="space-y-2 mt-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestart}
                  className="w-full py-3 rounded-xl bg-white/20 text-white font-bold text-lg border border-white/30 active:bg-white/30"
                >
                  🔄 Играть снова
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onBackToMenu}
                  className="w-full py-3 rounded-xl bg-white/10 text-white/80 font-medium border border-white/20 active:bg-white/20"
                >
                  ← В меню
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
