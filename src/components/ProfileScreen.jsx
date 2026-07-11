import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function getRank(mmr) {
    if (mmr >= 2200) return '👑 Terminator';
    if (mmr >= 2100) return '💎 Diamond 1';
    if (mmr >= 2000) return '💎 Diamond 2';
    if (mmr >= 1900) return '💎 Diamond 3';
    
    if (mmr >= 1800) return '🥇 Gold 1';
    if (mmr >= 1700) return '🥇 Gold 2';
    if (mmr >= 1600) return '🥇 Gold 3';
    
    if (mmr >= 1500) return '🥈 Silver 1';
    if (mmr >= 1400) return '🥈 Silver 2';
    if (mmr >= 1300) return '🥈 Silver 3';
    
    if (mmr >= 1200) return '🥉 Bronze 1';
    if (mmr >= 1100) return '🥉 Bronze 2';
    return '🥉 Bronze 3';
}

export default function ProfileScreen({ playerName, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Initialize with default stats
      let pData = { name: playerName, mmr: 1000, wins: 0, losses: 0, draws: 0 };

      // 1. Try to load from Friendly Local Leaderboard first
      const localProfilesRaw = JSON.parse(localStorage.getItem('localProfiles') || '{}');
      if (localProfilesRaw[playerName]) {
        pData = localProfilesRaw[playerName];
      }

      // 2. Try fetching from Global Supabase Leaderboard
      const { data, error } = await supabase.from('profiles').select('*').eq('name', playerName).single();
      
      // If we got valid global data, take whichever has higher MMR (to ensure we don't accidentally downgrade if local is out of sync)
      if (data && (!localProfilesRaw[playerName] || data.mmr > localProfilesRaw[playerName].mmr)) {
        pData = data;
      }

      setProfile(pData);
      setLoading(false);
    }
    
    if (playerName) {
        load();
    }
  }, [playerName]);

  return (
    <div className="glass-panel" style={{ width: '400px', maxWidth: '95vw', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ fontSize: '3rem', marginBottom: '10px' }}>👤</div>
      <h1 className="game-title" style={{ fontSize: '1.8rem', marginBottom: '5px' }}>{playerName}</h1>
      
      {loading ? (
        <div style={{ margin: '20px', color: 'var(--text-secondary)' }}>Loading stats...</div>
      ) : profile ? (
        <div style={{ width: '100%', marginTop: '20px' }}>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Rank</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-x)', marginTop: '5px' }}>{getRank(profile.mmr)}</div>
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '5px' }}>{profile.mmr} RP</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>{profile.wins}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>WINS</div>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#F44336' }}>{profile.losses}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>LOSSES</div>
                </div>
                <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFC107' }}>{profile.draws}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>DRAWS</div>
                </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Win Rate: {profile.wins + profile.losses === 0 ? '0' : Math.round((profile.wins / (profile.wins + profile.losses)) * 100)}%
               </div>
            </div>
        </div>
      ) : (
          <div style={{ margin: '20px', color: 'var(--text-secondary)' }}>No stats found.</div>
      )}

      <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>Close</button>
    </div>
  );
}
