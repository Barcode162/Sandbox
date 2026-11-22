// src/ui/sound.ts — optional synthesized sound (off by default; experience.md §11).
// Visit 520 Hz sine 60 ms −24 dB (+1 semitone per loop), false 300 Hz blip, result triad 400 ms,
// route arrival 2 kHz tick 20 ms. Mix: result > visit > tick.

export class Sound {
  enabled = false;
  private ctx: AudioContext | null = null;

  private audio(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  private tone(freq: number, ms: number, db: number, type: OscillatorType = 'sine', delay = 0): void {
    const ctx = this.audio();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const peak = Math.pow(10, db / 20);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + ms / 1000 + 0.02);
  }

  visit(loop: number): void {
    this.tone(520 * Math.pow(2, loop / 12), 60, -24);
  }

  falseBlip(): void {
    this.tone(300, 70, -24, 'triangle');
  }

  result(): void {
    [0, 4, 7].forEach((st, i) => this.tone(400 * Math.pow(2, st / 12), 400 - i * 60, -20, 'sine', i * 40));
  }

  tick(delay = 0): void {
    this.tone(2000, 20, -30, 'square', delay);
  }
}
