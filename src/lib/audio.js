let audioCtx = null;

export function playPopSound(player) {
  // Initialize AudioContext on first user interaction
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  // Resume context if suspended (browser policy)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  
  const startTime = audioCtx.currentTime;
  const duration = 0.1; // 100ms

  // Give 'X' a slightly higher pitch than 'O'
  const startFreq = player === 'x' ? 800 : 600;
  const endFreq = player === 'x' ? 200 : 150;

  oscillator.frequency.setValueAtTime(startFreq, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(endFreq, startTime + duration);

  gainNode.gain.setValueAtTime(1, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}
export function playVictorySound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const notes = [
    { freq: 440.00, time: 0 },    // A4
    { freq: 554.37, time: 0.1 },  // C#5
    { freq: 659.25, time: 0.2 },  // E5
    { freq: 880.00, time: 0.3 }   // A5
  ];

  notes.forEach(note => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'triangle';
    
    const startTime = audioCtx.currentTime + note.time;
    oscillator.frequency.setValueAtTime(note.freq, startTime);
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.3);
  });
}

export function playDrawSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.type = 'sawtooth';
  
  const startTime = audioCtx.currentTime;
  oscillator.frequency.setValueAtTime(300, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(100, startTime + 0.4);
  
  gainNode.gain.setValueAtTime(0.3, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.4);
}
