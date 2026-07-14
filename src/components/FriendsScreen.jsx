import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ReactCountryFlag from 'react-country-flag';
import { getCountryCode } from '../lib/countries';

export default function FriendsScreen({ currentUserName, onClose, onViewProfile }) {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`sender.eq.${currentUserName},receiver.eq.${currentUserName}`);
      
      if (data) {
        const reqs = data.filter(f => f.status === 'pending' && f.receiver === currentUserName);
        const frnds = data.filter(f => f.status === 'accepted');

        const namesToFetch = new Set();
        reqs.forEach(r => {
            const [n] = r.sender.split('#');
            if (n) namesToFetch.add(n.trim());
        });
        frnds.forEach(f => {
            const friendFullName = f.sender === currentUserName ? f.receiver : f.sender;
            const [n] = friendFullName.split('#');
            if (n) namesToFetch.add(n.trim());
        });

        if (namesToFetch.size > 0) {
            const { data: profilesData } = await supabase.from('profiles').select('name, country').in('name', Array.from(namesToFetch));
            if (profilesData) {
                const pMap = {};
                profilesData.forEach(p => pMap[p.name] = p.country);
                setProfileMap(pMap);
            }
        }

        setRequests(reqs);
        setFriends(frnds);
      }
      setLoading(false);
    }
    
    if (currentUserName) load();
  }, [currentUserName]);

  const acceptRequest = async (id) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id);
    setRequests(requests.filter(r => r.id !== id));
    const accepted = requests.find(r => r.id === id);
    if(accepted) {
       setFriends([...friends, {...accepted, status: 'accepted'}]);
    }
  };

  const declineRequest = async (id) => {
    await supabase.from('friendships').delete().eq('id', id);
    setRequests(requests.filter(r => r.id !== id));
  };

  const declineAllRequests = async () => {
    const ids = requests.map(r => r.id);
    if(ids.length === 0) return;
    await supabase.from('friendships').delete().in('id', ids);
    setRequests([]);
  };

  const removeFriend = async (id) => {
    if(window.confirm('Are you sure you want to remove this friend?')) {
        await supabase.from('friendships').delete().eq('id', id);
        setFriends(friends.filter(f => f.id !== id));
    }
  };

  const getFriendName = (f) => f.sender === currentUserName ? f.receiver : f.sender;

  const renderIcon = (fullName) => {
      const [name] = fullName.split('#');
      const countryName = profileMap[name?.trim()];
      const code = getCountryCode(countryName);
      
      if (code) {
          return <ReactCountryFlag countryCode={code} svg style={{ width: '1.2em', height: '1.2em', borderRadius: '2px', marginRight: '8px' }} title={countryName} />;
      }
      return <span style={{ marginRight: '8px', fontSize: '1.1em', opacity: 0.8 }}>👤</span>;
  };

  return (
    <div className="glass-panel" style={{ width: '400px', maxWidth: '95vw', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <h1 className="game-title" style={{ fontSize: '1.8rem', textAlign: 'center' }}>👥 Friends</h1>

      {loading ? (
          <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>
      ) : (
          <div style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
              
              {requests.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px', marginBottom: '10px' }}>
                          <h3 style={{ margin: 0 }}>Pending Requests</h3>
                          {requests.length > 1 && (
                              <button onClick={declineAllRequests} style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject All</button>
                          )}
                      </div>
                      {requests.map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onViewProfile(r.sender)} title="View Profile">
                                      {renderIcon(r.sender)}
                                  </div>
                                  <span style={{ fontWeight: 'bold' }}>{r.sender}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                  <button onClick={() => acceptRequest(r.id)} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                                  <button onClick={() => declineRequest(r.id)} style={{ padding: '5px 10px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              <div>
                  <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px', marginBottom: '10px' }}>My Friends</h3>
                  {friends.length === 0 ? (
                      <div style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '20px 0' }}>You haven't added any friends yet.</div>
                  ) : (
                      friends.map(f => {
                          const friendName = getFriendName(f);
                          return (
                              <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center' }}>
                                      <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }} onClick={() => onViewProfile(friendName)} title="View Profile">
                                          {renderIcon(friendName)}
                                      </div>
                                      <span style={{ fontWeight: 'bold' }}>{friendName}</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '5px' }}>
                                      <button style={{ padding: '5px 10px', backgroundColor: 'var(--color-x)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => alert('Challenges coming soon!')}>⚔️ Play</button>
                                      <button style={{ padding: '5px 10px', backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#F44336', border: '1px solid #F44336', borderRadius: '4px', cursor: 'pointer' }} onClick={() => removeFriend(f.id)}>Remove</button>
                                  </div>
                              </div>
                          )
                      })
                  )}
              </div>
          </div>
      )}

      <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>Close</button>
    </div>
  );
}
