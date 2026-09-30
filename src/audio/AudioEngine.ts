/* ============================================================
   MOTOR DE AUDIO PROCEDURAL
   ============================================================

   Todo el audio del juego se SINTETIZA en tiempo real con WebAudio:
   no hay un solo archivo de sonido en el proyecto. Eso mantiene el
   bundle igual de ligero y permite que el sonido reaccione de verdad
   al estado del mundo (el viento suena según su fuerza real, la
   lluvia según su intensidad, los grillos según la hora).

   Reglas de la casa:
   - Nada suena hasta que el usuario interactúa (política de autoplay
     de los navegadores). `unlock()` se llama en el primer gesto.
   - Una sola cadena maestra con compresor, para que sumar capas nunca
     sature.
   - Los bucles ambientales son osciladores/ruido persistentes cuyos
     parámetros se interpolan; los efectos puntuales son voces
     de usar y tirar.
============================================================ */

type Bus = 'ambient' | 'sfx' | 'ui';

class AudioEngine {
  private ctx: AudioContext | null = null;

  private master: GainNode | null = null;

  private buses: Record<Bus, GainNode> | null = null;

  private noiseBuffer: AudioBuffer | null = null;

  private unlocked = false;

  private muted = false;

  /** Capas ambientales persistentes. */
  private wind: { gain: GainNode; filter: BiquadFilterNode } | null = null;

  private rain: { gain: GainNode; filter: BiquadFilterNode } | null = null;

  private night: { gain: GainNode; osc: OscillatorNode; lfo: OscillatorNode } | null = null;

  private water: { gain: GainNode; filter: BiquadFilterNode } | null = null;

  private lastBirdAt = 0;

  private lastThunderAt = 0;

  /* ---------------- infraestructura ---------------- */

  get enabled(): boolean {
    return this.unlocked && !this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  unlock(): void {
    if (this.unlocked) return;

    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;

      if (!Ctor) return;

      this.ctx = new Ctor();

      const master = this.ctx.createGain();
      master.gain.value = 0.9;

      // Compresor al final de la cadena: sin esto, viento + lluvia +
      // pasos + UI a la vez distorsionan al sumarse.
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 24;
      comp.ratio.value = 6;
      comp.attack.value = 0.004;
      comp.release.value = 0.25;

      master.connect(comp);
      comp.connect(this.ctx.destination);
      this.master = master;

      const mk = (v: number) => {
        const g = this.ctx!.createGain();
        g.gain.value = v;
        g.connect(master);
        return g;
      };

      this.buses = {
        ambient: mk(0.55),
        sfx: mk(0.8),
        ui: mk(0.5),
      };

      this.noiseBuffer = this.createNoiseBuffer();
      this.unlocked = true;

      this.startAmbientLayers();
    } catch {
      this.unlocked = false;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(
        muted ? 0 : 0.9,
        this.ctx.currentTime,
        0.08,
      );
    }
  }

  private createNoiseBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);

    // Ruido rosa aproximado (Voss simplificado): el ruido blanco puro
    // suena a estática de TV; el rosa suena a naturaleza.
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i += 1) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099;
      b1 = 0.963 * b1 + white * 0.2965;
      b2 = 0.57 * b2 + white * 1.0526;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.28;
    }

    return buf;
  }

  private noiseSource(loop = true): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = loop;
    return src;
  }

  /* ---------------- capas ambientales ---------------- */

  private startAmbientLayers(): void {
    const ctx = this.ctx!;
    const bus = this.buses!.ambient;

    // -- viento: ruido pasa-banda cuyo centro sube con la fuerza --
    {
      const src = this.noiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start();
      this.wind = { gain, filter };
    }

    // -- lluvia: ruido con paso-alto, más brillante cuanto más fuerte --
    {
      const src = this.noiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1100;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start();
      this.rain = { gain, filter };
    }

    // -- grillos: tono agudo pulsado por un LFO --
    {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = 4300;

      const lfo = ctx.createOscillator();
      lfo.type = 'square';
      lfo.frequency.value = 11;

      // El LFO modula la AMPLITUD (tremolo, 0.6–1.4) en una etapa
      // aparte — antes se sumaba directo al gain final, que debía
      // llegar casi a 0 de día: un AudioParam SUMA las señales
      // conectadas, así que el LFO (±0.5) dominaba sobre el volumen
      // real (máx 0.035) y el tono de 4300Hz sonaba fuerte y
      // constante sin importar hora/clima — el "pitido intenso todo
      // el rato".
      const tremolo = ctx.createGain();
      tremolo.gain.value = 1;

      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 0.4;
      lfo.connect(lfoDepth);
      lfoDepth.connect(tremolo.gain);

      const gain = ctx.createGain();
      gain.gain.value = 0;

      osc.connect(tremolo);
      tremolo.connect(gain);
      gain.connect(bus);
      osc.start();
      lfo.start();

      this.night = { gain, osc, lfo };
    }

    // -- agua: ruido grave y lento, solo cerca del lago --
    {
      const src = this.noiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(bus);
      src.start();
      this.water = { gain, filter };
    }
  }

  /**
   * Actualiza el ambiente. Se llama desde useFrame pero solo hace
   * `setTargetAtTime`, que es una rampa suave en el hilo de audio:
   * llamarlo 60 veces por segundo no genera clics ni carga.
   */
  updateAmbience(params: {
    windStrength: number;
    rain: number;
    night: number;
    nearWater: number;
    indoors: boolean;
  }): void {
    if (!this.enabled || !this.ctx) return;

    const t = this.ctx.currentTime;
    const dampen = params.indoors ? 0.25 : 1;

    if (this.wind) {
      const w = Math.min(1.6, params.windStrength);
      this.wind.gain.gain.setTargetAtTime(0.05 + w * 0.14 * dampen, t, 0.6);
      this.wind.filter.frequency.setTargetAtTime(320 + w * 520, t, 0.8);
    }

    if (this.rain) {
      this.rain.gain.gain.setTargetAtTime(params.rain * 0.28 * dampen, t, 0.5);
      this.rain.filter.frequency.setTargetAtTime(
        900 + params.rain * 900,
        t,
        0.8,
      );
    }

    if (this.night) {
      // Los grillos callan bajo lluvia — detalle pequeño que vende
      // mucho la conexión entre sistemas.
      const crickets = params.night * (1 - params.rain) * dampen;
      this.night.gain.gain.setTargetAtTime(crickets * 0.035, t, 1.2);
    }

    if (this.water) {
      this.water.gain.gain.setTargetAtTime(
        params.nearWater * 0.16 * dampen,
        t,
        0.5,
      );
    }

    // Pájaros esporádicos de día; truenos esporádicos en tormenta.
    const now = performance.now();

    if (
      !params.indoors &&
      params.night < 0.35 &&
      params.rain < 0.2 &&
      now - this.lastBirdAt > 2600 + Math.random() * 6000
    ) {
      this.lastBirdAt = now;
      this.birdChirp();
    }

    if (params.rain > 0.85 && now - this.lastThunderAt > 9000 + Math.random() * 16000) {
      this.lastThunderAt = now;
      this.thunder();
    }
  }

  /* ---------------- efectos puntuales ---------------- */

  private voice(
    bus: Bus,
    build: (ctx: AudioContext, out: GainNode) => void,
  ): void {
    if (!this.enabled || !this.ctx || !this.buses) return;
    build(this.ctx, this.buses[bus]);
  }

  /** Paso: golpe corto de ruido filtrado. La superficie cambia el timbre. */
  footstep(surface: 'grass' | 'wood' | 'stone' | 'water' = 'grass'): void {
    this.voice('sfx', (ctx, out) => {
      const src = this.noiseSource(false);
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      const cfg = {
        grass: { type: 'bandpass' as const, freq: 950, q: 1.1, dur: 0.11, vol: 0.16 },
        wood: { type: 'bandpass' as const, freq: 420, q: 3.2, dur: 0.14, vol: 0.24 },
        stone: { type: 'highpass' as const, freq: 1700, q: 0.8, dur: 0.09, vol: 0.2 },
        water: { type: 'lowpass' as const, freq: 700, q: 0.9, dur: 0.2, vol: 0.22 },
      }[surface];

      filter.type = cfg.type;
      // Pequeña variación de tono por paso: dos pasos idénticos
      // seguidos se oyen inmediatamente como un bucle.
      filter.frequency.value = cfg.freq * (0.85 + Math.random() * 0.3);
      filter.Q.value = cfg.q;

      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(cfg.vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + cfg.dur);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(t);
      src.stop(t + cfg.dur + 0.02);
    });
  }

  /** Tono suave para la UI. */
  ui(kind: 'hover' | 'open' | 'close' | 'confirm' = 'confirm'): void {
    this.voice('ui', (ctx, out) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';

      const t = ctx.currentTime;
      const cfg = {
        hover: { from: 900, to: 1150, dur: 0.07, vol: 0.06 },
        open: { from: 520, to: 880, dur: 0.18, vol: 0.13 },
        close: { from: 820, to: 440, dur: 0.16, vol: 0.11 },
        confirm: { from: 660, to: 990, dur: 0.14, vol: 0.12 },
      }[kind];

      osc.frequency.setValueAtTime(cfg.from, t);
      osc.frequency.exponentialRampToValueAtTime(cfg.to, t + cfg.dur);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(cfg.vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + cfg.dur);

      osc.connect(gain);
      gain.connect(out);
      osc.start(t);
      osc.stop(t + cfg.dur + 0.02);
    });
  }

  /** Acorde cálido para recompensas / logros. */
  reward(): void {
    this.voice('ui', (ctx, out) => {
      [0, 4, 7, 12].forEach((semi, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = 440 * Math.pow(2, semi / 12);

        const t = ctx.currentTime + i * 0.055;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.55);
      });
    });
  }

  /** Chapoteo — pescar, entrar al agua. */
  splash(): void {
    this.voice('sfx', (ctx, out) => {
      const src = this.noiseSource(false);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const gain = ctx.createGain();

      const t = ctx.currentTime;
      filter.frequency.setValueAtTime(2400, t);
      filter.frequency.exponentialRampToValueAtTime(320, t + 0.35);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(t);
      src.stop(t + 0.45);
    });
  }

  /** Ladrido corto de perro. */
  bark(): void {
    this.voice('sfx', (ctx, out) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 700;
      filter.Q.value = 2;

      osc.type = 'sawtooth';
      const t = ctx.currentTime;
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.12);

      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.14, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  private birdChirp(): void {
    this.voice('ambient', (ctx, out) => {
      const notes = 2 + Math.floor(Math.random() * 3);
      const base = 2200 + Math.random() * 1400;

      for (let i = 0; i < notes; i += 1) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const t = ctx.currentTime + i * (0.07 + Math.random() * 0.05);
        const f = base * (0.85 + Math.random() * 0.4);
        osc.frequency.setValueAtTime(f, t);
        osc.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.05);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.045, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

        osc.connect(gain);
        gain.connect(out);
        osc.start(t);
        osc.stop(t + 0.12);
      }
    });
  }

  private thunder(): void {
    this.voice('ambient', (ctx, out) => {
      const src = this.noiseSource(false);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;
      const gain = ctx.createGain();

      const t = ctx.currentTime + 0.15 + Math.random() * 0.6;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.4, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(out);
      src.start(t);
      src.stop(t + 2.0);
    });
  }
}

export const audio = new AudioEngine();
