function playTone(frequency: number, durationMs: number, volume = 0.12) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.01);
    osc.onended = () => void ctx.close();
  } catch {
    /* navigateur sans Web Audio ou autoplay bloqué */
  }
}

/** Notification métier (vente validée, etc.) */
export function playNotificationBeep() {
  playTone(880, 350, 0.15);
}

/** Erreur / validation */
export function playErrorBeep() {
  playTone(440, 180, 0.14);
  window.setTimeout(() => playTone(330, 220, 0.12), 200);
}

/** Succès */
export function playSuccessBeep() {
  playTone(660, 120, 0.1);
  window.setTimeout(() => playTone(880, 150, 0.1), 130);
}
