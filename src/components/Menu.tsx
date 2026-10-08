import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPlayerName, savePlayerName, getPlayerStats, getLeaderboard } from '../utils/cookies';
import { 
  type Difficulty, 
  DIFFICULTY_LABELS, 
  DIFFICULTY_ICONS, 
  DIFFICULTY_DESCRIPTIONS 
} from '../utils/constants';
import { playClickSound, startBackgroundMusic, stopBackgroundMusic, switchMelody } from '../utils/sounds';
import { getMusicPreference, saveMusicPreference } from '../utils/cookies';

interface MenuProps {
  onStartGame: (difficulty: Difficulty, playerName: string) => void;
}

function FloatingMine({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute text-white/5 pointer-events-none select-none"
      style={{ left: `${x}%`, fontSize: size }}
      initial={{ y: '110vh', rotate: -360 }}
      animate={{ y: '-110vh', rotate: [-270, 180, -100, 50, -50, 0] }}
      transition={{
        duration: 25 + Math.random() * 50,
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
  const [musicEnabled, setMusicEnabled] = useState(getMusicPreference());

  useEffect(() => {
    const saved = getPlayerName();
    if (saved) setPlayerName(saved);
  }, []);

  useEffect(() => {
    if (musicEnabled) {
      startBackgroundMusic(true);
    } else {
      stopBackgroundMusic();
    }
    return () => stopBackgroundMusic();
  }, [musicEnabled]);

  const toggleMusic = useCallback(() => {
    const newVal = !musicEnabled;
    setMusicEnabled(newVal);
    saveMusicPreference(newVal);
    if (newVal) playClickSound();
  }, [musicEnabled]);

  // const handleSwitchMelody = useCallback(() => {
  //   switchMelody(true);
  //   playClickSound();
  // }, []);

  const handleStart = useCallback(() => {
    if (!playerName.trim()) return;
    savePlayerName(playerName.trim());
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

  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'super'];

  const floatingMines = Array.from({ length: 24 }, (_, i) => ({
    delay: i * 1.2,
    x: Math.random() * 90 + 5,
    size: Math.random() * 20 + 5,
  }));

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4 pt-4 bg-gradient-to-br from-slate-800 via-slate-900 to-gray-900 relative overflow-hidden">
      {floatingMines.map((mine, i) => (
        <FloatingMine key={i} {...mine} />
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-2 mt-15 relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, -30, 0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-6xl md:text-7xl"
        >
          💣
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-1 tracking-tight">
          Сапёр
        </h1>
        <p className="text-gray-400 text-m md:text-base">Классическая головоломка</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!showStats && !showLeaderboard ? (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-1 relative z-10"
          >
            <div className="bg-white/5 rounded-2xl p-3 mb-3">
              <label className="block text-white/80 text-m mb-1 font-medium uppercase tracking-wide">
                👤 Имя игрока
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Введите ваше имя..."
                className="w-full px-4 py-2.5 bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl text-white placeholder-white/30 
                focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-base"
                maxLength={20}
                autoComplete="off"
              />
            </div>

            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 max-h-[40vh] overflow-y-auto">
              <label className="block text-white/80 text-m mb-1 font-medium uppercase tracking-wide">
                🎯 Уровень
              </label>
              <div className="space-y-2">
                {difficulties.map((diff) => (
                  <motion.button
                    key={diff}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSelectedDifficulty(diff); playClickSound(); }}
                    className={`w-full px-3 py-2 rounded-xl backdrop-blur-xs text-left font-medium transition-all flex items-center gap-3 ${
                      selectedDifficulty === diff
                        ? 'bg-blue-500/30 text-white border-2 border-blue-400/50 shadow-lg shadow-blue-500/10'
                        : 'bg-white/5 text-white/60 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{DIFFICULTY_ICONS[diff]}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{DIFFICULTY_LABELS[diff]}</div>
                      <div className="text-xs opacity-60">{DIFFICULTY_DESCRIPTIONS[diff]}</div>
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

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleStart}
              disabled={!playerName.trim()}
              className={`w-full mt-3 py-4 rounded-2xl backdrop-blur-xs text-xl font-bold transition-all ${
                playerName.trim()
                  ? 'bg-gradient-to-r from-green-500/30 to-emerald-700/30 text-white shadow-lg shadow-green-700/10 active:shadow-xl active:from-green-600/10 active:to-emerald-700'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              🎮 Начать игру
            </motion.button>

            <div className="flex gap-3 mb-2 mt-1">
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

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMusic}
                className={`flex-1 py-3 rounded-xl font-medium border transition-all ${
                  musicEnabled 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : 'bg-white/5 text-white/50 border-white/10'
                }`}
              >
                {musicEnabled ? '🎵 МУЗЫКА ВКЛ' : '🔇 МУЗЫКА ВЫКЛ'}
              </motion.button>
              {/* <motion.button */}
              {/*   whileTap={{ scale: 0.95 }} */}
              {/*   onClick={handleSwitchMelody} */}
              {/*   className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-medium border border-white/10 active:bg-white/15" */}
              {/* > */}
              {/*   🎶 Мелодия */}
              {/* </motion.button> */}
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
                        <span>{DIFFICULTY_ICONS[diff]}</span>
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
                      <span>{DIFFICULTY_ICONS[diff]}</span>
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
