import React, { useState } from 'react';
import Select from 'react-select';
import ReactCountryFlag from 'react-country-flag';
import { supabase } from '../lib/supabase';

import { countries } from '../lib/countries';

const countryOptions = countries.map(c => ({
  value: c.name,
  label: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <ReactCountryFlag countryCode={c.code} svg style={{ width: '1.5em', height: '1.5em' }} />
      <span>{c.name}</span>
    </div>
  )
}));

const customSelectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '2px',
    boxShadow: 'none',
    '&:hover': {
      borderColor: '#4f46e5'
    }
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: '#0f172a',
    zIndex: 100
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? '#1e293b' : 'transparent',
    color: '#f8fafc',
    cursor: 'pointer'
  }),
  singleValue: (provided) => ({
    ...provided,
    color: '#f8fafc'
  }),
  input: (provided) => ({
    ...provided,
    color: '#f8fafc'
  })
};

export default function AuthScreen({ onAuthSuccess }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    setError('');

    if (isSignup) {
      if (!name) {
        setError("Player Name is required.");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name: name.trim(), country: country ? country.value : '' }
        }
      });
      
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("Email already in use or requires confirmation.");
        setLoading(false);
        return;
      }
      
      await supabase.from('profiles').insert([
        { name: name.trim(), country: country ? country.value : null, mmr: 1000, wins: 0, losses: 0, draws: 0 }
      ]);
      
      onAuthSuccess(data.user);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      onAuthSuccess(data.user);
    }
  };

  return (
    <div className="glass-panel" style={{ width: '400px', maxWidth: '90vw', position: 'relative', zIndex: 50 }}>
      <h1 className="game-title">{isSignup ? "Sign Up" : "Login"}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
        {isSignup ? "Create an account to track your global rank!" : "Welcome back! Sign in to sync your rank."}
      </p>
      
      <div className="setup-group">
        <input 
          type="email" 
          placeholder="Email Address" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required 
        />
      </div>
      
      {isSignup && (
        <div id="signup-fields">
          <div className="setup-group">
            <input 
              type="text" 
              placeholder="Player Name (e.g., CoolGuy99)" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>
          <div className="setup-group">
            <Select
              options={countryOptions}
              value={country}
              onChange={setCountry}
              placeholder="Select country"
              styles={customSelectStyles}
            />
          </div>
        </div>
      )}
      
      <div className="setup-group">
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required 
        />
      </div>
      
      <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? (isSignup ? "Creating..." : "Loading...") : (isSignup ? "Create Account" : "Login")}
      </button>
      
      <p style={{ color: 'var(--color-o)', marginTop: '10px', fontSize: '0.9rem', minHeight: '20px' }}>
        {error}
      </p>
      
      <p style={{ marginTop: '15px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); setIsSignup(!isSignup); setError(''); }}
          style={{ color: 'var(--color-x)', textDecoration: 'none', fontWeight: 600 }}
        >
          {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
        </a>
      </p>
    </div>
  );
}
