import React, { useState } from 'react';

export default function SetupScreen({ 
  onLogout,
  onStartGame,
  onViewLeaderboard,
  onViewProfile,
  onViewFriends,
  config,
  setConfig,
  userName,
  onDeleteAccount,
  onViewRules
}) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="glass-panel setup-screen" style={{ position: 'relative' }}>
      <h1>Tic-Tac-Toe</h1>
      
      <div className="setup-group">
        <label>Find Player</label>
        <div style={{ display: 'flex', gap: '5px' }}>
          <input 
            type="text" 
            placeholder="Search Name or Name#Tag"
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, margin: 0 }}
            onKeyDown={e => { if (e.key === 'Enter' && searchQuery.trim()) onViewProfile(searchQuery.trim()); }}
          />
          <button className="btn-secondary" style={{ padding: '0 15px', fontSize: '1.2rem', margin: 0 }} onClick={() => { if(searchQuery.trim()) onViewProfile(searchQuery.trim()); }}>🔍</button>
        </div>
      </div>

      <div className="setup-group">
        <label>Game Mode</label>
        <div className="select-wrapper">
          <select value={config.mode} onChange={e => setConfig({...config, mode: e.target.value})}>
            <option value="pvp">Player vs Player</option>
            <option value="pve">Player vs AI</option>
          </select>
        </div>
      </div>

      {config.mode === 'pve' && (
        <div className="setup-group">
          <label>AI Difficulty</label>
          <div className="select-wrapper">
            <select value={config.difficulty} onChange={e => setConfig({...config, difficulty: e.target.value})}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="impossible">Impossible</option>
            </select>
          </div>
        </div>
      )}

      <div className="setup-group">
        <label>Grid Size</label>
        <div className="select-wrapper">
          <select value={config.gridSize} onChange={e => setConfig({...config, gridSize: parseInt(e.target.value)})}>
            <option value="3">3x3 (Standard)</option>
            <option value="4">4x4</option>
            <option value="5">5x5</option>
          </select>
        </div>
      </div>

      <div className="setup-group">
        <label>Player X Name</label>
        <div style={{ display: 'flex', gap: '5px' }}>
          <input 
            type="text" 
            value={config.playerXName} 
            onChange={e => setConfig({...config, playerXName: e.target.value})}
            disabled={!!userName}
            style={userName ? { opacity: 0.7, cursor: 'not-allowed', flex: 1, margin: 0 } : { flex: 1, margin: 0 }}
          />
          <button className="btn-secondary" style={{ padding: '0 15px', fontSize: '1.2rem', margin: 0 }} onClick={() => onViewProfile(config.playerXName)}>👤</button>
        </div>
      </div>

      {config.mode === 'pvp' && (
        <div className="setup-group">
          <label>Player O Name</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input 
              type="text" 
              value={config.playerOName} 
              onChange={e => setConfig({...config, playerOName: e.target.value})}
              style={{ flex: 1, margin: 0 }}
            />
            <button className="btn-secondary" style={{ padding: '0 15px', fontSize: '1.2rem', margin: 0 }} onClick={() => onViewProfile(config.playerOName)}>👤</button>
          </div>
        </div>
      )}

      <div className="setup-group">
        <label className="checkbox-label">
          <input 
            type="checkbox" 
            checked={config.blitzMode} 
            onChange={e => setConfig({...config, blitzMode: e.target.checked})} 
          />
          Blitz Mode (5s Timer)
        </label>
      </div>

      <button className="btn-primary" onClick={onStartGame}>Start Game</button>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button className="btn-secondary" onClick={onViewLeaderboard} style={{ flex: 1, padding: '10px 5px' }}>🏆 Leaderboard</button>
        <button className="btn-secondary" onClick={onViewRules} style={{ flex: 1, padding: '10px 5px' }}>📖 Rules</button>
        <button className="btn-secondary" onClick={onViewFriends} style={{ flex: 1, padding: '10px 5px' }}>👥 Friends</button>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button className="btn-secondary" onClick={onLogout} style={{ flex: 1, color: 'var(--text-secondary)' }}>Logout 🚪</button>
        <button className="btn-secondary" onClick={onDeleteAccount} style={{ flex: 1, color: '#ff4444', borderColor: '#ff4444' }}>Delete Account</button>
      </div>
    </div>
  );
}
