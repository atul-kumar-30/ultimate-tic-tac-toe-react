import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ReactCountryFlag from 'react-country-flag';
import { getCountryCode } from '../lib/countries';

export default function FriendsScreen({ currentUserName, onClose, onViewProfile, onChallenge, onSendInvite }) {
  const [requests, setRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends');

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
    <div className="glass-panel" style={{ width: '600px', maxWidth: '95vw', zIndex: 100, display: 'flex', flexDirection: 'column' }}>
      <h1 className="game-title" style={{ fontSize: '1.8rem', textAlign: 'center' }}>👥 Friends</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button className={activeTab === 'friends' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.9rem', margin: 0 }} onClick={() => setActiveTab('friends')}>My Friends</button>
        <button className={activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.9rem', margin: 0 }} onClick={() => setActiveTab('requests')}>
            Requests {requests.length > 0 && `(${requests.length})`}
        </button>
      </div>

      {loading ? (
          <div style={{ textAlign: 'center', margin: '20px' }}>Loading...</div>
      ) : (
          <div style={{ overflowY: 'auto', maxHeight: '400px', paddingRight: '5px' }}>
              
              {activeTab === 'requests' && (
                  <div>
                      {requests.length === 0 ? (
                          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '20px 0' }}>No pending requests.</div>
                      ) : (
                          <>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                                  <button onClick={declineAllRequests} style={{ padding: '4px 8px', fontSize: '0.8rem', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reject All</button>
                              </div>
                              {requests.map(r => (
                                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center' }}>
                                              {renderIcon(r.sender)}
                                          </div>
                                          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{r.sender}</span>
                                          <button className="btn-secondary" style={{ padding: '4px 8px', margin: 0, fontSize: '0.9rem' }} onClick={() => onViewProfile(r.sender)} title="View Profile">👤</button>
                                      </div>
                                      <div style={{ display: 'flex', gap: '5px' }}>
                                          <button onClick={() => acceptRequest(r.id)} style={{ padding: '5px 10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                                          <button onClick={() => declineRequest(r.id)} style={{ padding: '5px 10px', backgroundColor: '#F44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                                      </div>
                                  </div>
                              ))}
                          </>
                      )}
                  </div>
              )}

              {activeTab === 'friends' && (
                  <div>
                      {friends.length === 0 ? (
                          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', margin: '20px 0' }}>You haven't added any friends yet.</div>
                      ) : (
                          friends.map(f => {
                              const friendName = getFriendName(f);
                              return (
                                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                          <div style={{ display: 'flex', alignItems: 'center' }}>
                                              {renderIcon(friendName)}
                                          </div>
                                          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>{friendName}</span>
                                          <button className="btn-secondary" style={{ padding: '4px 8px', margin: 0, fontSize: '0.9rem' }} onClick={() => onViewProfile(friendName)} title="View Profile">👤</button>
                                      </div>
                                      <div style={{ display: 'flex', gap: '5px' }}>
                                          <button style={{ padding: '5px 10px', backgroundColor: 'var(--color-x)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => onSendInvite(friendName)}>Invite Online</button>
                                          <button style={{ padding: '5px 10px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }} onClick={() => onChallenge(friendName)} title="Play locally on this device">Pass & Play</button>
                                          <button style={{ padding: '5px 10px', backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#F44336', border: '1px solid #F44336', borderRadius: '4px', cursor: 'pointer' }} onClick={() => removeFriend(f.id)}>Remove</button>
                                      </div>
                                  </div>
                              )
                          })
                      )}
                  </div>
              )}
          </div>
      )}

      {activeTab === 'requests' ? (
          <button className="btn-primary" onClick={() => setActiveTab('friends')} style={{ marginTop: '20px', width: '100%' }}>⬅ Back to Friends List</button>
      ) : (
          <button className="btn-primary" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>⬅ Back to Main Menu</button>
      )}
    </div>
  );
}
