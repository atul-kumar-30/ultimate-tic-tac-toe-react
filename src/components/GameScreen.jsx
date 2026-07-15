import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { playPopSound, playVictorySound, playDrawSound } from '../lib/audio';

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

export default function GameScreen({ config, userName, onBack }) {
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
  
  const [globalVerifiedX, setGlobalVerifiedX] = useState(false);
  const [globalVerifiedO, setGlobalVerifiedO] = useState(false);
  
  const [channel, setChannel] = useState(null);
  const [incomingMove, setIncomingMove] = useState(null);
  const [incomingRestart, setIncomingRestart] = useState(false);

  const mySymbol = config.isOnline ? (userName === config.playerXName ? 'x' : 'o') : null;

  const timerRef = useRef(null);
  const winningConditions = useRef(generateWinningConditions(config.gridSize));

  useEffect(() => {
    async function loadProfiles() {
      const getBaseName = (fullName) => fullName.split('#')[0].trim();
      const getTag = (fullName) => fullName.includes('#') ? '#' + fullName.split('#')[1].trim() : null;

      let baseNameX = getBaseName(config.playerXName);
      let baseNameO = getBaseName(config.playerOName);

      let dX = { mmr: 1000, wins: 0, losses: 0, draws: 0, name: baseNameX };
      let dO = { mmr: 1000, wins: 0, losses: 0, draws: 0, name: baseNameO };

      // 1. Try to load from local storage first (Friendly Leaderboard)
      try {
        const localProfiles = JSON.parse(localStorage.getItem('localProfiles') || '{}');
        if (localProfiles[baseNameX]) dX = localProfiles[baseNameX];
        if (localProfiles[baseNameO]) dO = localProfiles[baseNameO];
      } catch (e) {
        console.error("Local storage error:", e);
      }

      // 2. Try Supabase (Global Leaderboard) if available and tag provided
      const fetchGlobalProfile = async (fullName) => {
          const tag = getTag(fullName);
          if (!tag) return null; // Local guest player
          const baseName = getBaseName(fullName);
          const { data } = await supabase.from('profiles').select('*').eq('name', baseName).eq('player_tag', tag).single();
          return data;
      };

      try {
        const fetchX = await fetchGlobalProfile(config.playerXName);
        if (fetchX) { 
           if (dX.mmr > fetchX.mmr) {
               dX = { ...dX, player_tag: fetchX.player_tag, id: fetchX.id };
           } else {
               dX = fetchX; 
           }
           setGlobalVerifiedX(true); 
        }
        
        const fetchO = await fetchGlobalProfile(config.playerOName);
        if (fetchO) { 
           if (dO.mmr > fetchO.mmr) {
               dO = { ...dO, player_tag: fetchO.player_tag, id: fetchO.id };
           } else {
               dO = fetchO; 
           }
           setGlobalVerifiedO(true); 
        }
      } catch (e) {
        // Ignore supabase errors for local play
      }

      setScoreX(dX);
      setScoreO(dO);
    }
    loadProfiles();
  }, [config]);

  // Online Multiplayer Sync Setup
  useEffect(() => {
    if (!config.isOnline || !config.roomId) return;
    
    const chan = supabase.channel(`game-${config.roomId}`);
    chan.on('broadcast', { event: 'move' }, (payload) => {
      setIncomingMove(payload.payload);
    });
    chan.on('broadcast', { event: 'restart' }, () => {
      setIncomingRestart(true);
    });
    chan.subscribe();
    
    setChannel(chan);
    return () => { supabase.removeChannel(chan); };
  }, [config.isOnline, config.roomId]);

  useEffect(() => {
    if (incomingMove) {
      makeMove(incomingMove.index, incomingMove.player, true);
      setIncomingMove(null);
    }
  }, [incomingMove]);

  useEffect(() => {
    if (incomingRestart) {
       restartGame(true);
       setIncomingRestart(false);
    }
  }, [incomingRestart]);

  const updateProfiles = async (winnerFullName, loserFullName, isDraw) => {
    const getBaseName = (fullName) => fullName.split('#')[0].trim();
    
    let w = winnerFullName === config.playerXName ? { ...scoreX } : { ...scoreO };
    let l = loserFullName === config.playerOName ? { ...scoreO } : { ...scoreX };

    w.name = getBaseName(winnerFullName);
    l.name = getBaseName(loserFullName);

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
      if (winnerFullName === config.playerXName) {
        setSessionWinsX(s => s + 1);
      } else {
        setSessionWinsO(s => s + 1);
      }
    }

    if (winnerFullName === config.playerXName) { setScoreX(w); setScoreO(l); }
    else { setScoreO(w); setScoreX(l); }

    // Save to Friendly Local Leaderboard
    try {
      const localProfiles = JSON.parse(localStorage.getItem('localProfiles') || '{}');
      localProfiles[w.name] = w;
      localProfiles[l.name] = l;
      localStorage.setItem('localProfiles', JSON.stringify(localProfiles));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    // Attempt to save to Global Leaderboard only if globally verified!
    const promises = [];
    if ((winnerFullName === config.playerXName && globalVerifiedX) || (winnerFullName === config.playerOName && globalVerifiedO)) {
       promises.push(supabase.from('profiles').upsert(w, { onConflict: 'name' }));
    }
    if ((loserFullName === config.playerXName && globalVerifiedX) || (loserFullName === config.playerOName && globalVerifiedO)) {
       promises.push(supabase.from('profiles').upsert(l, { onConflict: 'name' }));
    }

    if (promises.length > 0) {
        Promise.allSettled(promises);
    }

    // Log match history
    const matchData = {
      player_x: config.playerXName,
      player_o: config.playerOName,
      winner: isDraw ? 'Draw' : winnerFullName,
      grid_size: config.gridSize,
      created_at: new Date().toISOString()
    };

    if (globalVerifiedX || globalVerifiedO || config.isOnline) {
       supabase.from('matches').insert([matchData]).then(({ error }) => {
           if(error) console.error("Match log error:", error);
       });
    } else {
       const localMatches = JSON.parse(localStorage.getItem('localMatches') || '[]');
       localMatches.unshift(matchData);
       if(localMatches.length > 20) localMatches.pop(); // Keep last 20
       localStorage.setItem('localMatches', JSON.stringify(localMatches));
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
    playVictorySound();
    const winner = currentPlayer === 'x' ? 'o' : 'x';
    const winnerName = winner === 'x' ? config.playerXName : config.playerOName;
    const loserName = winner === 'x' ? config.playerOName : config.playerXName;
    updateProfiles(winnerName, loserName, false);
    setResult({ winner, message: `${winnerName.split('#')[0]} Wins on Time!` });
  };

  const handleCellClick = (index) => {
    if (board[index] !== '' || !gameActive) return;
    if (config.isOnline && currentPlayer !== mySymbol) return; // Not your turn
    makeMove(index, currentPlayer, false);
  };

  const makeMove = (index, player, fromRemote = false) => {
    if (config.isOnline && !fromRemote && channel) {
       channel.send({ type: 'broadcast', event: 'move', payload: { index, player } });
    }
    
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
        playDrawSound();
        updateProfiles(config.playerXName, config.playerOName, true);
        setResult({ winner: 'draw', message: "It's a Draw!" });
      } else {
        playVictorySound();
        setWinningCells(winResult.condition);
        const winnerName = winResult.winner === 'x' ? config.playerXName : config.playerOName;
        const loserName = winResult.winner === 'x' ? config.playerOName : config.playerXName;
        updateProfiles(winnerName, loserName, false);
        setResult({ winner: winResult.winner, message: `${winnerName.split('#')[0]} Wins!` });
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

  const restartGame = (fromRemote = false) => {
    if (config.isOnline && !fromRemote && channel) {
       channel.send({ type: 'broadcast', event: 'restart', payload: {} });
    }

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
            {gameActive ? `${(currentPlayer === 'x' ? config.playerXName : config.playerOName).split('#')[0]}'s Turn` : 'Game Over'}
          </h2>
        </div>
        <button className="btn-secondary btn-icon" onClick={() => restartGame(false)}>↻</button>
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
          <div className="player-name">{config.playerXName.split('#')[0]} (X)</div>
          <div className="score-val" style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>{sessionWinsX} <span style={{ fontSize: '0.9rem' }}>Wins</span></div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>{scoreX.mmr} RP</div>
        </div>
        <div className="score-card draw-score">
          <div className="player-name">Draws</div>
          <div className="score-val" style={{ fontSize: '1.8rem', lineHeight: '1.2' }}>{sessionDraws}</div>
        </div>
        <div className="score-card o-score">
          <div className="player-name">{config.playerOName.split('#')[0]} (O)</div>
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
            <button className="btn-primary" onClick={() => restartGame(false)}>Play Again</button>
            <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} onClick={onBack}>Home</button>
          </div>
        </div>
      )}
    </div>
  );
}
