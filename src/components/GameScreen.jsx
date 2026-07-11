import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { playPopSound } from '../lib/audio';

const BLITZ_TIME = 5000;

function generateWinningConditions(size) {
  const conditions = [];
  const winReq = size === 3 ? 3 : size === 4 ? 4 : 4; 

  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - winReq; c++) {
      const rowCondition = [];
      for (let i = 0; i < winReq; i++) rowCondition.push(r * size + c + i);
      conditions.push(rowCondition);
    }
  }

  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - winReq; r++) {
      const colCondition = [];
      for (let i = 0; i < winReq; i++) colCondition.push((r + i) * size + c);
      conditions.push(colCondition);
    }
  }

  for (let r = 0; r <= size - winReq; r++) {
    for (let c = 0; c <= size - winReq; c++) {
      const diag1 = [];
      for (let i = 0; i < winReq; i++) diag1.push((r + i) * size + c + i);
      conditions.push(diag1);
    }
  }

  for (let r = 0; r <= size - winReq; r++) {
    for (let c = winReq - 1; c < size; c++) {
      const diag2 = [];
      for (let i = 0; i < winReq; i++) diag2.push((r + i) * size + c - i);
      conditions.push(diag2);
    }
  }
  return conditions;
}

function checkWinLogic(boardState, winningConditions) {
  for (let condition of winningConditions) {
    const first = boardState[condition[0]];
    if (first === '') continue;
    let isWin = true;
    for (let i = 1; i < condition.length; i++) {
      if (boardState[condition[i]] !== first) {
        isWin = false;
        break;
      }
    }
    if (isWin) return { winner: first, condition };
  }
  if (!boardState.includes('')) return { winner: 'draw' };
  return null;
}

export default function GameScreen({ config, onBack }) {
  const [board, setBoard] = useState(Array(config.gridSize * config.gridSize).fill(''));
  const [currentPlayer, setCurrentPlayer] = useState('x');
  const [gameActive, setGameActive] = useState(true);
  const [moveHistory, setMoveHistory] = useState([]);
  const [winningCells, setWinningCells] = useState([]);
  const [result, setResult] = useState(null); // { winner: 'x'|'o'|'draw', message: '' }
  const [timeLeft, setTimeLeft] = useState(BLITZ_TIME);
  const [sessionDraws, setSessionDraws] = useState(0);
  const [sessionWinsX, setSessionWinsX] = useState(0);
  const [sessionWinsO, setSessionWinsO] = useState(0);

  const [scoreX, setScoreX] = useState({ mmr: 1000, wins: 0, losses: 0, draws: 0 });
  const [scoreO, setScoreO] = useState({ mmr: 1000, wins: 0, losses: 0, draws: 0 });
  
  const timerRef = useRef(null);
  const winningConditions = useRef(generateWinningConditions(config.gridSize));

  useEffect(() => {
    async function loadProfiles() {
      let dX = { mmr: 1000, wins: 0, losses: 0, draws: 0, name: config.playerXName };
      let dO = { mmr: 1000, wins: 0, losses: 0, draws: 0, name: config.playerOName };

      // 1. Try to load from local storage first (Friendly Leaderboard)
      const localProfiles = JSON.parse(localStorage.getItem('localProfiles') || '{}');
      if (localProfiles[config.playerXName]) dX = localProfiles[config.playerXName];
      if (localProfiles[config.playerOName]) dO = localProfiles[config.playerOName];

      // 2. Try Supabase (Global Leaderboard) if available, but let local persist if global fails
      try {
        const { data: fetchX } = await supabase.from('profiles').select('*').eq('name', config.playerXName).single();
        if (fetchX) dX = fetchX;
        const { data: fetchO } = await supabase.from('profiles').select('*').eq('name', config.playerOName).single();
        if (fetchO) dO = fetchO;
      } catch (e) {
        // Ignore supabase errors for local play
      }

      setScoreX(dX);
      setScoreO(dO);
    }
    loadProfiles();
  }, [config]);

  const updateProfiles = async (winnerName, loserName, isDraw) => {
    let w = winnerName === config.playerXName ? { ...scoreX } : { ...scoreO };
    let l = loserName === config.playerOName ? { ...scoreO } : { ...scoreX };

    w.name = winnerName;
    l.name = loserName;

    let winPoints = 30, losePoints = 10;
    if (config.gridSize === 4) { winPoints = 40; losePoints = 20; }
    else if (config.gridSize === 5) { winPoints = 50; losePoints = 15; }

    if (isDraw) {
      w.mmr += 5; l.mmr += 5;
      w.draws++; l.draws++;
      setSessionDraws(s => s + 1);
    } else {
      w.mmr += winPoints; w.wins++;
      l.mmr = Math.max(1000, l.mmr - losePoints); l.losses++;
      if (winnerName === config.playerXName) {
        setSessionWinsX(s => s + 1);
      } else {
        setSessionWinsO(s => s + 1);
      }
    }

    if (winnerName === config.playerXName) { setScoreX(w); setScoreO(l); }
    else { setScoreO(w); setScoreX(l); }

    // Save to Friendly Local Leaderboard
    const localProfiles = JSON.parse(localStorage.getItem('localProfiles') || '{}');
    localProfiles[w.name] = w;
    localProfiles[l.name] = l;
    localStorage.setItem('localProfiles', JSON.stringify(localProfiles));

    // Attempt to save to Global Leaderboard
    try {
      await supabase.from('profiles').upsert(w, { onConflict: 'name' });
      await supabase.from('profiles').upsert(l, { onConflict: 'name' });
    } catch (err) {
      // It's okay if it fails, local storage works!
    }
  };

  const startTimer = useCallback(() => {
    if (!config.blitzMode) return;
    clearInterval(timerRef.current);
    setTimeLeft(BLITZ_TIME);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 50) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 50;
      });
    }, 50);
  }, [config.blitzMode]);

  useEffect(() => {
    if (gameActive) startTimer();
    return () => clearInterval(timerRef.current);
  }, [currentPlayer, gameActive, startTimer]);

  const handleTimeOut = () => {
    setGameActive(false);
    const winner = currentPlayer === 'x' ? 'o' : 'x';
    const winnerName = winner === 'x' ? config.playerXName : config.playerOName;
    const loserName = winner === 'x' ? config.playerOName : config.playerXName;
    updateProfiles(winnerName, loserName, false);
    setResult({ winner, message: `${winnerName} Wins on Time!` });
  };

  const handleCellClick = (index) => {
    if (board[index] !== '' || !gameActive) return;
    makeMove(index, currentPlayer);
  };

  const makeMove = (index, player) => {
    playPopSound(player);
    const newBoard = [...board];
    newBoard[index] = player;
    setBoard(newBoard);
    setMoveHistory(prev => [...prev, { index, player }]);

    const winResult = checkWinLogic(newBoard, winningConditions.current);
    if (winResult) {
      setGameActive(false);
      clearInterval(timerRef.current);
      if (winResult.winner === 'draw') {
        updateProfiles(config.playerXName, config.playerOName, true);
        setResult({ winner: 'draw', message: "It's a Draw!" });
      } else {
        setWinningCells(winResult.condition);
        const winnerName = winResult.winner === 'x' ? config.playerXName : config.playerOName;
        const loserName = winResult.winner === 'x' ? config.playerOName : config.playerXName;
        updateProfiles(winnerName, loserName, false);
        setResult({ winner: winResult.winner, message: `${winnerName} Wins!` });
      }
    } else {
      setCurrentPlayer(player === 'x' ? 'o' : 'x');
    }
  };

  useEffect(() => {
    if (config.mode === 'pve' && currentPlayer === 'o' && gameActive) {
      const timeout = setTimeout(() => {
        let available = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        if (available.length > 0) {
          makeMove(available[Math.floor(Math.random() * available.length)], 'o');
        }
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPlayer, gameActive, board, config.mode]);

  const restartGame = () => {
    setBoard(Array(config.gridSize * config.gridSize).fill(''));
    setCurrentPlayer('x');
    setGameActive(true);
    setMoveHistory([]);
    setWinningCells([]);
    setResult(null);
  };

  return (
    <div className="game-screen" style={{ width: '450px', maxWidth: '95vw', position: 'relative' }}>
      <div className="top-bar">
        <button className="btn-secondary btn-icon" onClick={onBack}>&lt;</button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            {gameActive ? `${currentPlayer === 'x' ? config.playerXName : config.playerOName}'s Turn` : 'Game Over'}
          </h2>
        </div>
        <button className="btn-secondary btn-icon" onClick={restartGame}>↻</button>
      </div>

      {config.blitzMode && (
        <div className="timer-container">
          <div 
            className={`timer-bar ${(timeLeft / BLITZ_TIME) < 0.3 ? 'warning' : ''}`} 
            style={{ width: `${(timeLeft / BLITZ_TIME) * 100}%` }}
          />
        </div>
      )}

      <div className="scoreboard">
        <div className="score-card x-score">
          <div className="player-name">{config.playerXName} (X)</div>
          <div className="score-val" style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>{sessionWinsX} <span style={{ fontSize: '0.9rem' }}>Wins</span></div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{scoreX.mmr} RP</div>
        </div>
        <div className="score-card draw-score">
          <div className="player-name">Draws</div>
          <div className="score-val" style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>{sessionDraws}</div>
        </div>
        <div className="score-card o-score">
          <div className="player-name">{config.playerOName} (O)</div>
          <div className="score-val" style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>{sessionWinsO} <span style={{ fontSize: '0.9rem' }}>Wins</span></div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{scoreO.mmr} RP</div>
        </div>
      </div>

      <div className="board" style={{ '--grid-size': config.gridSize }}>
        {board.map((cell, idx) => (
          <div 
            key={idx} 
            className={`cell ${cell} ${winningCells.includes(idx) ? 'winning-cell' : ''}`}
            onClick={() => handleCellClick(idx)}
          >
            {cell.toUpperCase()}
          </div>
        ))}
      </div>

      {result && (
        <div className="result-modal">
          <div className="result-content glass-panel" style={{ width: '90%', maxWidth: '400px' }}>
            <h2 id="result-message">{result.message}</h2>
            <button className="btn-primary" onClick={restartGame}>Play Again</button>
            <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={onBack}>Home</button>
          </div>
        </div>
      )}
    </div>
  );
}
