import React from 'react';

export default function RulesScreen({ onClose }) {
  return (
    <div className="glass-panel" style={{ width: '450px', maxWidth: '90vw', position: 'relative', zIndex: 50, textAlign: 'left' }}>
      <button 
        onClick={onClose} 
        style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
        title="Close"
      >
        ❌
      </button>
      
      <h1 className="game-title" style={{ textAlign: 'center', marginBottom: '20px' }}>📖 Game Rules</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-x)', marginBottom: '5px' }}>Grid Sizes</h3>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '20px' }}>
          <li><strong>3x3:</strong> Match 3 in a row to win.</li>
          <li><strong>4x4:</strong> Match 4 in a row to win.</li>
          <li><strong>5x5:</strong> Match 5 in a row to win.</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-x)', marginBottom: '5px' }}>⚡ Blitz Mode</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0' }}>
          When Blitz Mode is enabled, you only have exactly <strong>5 seconds</strong> to make your move. If you run out of time, you automatically lose the game!
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ color: 'var(--color-x)', marginBottom: '5px' }}>🏆 Competitive League System</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
          Climb the competitive ladder by earning Rank Points (RP).
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#cd7f32', fontWeight: 'bold', marginBottom: '5px' }}>🟤 Bronze League</div>
            <ul style={{ listStyleType: 'none', paddingLeft: '5px', margin: 0 }}>
              <li>Bronze III: 1000 - 1099</li>
              <li>Bronze II: 1100 - 1199</li>
              <li>Bronze I: 1200 - 1299</li>
            </ul>
          </div>
          <div>
            <div style={{ color: '#c0c0c0', fontWeight: 'bold', marginBottom: '5px' }}>⚪ Silver League</div>
            <ul style={{ listStyleType: 'none', paddingLeft: '5px', margin: 0 }}>
              <li>Silver III: 1300 - 1399</li>
              <li>Silver II: 1400 - 1499</li>
              <li>Silver I: 1500 - 1599</li>
            </ul>
          </div>
          <div>
            <div style={{ color: '#ffd700', fontWeight: 'bold', marginBottom: '5px' }}>🟡 Gold League</div>
            <ul style={{ listStyleType: 'none', paddingLeft: '5px', margin: 0 }}>
              <li>Gold III: 1600 - 1699</li>
              <li>Gold II: 1700 - 1799</li>
              <li>Gold I: 1800 - 1899</li>
            </ul>
          </div>
          <div>
            <div style={{ color: '#00bfff', fontWeight: 'bold', marginBottom: '5px' }}>🔵 Diamond League</div>
            <ul style={{ listStyleType: 'none', paddingLeft: '5px', margin: 0 }}>
              <li>Diamond III: 1900 - 1999</li>
              <li>Diamond II: 2000 - 2099</li>
              <li>Diamond I: 2100 - 2199</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: '15px', fontWeight: 'bold', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          👑 Terminator: <span style={{ color: '#ff4500' }}>2200+ RP</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px', fontStyle: 'italic' }}>
          * Everyone starts at 1000 RP (Bronze III) and you can never drop below 1000. Playing on larger grids awards more RP per win!
        </p>
      </div>

      <button className="btn-primary" onClick={onClose} style={{ marginTop: '10px' }}>
        Return to Home Page
      </button>
    </div>
  );
}
