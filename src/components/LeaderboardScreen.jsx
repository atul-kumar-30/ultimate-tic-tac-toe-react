import React, { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { supabase } from '../lib/supabase';
import { getCountryCode } from '../lib/countries';

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

export default function LeaderboardScreen({ onClose, onViewProfile }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState('overall'); // 'overall', 'official', 'friendly'

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
    <div className="glass-panel" style={{ width: '450px', maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
      <h1 className="game-title">Leaderboard</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button className={activeTab === 'overall' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.9rem', margin: 0 }} onClick={() => setActiveTab('overall')}>Overall</button>
        <button className={activeTab === 'official' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.9rem', margin: 0 }} onClick={() => setActiveTab('official')}>Official</button>
        <button className={activeTab === 'friendly' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.9rem', margin: 0 }} onClick={() => setActiveTab('friendly')}>Friendly</button>
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
        ) : (() => {
          const filteredProfiles = profiles.filter(p => {
             if (activeTab === 'official') return !!p.player_tag;
             if (activeTab === 'friendly') return !p.player_tag;
             return true;
          });

          if (filteredProfiles.length === 0) {
            return <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No players found in this category.</div>;
          }

          return filteredProfiles.map((p, index) => {
            const code = getCountryCode(p.country);
            return (
              <div key={p.id || index} className="leaderboard-item">
                <div style={{ width: '25px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', textAlign: 'right', paddingRight: '5px' }}>{index + 1}.</div>
                <div className="lb-rank">{getRank(p.mmr).split(' ')[0]}</div>
                <div className="lb-name">
                  {p.name}
                  {p.player_tag && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '4px' }}>{p.player_tag}</span>}
                  {p.country && (
                      <span style={{ marginLeft: '6px' }} title={p.country}>
                          {code ? <ReactCountryFlag countryCode={code} svg style={{ width: '1.2em', height: '1.2em', borderRadius: '2px' }} /> : <span style={{ fontSize: '0.9rem' }}>{p.country}</span>}
                      </span>
                  )}
                  {' '}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ({p.wins}W - {p.losses}L)
                  </span>
                </div>
                <div className="lb-mmr" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                     {p.mmr}
                     {p.sessionPoints !== undefined && (
                         <span style={{ fontSize: '0.8rem', color: p.sessionPoints >= 0 ? '#22c55e' : '#ef4444' }}>
                             {p.sessionPoints > 0 ? '+' : ''}{p.sessionPoints}
                         </span>
                     )}
                  </div>
                  <button 
                    className="btn-secondary" 
                    style={{ padding: '4px 8px', margin: 0, fontSize: '0.9rem' }}
                    onClick={() => {
                      const fullName = p.player_tag ? p.name + p.player_tag : p.name;
                      if (onViewProfile) onViewProfile(fullName);
                    }}
                    title="View Profile"
                  >
                    👤
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
      <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>⬅ Back to Main Menu</button>
    </div>
  );
}
