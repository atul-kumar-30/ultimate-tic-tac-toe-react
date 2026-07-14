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

export default function ProfileScreen({ playerName, currentUserName, currentUserEmail, onClose, onChallenge }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState(null);

  useEffect(() => {
    async function load() {
      // Initialize with default stats
      let pData = { name: playerName, mmr: 1000, wins: 0, losses: 0, draws: 0 };

      let searchName = playerName;
      let searchTag = '';
      if (playerName && playerName.includes('#')) {
          const [n, t] = playerName.split('#');
          searchName = n.trim();
          searchTag = '#' + t.trim();
      }

      // 1. Try to load from Friendly Local Leaderboard first
      const localProfilesRaw = JSON.parse(localStorage.getItem('localProfiles') || '{}');
      if (localProfilesRaw[searchName]) {
        pData = localProfilesRaw[searchName];
      }

      // 2. Try fetching from Global Supabase Leaderboard
      let query = supabase.from('profiles').select('*');
      if (searchTag) {
          query = query.eq('name', searchName).eq('player_tag', searchTag);
      } else {
          query = query.eq('name', searchName);
      }
      
      const { data, error } = await query.single();

      // Fetch friendship status if viewing someone else
      if (data && currentUserName && searchName !== currentUserName) {
         const { data: fData } = await supabase.from('friendships')
            .select('*')
            .or(`and(sender.eq.${currentUserName},receiver.eq.${data.name}),and(sender.eq.${data.name},receiver.eq.${currentUserName})`)
            .maybeSingle();
         if(fData) setFriendship(fData);
      }
      
      // If we got valid global data, take whichever has higher MMR (to ensure we don't accidentally downgrade if local is out of sync)
      if (data) {
        if (!localProfilesRaw[searchName] || data.mmr > localProfilesRaw[searchName].mmr) {
          pData = data;
        } else {
          pData = { ...localProfilesRaw[searchName], player_tag: data.player_tag };
        }
      }

      setProfile(pData);
      setLoading(false);
    }
    
    if (playerName) {
        load();
    }
  }, [playerName, currentUserName]);

  const handleAddFriend = async () => {
      const targetName = profile ? (profile.name + (profile.player_tag || '')) : playerName;
      if(!targetName) return;
      
      const { data, error } = await supabase.from('friendships').insert([{
          sender: currentUserName,
          receiver: targetName,
          status: 'pending'
      }]).select().single();
      
      if(!error && data) {
          setFriendship(data);
          alert('Friend request sent!');
      } else {
          alert('Error sending request. You might already have a pending request.');
      }
  };

  return (
    <div className="glass-panel" style={{ width: '400px', maxWidth: '95vw', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
          {profile?.country ? (
              getCountryCode(profile.country) ? (
                 <ReactCountryFlag countryCode={getCountryCode(profile.country)} svg style={{ width: '1em', height: '1em', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }} title={profile.country} />
              ) : (
                 <span style={{ fontSize: '1.5rem' }}>🌍 {profile.country}</span>
              )
          ) : '👤'}
      </div>
      <h1 className="game-title" style={{ fontSize: '1.8rem', margin: '0' }}>{profile ? profile.name : (playerName ? playerName.split('#')[0] : '')}</h1>
      {profile?.player_tag && (
          <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>{profile.player_tag}</div>
      )}
      
      {/* PRIVATE SECTION - Only visible to the owner */}
      {((profile ? (profile.name + (profile.player_tag || '')) : playerName) === currentUserName || (profile ? profile.name : playerName) === currentUserName) && currentUserEmail && (
          <div style={{ fontSize: '0.9rem', color: '#38bdf8', marginBottom: '10px', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '5px 15px', borderRadius: '15px' }}>
              ✉️ {currentUserEmail} (Private)
          </div>
      )}
      
      {profile?.created_at && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Joined: {new Date(profile.created_at).toLocaleDateString()}
          </div>
      )}
      
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

            {((profile ? (profile.name + (profile.player_tag || '')) : playerName) !== currentUserName && (profile ? profile.name : playerName) !== currentUserName) && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  {(!friendship || (friendship.status !== 'pending' && friendship.status !== 'accepted')) && (
                      <button className="btn-secondary" style={{ flex: 1, margin: 0 }} onClick={handleAddFriend}>Add Friend</button>
                  )}
                  {friendship?.status === 'pending' && (
                      <button className="btn-secondary" style={{ flex: 1, margin: 0, opacity: 0.7 }} disabled>Pending</button>
                  )}
                  {(!friendship || friendship.status === 'accepted') && (
                      <button 
                          className="btn-secondary" 
                          style={{ flex: 1, margin: 0, borderColor: 'var(--color-x)', color: 'var(--color-x)' }} 
                          onClick={() => {
                              const fullName = profile ? (profile.name + (profile.player_tag || '')) : playerName;
                              if (onChallenge) onChallenge(fullName);
                          }}
                      >
                          Let's Play
                      </button>
                  )}
              </div>
            )}
        </div>
      ) : (
          <div style={{ margin: '20px', color: 'var(--text-secondary)' }}>No stats found.</div>
      )}

      <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>Close</button>
    </div>
  );
}
