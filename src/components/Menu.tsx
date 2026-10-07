import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlayerName, savePlayerName, getPlayerStats, getLeaderboard } from '../utils/cookies';
import { Difficulty, DIFFICULTY_LABELS } from '../utils/gameLogic';
import { playClickSound } from '../utils/sounds';

interface MenuProps {
  onStartGame: (difficulty: Difficulty, playerName: string) => void;
}

// Floating mine animation component
function FloatingMine({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute text-white/5 pointer-events-none select-none"
      style={{ left: `${x}%`, fontSize: size }}
      initial={{ y: '110vh', rotate: 0 }}
      animate={{ y: '-10vh', rotate: 360 }}
      transition={{
        duration: 15 + Math.random() * 10,
        delay: delay,
        repeat: Infinity,
        ease: 'linear',
      }}
    >
      💣
    </motion.div>
  );
}

export default function Menu({ onStartGame }: MenuProps) {
  const [playerName, setPlayerName] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('easy');

  useEffect(() => {
    const saved = getPlayerName();
    if (saved) setPlayerName(saved);
  }, []);

  const handleStart = useCallback(() => {
    if (!playerName.trim()) return;
    savePlayerName(playerName.trim());
    // Initialize audio context on user interaction (required for iOS Safari)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        ctx.resume();
        ctx.close();
      }
    } catch (e) { /* ignore */ }
    playClickSound();
    onStartGame(selectedDifficulty, playerName.trim());
  }, [playerName, selectedDifficulty, onStartGame]);

  const stats = playerName ? getPlayerStats(playerName) : null;

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'super',];
  const diffIcons: Record<Difficulty, string> = { easy: '😊', medium: '😎', hard: '🔥', super: '🤯', };
  const diffDescriptions: Record<Difficulty, string> = {
    easy: '9×9 • 10 мин',
    medium: '16×16 • 40 мин',
    hard: '16×30 • 99 мин',
    super: '4100x4100 • 3 342 350 мин',
  };

  const floatingMines = Array.from({ length: 32 }, (_, i) => ({
    delay: i * 1.5,
    x: Math.random() * 90 + 5,
    size: Math.random() * 20 + 20,
  }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 relative overflow-hidden">
      {/* Floating mines background */}
      {floatingMines.map((mine, i) => (
        <FloatingMine key={i} {...mine} />
      ))}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-6 relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-6xl md:text-7xl mb-2"
        >
          💣
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-1 tracking-tight">
          Сапёр
        </h1>
        <p className="text-gray-400 text-sm md:text-base">Классическая головоломка</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showStats && !showLeaderboard ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-4 relative z-10"
          >
            {/* Player Name Input */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <label className="block text-white/80 text-xs mb-2 font-medium uppercase tracking-wide">
                👤 Имя игрока
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Введите ваше имя..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-base"
                maxLength={20}
                autoComplete="off"
              />
            </div>

            {/* Difficulty Selection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-5 border border-white/20">
              <label className="block text-white/80 text-xs mb-3 font-medium uppercase tracking-wide">
                🎯 Сложность
              </label>
              <div className="space-y-2">
                {difficulties.map((diff) => (
                  <motion.button
                    key={diff}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedDifficulty(diff); playClickSound(); }}
                    className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-all flex items-center gap-3 ${
                      selectedDifficulty === diff
                        ? 'bg-blue-500/30 text-white border-2 border-blue-400/50 shadow-lg shadow-blue-500/10'
                        : 'bg-white/5 text-white/60 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{diffIcons[diff]}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{DIFFICULTY_LABELS[diff]}</div>
                      <div className="text-xs opacity-60">{diffDescriptions[diff]}</div>
                    </div>
                    {selectedDifficulty === diff && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-blue-400"
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              disabled={!playerName.trim()}
              className={`w-full py-4 rounded-2xl text-xl font-bold transition-all ${
                playerName.trim()
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 active:shadow-xl active:from-green-600 active:to-emerald-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              🎮 Начать игру
            </motion.button>

            {/* Stats & Leaderboard Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowStats(true); playClickSound(); }}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium border border-white/10 active:bg-white/15"
              >
                📊 Статистика
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setShowLeaderboard(true); playClickSound(); }}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium border border-white/10 active:bg-white/15"
              >
                🏆 Рекорды
              </motion.button>
            </div>
          </motion.div>
        ) : showStats ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm relative z-10"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-5 text-center">📊 Статистика</h2>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-white">{stats.gamesPlayed}</div>
                      <div className="text-xs text-white/50">Игр сыграно</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.gamesWon}</div>
                      <div className="text-xs text-white/50">Побед</div>
                    </div>
                  </div>
                  <hr className="border-white/10" />
                  <div className="text-white/70 font-medium text-sm uppercase tracking-wide">Лучшее время</div>
                  {difficulties.map(diff => (
                    <div key={diff} className="flex justify-between items-center text-white/70 bg-white/5 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-2">
                        <span>{diffIcons[diff]}</span>
                        <span>{DIFFICULTY_LABELS[diff]}</span>
                      </span>
                      <span className="font-mono text-yellow-400 font-bold">
                        {stats.bestTimes[diff] !== null
                          ? `${Math.floor(stats.bestTimes[diff]! / 60)}:${String(stats.bestTimes[diff]! % 60).padStart(2, '0')}`
                          : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50 text-center py-4">Введите имя для просмотра статистики</p>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowStats(false)}
                className="w-full mt-5 py-3 rounded-xl bg-white/10 text-white/70 font-medium border border-white/10 active:bg-white/15"
              >
                ← Назад
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm relative z-10"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-5 text-center">🏆 Таблица рекордов</h2>
              {difficulties.map(diff => {
                const board = getLeaderboard(diff);
                return (
                  <div key={diff} className="mb-4">
                    <h3 className="text-white/70 font-medium mb-2 flex items-center gap-2">
                      <span>{diffIcons[diff]}</span>
                      <span>{DIFFICULTY_LABELS[diff]}</span>
                    </h3>
                    {board.length > 0 ? (
                      <div className="space-y-1">
                        {board.slice(0, 5).map((result, i) => (
                          <div key={i} className="flex justify-between text-sm text-white/60 px-3 py-2 bg-white/5 rounded-lg">
                            <span className="flex items-center gap-2">
                              <span className="text-yellow-500 font-bold w-5">{i + 1}.</span>
                              <span>{result.playerName}</span>
                            </span>
                            <span className="font-mono text-yellow-400">
                              {Math.floor(result.time / 60)}:{String(result.time % 60).padStart(2, '0')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/30 text-sm py-1">Пока нет результатов</p>
                    )}
                  </div>
                );
              })}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLeaderboard(false)}
                className="w-full mt-4 py-3 rounded-xl bg-white/10 text-white/70 font-medium border border-white/10 active:bg-white/15"
              >
                ← Назад
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
