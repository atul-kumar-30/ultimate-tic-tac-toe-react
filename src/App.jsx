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
  const [viewingProfile, setViewingProfile] = useState(null);
  const [config, setConfig] = useState({
    mode: 'pvp',
    difficulty: 'medium',
    playerXName: 'Player X',
    playerOName: 'Player O',
    gridSize: 3,
    blitzMode: false
  });
  const [userName, setUserName] = useState('');
  const [previousScreen, setPreviousScreen] = useState('setup');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthSuccess(session?.user);
    });
  }, []);

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
        if (!profile || !tag) {
           tag = '#' + Math.floor(1000 + Math.random() * 9000).toString();
           const localProfilesRaw = JSON.parse(localStorage.getItem('localProfiles') || '{}');
           const localStats = localProfilesRaw[name];
           
           await supabase.from('profiles').upsert([{ 
               name: name, 
               player_tag: tag,
               mmr: profile?.mmr || localStats?.mmr || 1000, 
               wins: profile?.wins || localStats?.wins || 0, 
               losses: profile?.losses || localStats?.losses || 0, 
               draws: profile?.draws || localStats?.draws || 0 
           }], { onConflict: 'name' });
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
          onBack={() => setScreen('setup')}
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
            setConfig(prev => ({ ...prev, playerOName: challengeName, mode: 'pvp' }));
            setScreen('setup');
          }}
        />
      )}
      {screen === 'friends' && (
        <FriendsScreen currentUserName={userName} onClose={() => setScreen('setup')} onViewProfile={(name) => {
            setViewingProfile(name);
            setPreviousScreen('friends');
            setScreen('profile');
        }} />
      )}
    </>
  );
}

export default App;
