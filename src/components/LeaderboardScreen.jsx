import React, { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
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

export default function LeaderboardScreen({ onClose }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    async function load() {
      // 1. Get Friendly Local Leaderboard
      const localProfilesRaw = JSON.parse(localStorage.getItem('localProfiles') || '{}');
      let combined = { ...localProfilesRaw };

      // 2. Try fetching from Global Supabase Leaderboard
      const { data, error } = await supabase.from('profiles').select('*').order('mmr', { ascending: false });
      if (error) {
        console.warn("Could not reach global database, using local friendly leaderboard instead.");
      } else if (data) {
        // Merge Supabase profiles, favoring the highest MMR if there's a conflict
        data.forEach(p => {
          if (!combined[p.name] || combined[p.name].mmr < p.mmr) {
            combined[p.name] = p;
          }
        });
      }

      // Convert back to array and sort by MMR
      const finalProfiles = Object.values(combined).sort((a, b) => b.mmr - a.mmr);
      setProfiles(finalProfiles);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="glass-panel" style={{ width: '450px', maxWidth: '95vw', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', maxHeight: '90vh', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      <h1 className="game-title">Leaderboard</h1>
      <div className="leaderboard-list">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : profiles.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No ranked players yet. Play a game to get started!</div>
        ) : (
          profiles.map(p => {
            const isCountryName = p.country && p.country.length > 2; 
            // In vanilla we saved name, e.g. "United States" or "US United States".
            // If they signed up via React, it's just "United States".
            // Let's just render the country name for now if we can't extract the code.
            // Actually, in React, we saved `country.value` which is "United States". 
            // We should ideally find the code to render the flag.
            let code = '';
            if (p.country) {
                // simple mapping for the ones we have, or just rely on the name
            }
            return (
              <div key={p.id} className="leaderboard-item">
                <div className="lb-rank">{getRank(p.mmr).split(' ')[0]}</div>
                <div className="lb-name">
                  {p.name} <span style={{ fontSize: '0.9rem' }}>{p.country}</span>
                  {' '}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ({p.wins}W - {p.losses}L)
                  </span>
                </div>
                <div className="lb-mmr">{p.mmr}</div>
              </div>
            );
          })
        )}
      </div>
      <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px' }}>Close</button>
    </div>
  );
}
