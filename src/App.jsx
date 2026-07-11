import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import AuthScreen from './components/AuthScreen';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import LeaderboardScreen from './components/LeaderboardScreen';
import RulesScreen from './components/RulesScreen';
import ProfileScreen from './components/ProfileScreen';
import './index.css';

function App() {
  const [session, setSession] = useState(null);
  const [screen, setScreen] = useState('auth'); // 'auth', 'setup', 'game', 'leaderboard', 'profile'
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
          // Ensure they have a profile
          await supabase.from('profiles').upsert([{ name: name, mmr: 1000, wins: 0, losses: 0, draws: 0 }], { onConflict: 'name' });
        }
      }

      if (name) {
        setUserName(name);
        setConfig(prev => ({ ...prev, playerXName: name }));
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
        await supabase.from('profiles').delete().eq('name', userName);
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
          onViewProfile={(name) => {
            setViewingProfile(name);
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
        <LeaderboardScreen onClose={() => setScreen('setup')} />
      )}
      {screen === 'rules' && (
        <RulesScreen onClose={() => setScreen('setup')} />
      )}
      {screen === 'profile' && (
        <ProfileScreen playerName={viewingProfile} onClose={() => setScreen('setup')} />
      )}
    </>
  );
}

export default App;
