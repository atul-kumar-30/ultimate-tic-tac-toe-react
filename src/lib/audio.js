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
