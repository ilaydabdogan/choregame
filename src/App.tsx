/** @jsxImportSource @emotion/react */
import { useState, useEffect } from "react";
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { Toaster, toast } from 'react-hot-toast';

// Styled Components
const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
`;

const Button = styled.button`
  background: #4CAF50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &.secondary {
    background: #f44336;
  }

  &.game {
    background: #2196F3;
    font-size: 1.2rem;
    padding: 12px 24px;
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    border-color: #4CAF50;
    outline: none;
  }
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;

  &::after {
    content: '';
    display: block;
    width: ${props => props.progress}%;
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s ease;
  }
`;

interface Chore {
  id: number;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastCompleted: string | null;
  streak: number;
  emoji: string;
}

function App() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [newChoreName, setNewChoreName] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChore, setCurrentChore] = useState<Chore | null>(null);
  const [timer, setTimer] = useState(30);
  const [points, setPoints] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);

  const DIFFICULTY_SETTINGS = {
    easy: { time: 45, multiplier: 1, color: '#4CAF50' },
    medium: { time: 30, multiplier: 2, color: '#FF9800' },
    hard: { time: 15, multiplier: 3, color: '#f44336' }
  };

  // Emoji mapping for common chores
  const CHORE_EMOJI_MAPPING: { [key: string]: string } = {
    // Cleaning
    'clean': '🧹',
    'vacuum': '🧹',
    'dust': '🧹',
    'sweep': '🧹',
    'mop': '🧹',
    'wash': '🧽',
    
    // Laundry
    'laundry': '👕',
    'clothes': '👕',
    'fold': '👕',
    'iron': '👔',
    
    // Kitchen
    'dishes': '🍽️',
    'dish': '🍽️',
    'kitchen': '🍳',
    'cook': '👨‍🍳',
    'cooking': '👨‍🍳',
    'meal': '🍳',
    
    // Bathroom
    'bathroom': '🚽',
    'toilet': '🚽',
    'shower': '🚿',
    
    // Bedroom
    'bed': '🛏️',
    'bedroom': '🛏️',
    'sheets': '🛏️',
    
    // Outdoor
    'garden': '🌱',
    'plant': '🌱',
    'lawn': '🌿',
    'yard': '🏡',
    'outdoor': '🏡',
    
    // Trash
    'trash': '🗑️',
    'garbage': '🗑️',
    'recycling': '♻️',
    
    // Pet Care
    'dog': '🐕',
    'cat': '🐱',
    'pet': '🐾',
    'feed': '🐾',
    'walk': '🐕',
    
    // Organization
    'organize': '📦',
    'sort': '📦',
    'declutter': '📦',
    'tidy': '🗄️',
    
    // Maintenance
    'fix': '🔧',
    'repair': '🔧',
    'maintain': '🔧',
    
    // Study/Work
    'homework': '📚',
    'study': '📚',
    'work': '💼',
    'desk': '🖥️',
    
    // Exercise
    'exercise': '🏃',
    'workout': '💪',
    'gym': '🏋️',
    
    // Default
    'default': '✨'
  };

  const findEmojiForChore = (choreName: string): string => {
    const lowercaseName = choreName.toLowerCase();
    
    // Find the first matching keyword in the chore name
    const matchingKeyword = Object.keys(CHORE_EMOJI_MAPPING).find(keyword => 
      lowercaseName.includes(keyword)
    );
    
    return matchingKeyword 
      ? CHORE_EMOJI_MAPPING[matchingKeyword]
      : CHORE_EMOJI_MAPPING.default;
  };

  // Load data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("choreGame");
    if (savedData) {
      const { chores, level, xp } = JSON.parse(savedData);
      setChores(chores);
      setLevel(level);
      setXp(xp);
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem("choreGame", JSON.stringify({
      chores,
      level,
      xp
    }));
  }, [chores, level, xp]);

  // Timer logic
  useEffect(() => {
    let countdown: number;
    if (isPlaying && timer > 0) {
      countdown = window.setTimeout(() => setTimer(timer - 1), 1000);
    } else if (isPlaying && timer === 0) {
      endGame();
    }
    return () => window.clearTimeout(countdown);
  }, [isPlaying, timer]);

  const handleAddChore = () => {
    if (!newChoreName.trim()) return;
    const newChore: Chore = {
      id: Date.now(),
      name: newChoreName,
      difficulty: selectedDifficulty,
      lastCompleted: null,
      streak: 0,
      emoji: findEmojiForChore(newChoreName)
    };
    setChores(prev => [...prev, newChore]);
    setNewChoreName("");
    toast.success(`New chore added! ${newChore.emoji}`);
  };

  const handleRemoveChore = (id: number) => {
    setChores(prev => prev.filter(chore => chore.id !== id));
    toast.success('Chore removed!');
  };

  const startGame = (chore: Chore) => {
    setIsPlaying(true);
    setCurrentChore(chore);
    const { time } = DIFFICULTY_SETTINGS[chore.difficulty];
    setTimer(time);
    setPoints(0);
    toast.success('Game started! Good luck!');
  };

  const endGame = () => {
    if (currentChore) {
      const finalPoints = points * DIFFICULTY_SETTINGS[currentChore.difficulty].multiplier;
      const newXp = xp + finalPoints;
      const newLevel = Math.floor(newXp / 1000) + 1;
      
      setXp(newXp);
      if (newLevel > level) {
        setLevel(newLevel);
        setShowConfetti(true);
        toast.success('Level Up! 🎉');
        setTimeout(() => setShowConfetti(false), 5000);
      }

      const updatedChore = {
        ...currentChore,
        lastCompleted: new Date().toISOString(),
        streak: updateStreak(currentChore)
      };

      setChores(prev => 
        prev.map(c => c.id === currentChore.id ? updatedChore : c)
      );

      toast.success(`Game completed! You earned ${finalPoints} points!`);
    }

    setIsPlaying(false);
    setCurrentChore(null);
  };

  const updateStreak = (chore: Chore) => {
    if (!chore.lastCompleted) return 1;
    
    const lastCompleted = new Date(chore.lastCompleted);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return chore.streak + 1;
    return 1;
  };

  return (
    <Container>
      {showConfetti && <Confetti />}
      <Toaster position="top-right" />
      
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', color: '#2196F3', marginBottom: '0.5rem' }}
      >
        Chore Champion
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', color: '#666', fontSize: '1.1rem', marginBottom: '2rem' }}
      >
        When you need just a little motivation and a little push 📣🎉👯‍♀️
      </motion.p>

      <Card>
        <h3>Level {level}</h3>
        <ProgressBar progress={(xp % 1000) / 10} />
        <p>XP: {xp % 1000} / 1000</p>
      </Card>

      {!isPlaying ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <h2>Your Chores</h2>
              {chores.map((chore) => (
                <motion.div
                  key={chore.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  style={{
                    padding: '1rem',
                    marginBottom: '1rem',
                    borderRadius: '8px',
                    border: `2px solid ${DIFFICULTY_SETTINGS[chore.difficulty].color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {chore.emoji} {chore.name}
                    </h3>
                    <span style={{ color: DIFFICULTY_SETTINGS[chore.difficulty].color }}>
                      {chore.difficulty.toUpperCase()} • {DIFFICULTY_SETTINGS[chore.difficulty].time}s
                    </span>
                    {chore.streak > 1 && (
                      <span style={{ marginLeft: '1rem', color: '#FF9800' }}>
                        🔥 {chore.streak} day streak!
                      </span>
                    )}
                  </div>
                  <div>
                    <Button onClick={() => startGame(chore)}>Play</Button>
                    <Button 
                      className="secondary"
                      onClick={() => handleRemoveChore(chore.id)}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Remove
                    </Button>
                  </div>
                </motion.div>
              ))}

              <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                <Input
                  type="text"
                  placeholder="New chore name"
                  value={newChoreName}
                  onChange={(e) => setNewChoreName(e.target.value)}
                />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  style={{ padding: '8px', borderRadius: '6px' }}
                >
                  <option value="easy">Easy (45s)</option>
                  <option value="medium">Medium (30s)</option>
                  <option value="hard">Hard (15s)</option>
                </select>
                <Button onClick={handleAddChore}>Add Chore</Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card>
              <h2>🎮 {currentChore?.emoji} {currentChore?.name}</h2>
              <div style={{ 
                fontSize: '2rem', 
                textAlign: 'center', 
                margin: '1rem 0',
                color: timer <= 5 ? '#f44336' : '#2196F3'
              }}>
                {timer}s
              </div>
              <p style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                Points: {points} × {DIFFICULTY_SETTINGS[currentChore?.difficulty || 'medium'].multiplier} = {points * DIFFICULTY_SETTINGS[currentChore?.difficulty || 'medium'].multiplier}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <Button className="game" onClick={() => setPoints(points + 1)}>
                  +1 Point
                </Button>
                <Button className="secondary" onClick={endGame}>
                  End Game
                </Button>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}
    </Container>
  );
}

export default App;
