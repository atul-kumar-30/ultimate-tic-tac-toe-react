import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import RulesScreen from './components/RulesScreen';
import ProfileScreen from './components/ProfileScreen';
import FriendsScreen from './components/FriendsScreen';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState('auth'); // 'auth', 'setup', 'game', 'leaderboard', 'profile', 'friends'
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeInvite, setActiveInvite] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [config, setConfig] = useState({
    mode: 'pvp',
    difficulty: 'medium',
    playerXName: 'Player X',
    playerOName: 'Player O',
    gridSize: 3,
    blitzMode: false,
    isOnline: false,
    roomId: null
  });
  const [userName, setUserName] = useState('');
  const [previousScreen, setPreviousScreen] = useState('setup');

  useEffect(() => {
    async function initAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await handleAuthSuccess(session.user);
      }
      setIsInitializing(false);
    }
    initAuth();
  }, []);

  useEffect(() => {
    if (!userName) return;

    const channel = supabase.channel(`user-${userName}`);
    channel.on('broadcast', { event: 'invite' }, ({ payload }) => {
      setActiveInvite(payload);
    });
    channel.on('broadcast', { event: 'accepted' }, ({ payload }) => {
      setConfig(prev => ({
        ...prev,
        playerXName: userName,
        playerOName: payload.receiver,
        mode: 'pvp',
        isOnline: true,
        roomId: payload.id
      }));
      setScreen('game');
    });
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userName]);

  const handleAcceptInvite = async () => {
    if (!activeInvite) return;
    await supabase.from('game_invites').update({ status: 'accepted' }).eq('id', activeInvite.id);

    const senderChannel = supabase.channel(`user-${activeInvite.sender}`);
    senderChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        senderChannel.send({ type: 'broadcast', event: 'accepted', payload: activeInvite });
        supabase.removeChannel(senderChannel);
      }
    });

    setConfig(prev => ({
      ...prev,
      playerXName: activeInvite.sender,
      playerOName: userName,
      mode: 'pvp',
      isOnline: true,
      roomId: activeInvite.id
    }));
    setActiveInvite(null);
    setScreen('game');
  };

  const handleDeclineInvite = async () => {
    if (!activeInvite) return;
    await supabase.from('game_invites').update({ status: 'declined' }).eq('id', activeInvite.id);
    setActiveInvite(null);
  };

  const handleSendInvite = async (challengeName) => {
    const { data, error } = await supabase.from('game_invites').insert([{
      sender: userName,
      receiver: challengeName,
      status: 'pending'
    }]).select().single();

    if (data && !error) {
      alert(`Invite sent to ${challengeName.split('#')[0]}! Waiting for them to accept...`);
      const receiverChan = supabase.channel(`user-${challengeName}`);
      receiverChan.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          receiverChan.send({ type: 'broadcast', event: 'invite', payload: data });
          supabase.removeChannel(receiverChan);
        }
      });
    } else {
      alert("Failed to send invite.");
    }
  };

  const handleAuthSuccess = async (user) => {
    if (user) {
      setSession(user);

      let name = user.user_metadata?.name;

      // If the user's account is old and missing a name, prompt them to set one!
      if (!name) {
        const inputName = window.prompt("Welcome! Please enter a Player Name for your account:");
        if (inputName && inputName.trim()) {
          name = inputName.trim();
          await supabase.auth.updateUser({ data: { name: name } });
        }
      }

      if (name) {
        // Fetch or create profile to ensure they have a player_tag
        const { data: profile } = await supabase.from('profiles').select('*').eq('name', name).single();

        let tag = profile?.player_tag;
        if (!profile || !tag || (user.user_metadata?.country && !profile?.country)) {
          tag = tag || '#' + Math.floor(1000 + Math.random() * 9000).toString();
          const localProfilesRaw = JSON.parse(localStorage.getItem('localProfiles') || '{}');
          const localStats = localProfilesRaw[name];

          const upsertData = {
            name: name,
            player_tag: tag,
            mmr: profile?.mmr || localStats?.mmr || 1000,
            wins: profile?.wins || localStats?.wins || 0,
            losses: profile?.losses || localStats?.losses || 0,
            draws: profile?.draws || localStats?.draws || 0
          };

          // Only add country if the column exists in the schema to avoid errors, 
          // but since we want to sync it, we include it. If it fails, they need to add the column.
          if (user.user_metadata?.country) {
            upsertData.country = user.user_metadata.country;
          }

          const { error: upsertError } = await supabase.from('profiles').upsert([upsertData], { onConflict: 'name' });
          if (upsertError) console.error("Upsert profile error:", upsertError);
        }

        const fullName = name + tag;
        setUserName(fullName);
        setConfig(prev => ({ ...prev, playerXName: fullName }));
      }
      setScreen('setup');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserName('');
    setScreen('auth');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This will remove your leaderboard stats and log you out. This action cannot be undone.")) {
      if (userName) {
        const baseName = userName.split('#')[0];
        await supabase.from('profiles').delete().eq('name', baseName);
      }
      await supabase.auth.signOut();
      setSession(null);
      setUserName('');
      setScreen('auth');
    }
  };

  return (
    <>
      <div className="bg-animated"></div>

      {isInitializing ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', zIndex: 100 }}>
            <h1 className="game-title" style={{ fontSize: '3rem', opacity: 0.8 }}>Loading...</h1>
        </div>
      ) : (
        <>
          {activeInvite && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--glass-bg)', padding: '20px', borderRadius: '15px',
          border: '1px solid var(--btn-primary)', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          textAlign: 'center', backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{ marginBottom: '10px' }}>🎮 Game Invite!</h3>
          <p style={{ marginBottom: '15px' }}><strong>{activeInvite.sender.split('#')[0]}</strong> has challenged you!</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-primary" style={{ margin: 0, padding: '8px 15px' }} onClick={handleAcceptInvite}>Accept</button>
            <button className="btn-secondary" style={{ margin: 0, padding: '8px 15px', color: '#ff4444' }} onClick={handleDeclineInvite}>Decline</button>
          </div>
        </div>
      )}

      {screen === 'auth' && <AuthScreen onAuthSuccess={handleAuthSuccess} />}
      {screen === 'setup' && (
        <SetupScreen
          onLogout={handleLogout}
          onStartGame={() => setScreen('game')}
          onViewLeaderboard={() => setScreen('leaderboard')}
          onViewRules={() => setScreen('rules')}
          onViewFriends={() => setScreen('friends')}
          onViewProfile={(name) => {
            setViewingProfile(name);
            setPreviousScreen('setup');
            setScreen('profile');
          }}
          config={config}
          setConfig={setConfig}
          userName={userName}
          onDeleteAccount={handleDeleteAccount}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          config={config}
          userName={userName}
          onBack={() => {
            setConfig(prev => ({ ...prev, isOnline: false, roomId: null }));
            setScreen('setup');
          }}
        />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen
          onClose={() => setScreen('setup')}
          onViewProfile={(name) => {
            setViewingProfile(name);
            setPreviousScreen('leaderboard');
            setScreen('profile');
          }}
        />
      )}
      {screen === 'rules' && (
        <RulesScreen onClose={() => setScreen('setup')} />
      )}
      {screen === 'profile' && (
        <ProfileScreen
          playerName={viewingProfile}
          currentUserName={userName}
          currentUserEmail={session?.email}
          onClose={() => setScreen(previousScreen)}
          onChallenge={(challengeName) => {
            setConfig(prev => ({ ...prev, playerOName: challengeName, mode: 'pvp', isOnline: false }));
            setScreen('setup');
          }}
          onSendInvite={handleSendInvite}
          previousScreen={previousScreen}
        />
      )}
      {screen === 'friends' && (
        <FriendsScreen
          currentUserName={userName}
          onClose={() => setScreen('setup')}
          onViewProfile={(name) => {
            setViewingProfile(name);
            setPreviousScreen('friends');
            setScreen('profile');
          }}
          onChallenge={(challengeName) => {
            setConfig(prev => ({ ...prev, playerOName: challengeName, mode: 'pvp', isOnline: false }));
            setScreen('setup');
          }}
          onSendInvite={handleSendInvite}
        />
      )}
        </>
      )}
    </>
  );
}

export default App;
