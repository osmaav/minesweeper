import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Menu from './components/Menu';
import Game from './components/Game';
import { type Difficulty } from './utils/constants';

type Screen = 'menu' | 'game';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [playerName, setPlayerName] = useState('');

  const handleStartGame = (diff: Difficulty, name: string) => {
    setDifficulty(diff);
    setPlayerName(name);
    setScreen('game');
  };

  const handleBackToMenu = () => {
    setScreen('menu');
  };

  return (
    <div className="w-full h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {screen === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Menu onStartGame={handleStartGame} />
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full"
          >
            <Game
              difficulty={difficulty}
              playerName={playerName}
              onBackToMenu={handleBackToMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
