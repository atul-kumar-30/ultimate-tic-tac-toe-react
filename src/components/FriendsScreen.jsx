import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function FriendsScreen({ currentUserName, onClose, onViewProfile }) {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`sender.eq.${currentUserName},receiver.eq.${currentUserName}`);
      
      if (data) {
        setRequests(data.filter(f => f.status === 'pending' && f.receiver === currentUserName));
        setFriends(data.filter(f => f.status === 'accepted'));
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

  const getFriendName = (f) => f.sender === currentUserName ? f.receiver : f.sender;

  return (
    <div className="glass-panel" style={{ width: '400px', maxWidth: '95vw', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <h1 className="game-title" style={{ fontSize: '1.8rem', textAlign: 'center' }}>👥 Friends</h1>

      {loading ? (
          <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>
      ) : (
          <div style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
              
              {requests.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '5px', marginBottom: '10px' }}>Pending Requests</h3>
                      {requests.map(r => (
                          <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                              <span style={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onViewProfile(r.sender)}>{r.sender}</span>
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
                                  <span style={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => onViewProfile(friendName)}>{friendName}</span>
                                  <button style={{ padding: '5px 10px', backgroundColor: 'var(--color-x)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => alert('Challenges coming soon!')}>⚔️ Play</button>
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
