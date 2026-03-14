// sound.js - Sound Manager for Cờ Tướng using Web Audio API

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = localStorage.getItem('cotuong_muted') === 'true';
        this.bgMusicPlaying = false;
        this.bgNodes = null;
        this.initialized = false;
    }

    // Must be called from a user gesture (click/touch) to unlock AudioContext
    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            if (!this.muted) {
                this.startBackgroundMusic();
            }
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    _ensureContext() {
        // Auto-initialize AudioContext if not yet created
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                this.initialized = true;
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
                return false;
            }
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return true;
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('cotuong_muted', this.muted);
        if (this.muted) {
            this.stopBackgroundMusic();
        } else {
            this.init();
            if (this.initialized && !this.bgMusicPlaying) {
                this.startBackgroundMusic();
            }
        }
        return this.muted;
    }

    // ==================== BACKGROUND MUSIC ====================
    // 女儿情 (Nữ Nhi Tình) style — guzheng arpeggios + erhu melody
    startBackgroundMusic() {
        if (!this._ensureContext() || this.bgMusicPlaying) return;

        const ctx = this.ctx;
        this.bgMusicPlaying = true;
        this._bgTimers = [];

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.10;
        masterGain.connect(ctx.destination);

        // Reverb effect
        const reverbDelay = ctx.createDelay(0.5);
        reverbDelay.delayTime.value = 0.3;
        const reverbFB = ctx.createGain();
        reverbFB.gain.value = 0.2;
        const reverbLP = ctx.createBiquadFilter();
        reverbLP.type = 'lowpass';
        reverbLP.frequency.value = 2500;
        reverbDelay.connect(reverbLP);
        reverbLP.connect(reverbFB);
        reverbFB.connect(reverbDelay);
        const reverbOut = ctx.createGain();
        reverbOut.gain.value = 0.25;
        reverbLP.connect(reverbOut);
        reverbOut.connect(masterGain);

        // ===== GUZHENG (古筝) — Plucked string synthesis =====
        const playGuzheng = (freq, time, duration, vol = 0.4) => {
            if (!this.bgMusicPlaying) return;
            const sr = ctx.sampleRate;
            const period = Math.round(sr / freq);
            const total = Math.round(sr * duration);
            const buf = ctx.createBuffer(1, total, sr);
            const d = buf.getChannelData(0);
            // Pluck excitation — slightly filtered noise
            for (let i = 0; i < period; i++) {
                d[i] = (Math.random() * 2 - 1) * 0.5;
            }
            // Karplus-Strong with slightly brighter decay (guzheng ring)
            for (let i = period; i < total; i++) {
                d[i] = (d[i - period] * 0.5 + d[i - period + 1] * 0.5) * 0.4985;
            }
            const src = ctx.createBufferSource();
            src.buffer = buf;
            // Guzheng bright tone
            const flt = ctx.createBiquadFilter();
            flt.type = 'peaking';
            flt.frequency.value = freq * 3;
            flt.Q.value = 2;
            flt.gain.value = 4;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(vol, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
            src.connect(flt);
            flt.connect(gain);
            gain.connect(masterGain);
            gain.connect(reverbDelay);
            src.start(time);
            src.stop(time + duration);
        };

        // ===== ERHU (二胡) — Expressive bowed string =====
        const playErhu = (freq, time, duration, vol = 0.15) => {
            if (!this.bgMusicPlaying) return;
            // Main tone — sine with harmonics
            const osc1 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.value = freq;
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = freq * 2; // Octave harmonic
            const osc2vol = ctx.createGain();
            osc2vol.gain.value = 0.15;
            osc2.connect(osc2vol);

            // Expressive vibrato (erhu characteristic)
            const vib = ctx.createOscillator();
            vib.type = 'sine';
            vib.frequency.value = 5.8;
            const vibGain = ctx.createGain();
            vibGain.gain.setValueAtTime(0, time);
            vibGain.gain.linearRampToValueAtTime(4, time + 0.3); // Vibrato grows
            vib.connect(vibGain);
            vibGain.connect(osc1.frequency);

            // Slight pitch slide at start (portamento feel)
            osc1.frequency.setValueAtTime(freq * 0.98, time);
            osc1.frequency.linearRampToValueAtTime(freq, time + 0.08);

            // Erhu-like nasal filter
            const nasalFilter = ctx.createBiquadFilter();
            nasalFilter.type = 'peaking';
            nasalFilter.frequency.value = freq * 1.5;
            nasalFilter.Q.value = 3;
            nasalFilter.gain.value = 6;

            const lpFilter = ctx.createBiquadFilter();
            lpFilter.type = 'lowpass';
            lpFilter.frequency.value = 3500;

            // Bowing envelope — gentle swell
            const noteGain = ctx.createGain();
            noteGain.gain.setValueAtTime(0, time);
            noteGain.gain.linearRampToValueAtTime(vol, time + 0.12);
            noteGain.gain.setValueAtTime(vol * 0.9, time + duration * 0.6);
            noteGain.gain.linearRampToValueAtTime(0, time + duration);

            osc1.connect(nasalFilter);
            osc2vol.connect(nasalFilter);
            nasalFilter.connect(lpFilter);
            lpFilter.connect(noteGain);
            noteGain.connect(masterGain);
            noteGain.connect(reverbDelay);

            osc1.start(time); osc1.stop(time + duration + 0.05);
            osc2.start(time); osc2.stop(time + duration + 0.05);
            vib.start(time); vib.stop(time + duration + 0.05);
        };

        // ===== 女儿情 MELODY (simplified, key of C) =====
        // C4=261.63 D4=293.66 E4=329.63 F4=349.23 G4=392.00
        // A4=440.00 B4=493.88 C5=523.25 D5=587.33 E5=659.25 G5=783.99

        const melodyPhrases = [
            // 鸳鸯双栖蝶双飞 — "Uyên ương song thê, điệp song phi"
            [
                { f: 329.63, d: 0.5 },  // E4
                { f: 392.00, d: 0.4 },  // G4
                { f: 440.00, d: 0.5 },  // A4
                { f: 523.25, d: 0.8 },  // C5
                { f: 493.88, d: 0.4 },  // B4
                { f: 440.00, d: 0.5 },  // A4
                { f: 392.00, d: 0.5 },  // G4
                { f: 329.63, d: 1.0 },  // E4
            ],
            // 满园春色惹人醉 — "Mãn viên xuân sắc nhạ nhân túy"
            [
                { f: 293.66, d: 0.5 },  // D4
                { f: 261.63, d: 0.4 },  // C4
                { f: 293.66, d: 0.4 },  // D4
                { f: 329.63, d: 0.8 },  // E4
                { f: 392.00, d: 0.5 },  // G4
                { f: 440.00, d: 0.5 },  // A4
                { f: 392.00, d: 0.5 },  // G4
                { f: 329.63, d: 1.2 },  // E4
            ],
            // 悄悄问圣僧 — "Tiễu tiễu vấn thánh tăng"
            [
                { f: 440.00, d: 0.5 },  // A4
                { f: 523.25, d: 0.6 },  // C5
                { f: 587.33, d: 0.8 },  // D5
                { f: 659.25, d: 1.0 },  // E5
                { f: 587.33, d: 0.4 },  // D5
                { f: 523.25, d: 0.6 },  // C5
                { f: 440.00, d: 1.2 },  // A4
            ],
            // 女儿美不美 — "Nữ nhi mỹ bất mỹ"
            [
                { f: 392.00, d: 0.6 },  // G4
                { f: 440.00, d: 0.5 },  // A4
                { f: 523.25, d: 0.8 },  // C5
                { f: 440.00, d: 0.5 },  // A4
                { f: 392.00, d: 0.4 },  // G4
                { f: 329.63, d: 0.5 },  // E4
                { f: 293.66, d: 0.5 },  // D4
                { f: 261.63, d: 1.5 },  // C4
            ],
            // 说什么王权富贵 — "Thuyết thập ma vương quyền phú quý"
            [
                { f: 329.63, d: 0.4 },  // E4
                { f: 392.00, d: 0.4 },  // G4
                { f: 440.00, d: 0.6 },  // A4
                { f: 523.25, d: 0.5 },  // C5
                { f: 587.33, d: 0.8 },  // D5
                { f: 523.25, d: 0.5 },  // C5
                { f: 440.00, d: 0.6 },  // A4
                { f: 392.00, d: 1.2 },  // G4
            ],
            // 怕什么戒律清规 — "Phạ thập ma giới luật thanh quy"
            [
                { f: 587.33, d: 0.5 },  // D5
                { f: 523.25, d: 0.4 },  // C5
                { f: 440.00, d: 0.5 },  // A4
                { f: 392.00, d: 0.6 },  // G4
                { f: 329.63, d: 0.5 },  // E4
                { f: 293.66, d: 0.4 },  // D4
                { f: 329.63, d: 0.5 },  // E4
                { f: 261.63, d: 1.5 },  // C4
            ],
        ];

        // Accompaniment chords matching the melody
        const chords = [
            // Am: A C E
            [220.00, 261.63, 329.63, 440.00, 329.63, 261.63],
            // C:  C E G
            [261.63, 329.63, 392.00, 523.25, 392.00, 329.63],
            // F:  F A C
            [174.61, 220.00, 261.63, 349.23, 261.63, 220.00],
            // G:  G B D
            [196.00, 246.94, 293.66, 392.00, 293.66, 246.94],
            // Am: A C E
            [220.00, 261.63, 329.63, 440.00, 329.63, 261.63],
            // Em: E G B
            [164.81, 196.00, 246.94, 329.63, 246.94, 196.00],
        ];

        // ===== MAIN LOOP =====
        let phraseIdx = 0;

        const playPhrase = () => {
            if (!this.bgMusicPlaying || this.muted) return;
            const now = ctx.currentTime;
            const idx = phraseIdx % melodyPhrases.length;

            // Play guzheng arpeggio accompaniment
            const chord = chords[idx % chords.length];
            const spacing = 0.32;
            for (let i = 0; i < chord.length; i++) {
                playGuzheng(chord[i], now + i * spacing, 2.0, 0.25 + Math.random() * 0.08);
            }

            // Play erhu melody slightly after guitar starts
            const phrase = melodyPhrases[idx];
            let t = now + 0.15;
            for (const note of phrase) {
                playErhu(note.f, t, note.d, 0.12);
                t += note.d + 0.03;
            }

            phraseIdx++;

            // Pause between phrases (natural breathing space)
            const phraseDuration = phrase.reduce((s, n) => s + n.d + 0.03, 0);
            const pause = phraseDuration * 1000 + 800 + Math.random() * 600;
            const timer = setTimeout(playPhrase, pause);
            this._bgTimers.push(timer);
        };

        this.bgNodes = { masterGain, reverbDelay, reverbFB, reverbLP, reverbOut };

        // Start after gentle pause
        const startTimer = setTimeout(playPhrase, 1200);
        this._bgTimers.push(startTimer);
    }

    stopBackgroundMusic() {
        if (!this.bgMusicPlaying) return;
        this.bgMusicPlaying = false;
        // Clear all scheduled timers
        if (this._bgTimers) {
            this._bgTimers.forEach(t => clearTimeout(t));
            this._bgTimers = [];
        }
        clearTimeout(this._melodyTimer);
        if (this.bgNodes) {
            const { masterGain } = this.bgNodes;
            try {
                const now = this.ctx.currentTime;
                masterGain.gain.linearRampToValueAtTime(0, now + 0.8);
            } catch (e) { /* context may be closed */ }
        }
        // Clean up after fade
        setTimeout(() => {
            this.bgNodes = null;
        }, 1000);
    }

    // ==================== GAME SOUNDS ====================

    // Piece placed on empty square — wooden click
    playMove() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Short noise burst for "click" sound
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to make it sound like wood
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        filter.Q.value = 2;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.1);

        // Add a subtle tonal "tock" 
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 800;
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.2, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
    }

    // Piece captures another piece — heavier impact
    playCapture() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Longer noise burst for impact
        const bufferSize = ctx.sampleRate * 0.15;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
        noise.stop(now + 0.2);

        // Lower thud tone
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.12);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(oscGain);
        oscGain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);

        // Secondary "crack" overtone
        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.value = 1000;
        const osc2Gain = ctx.createGain();
        osc2Gain.gain.setValueAtTime(0.15, now);
        osc2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc2.connect(osc2Gain);
        osc2Gain.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.1);
    }

    // King is in check — rising alert tone
    playCheck() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // Two-tone alert: low → high
        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.12);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
        gain.gain.setValueAtTime(0.18, now + 0.10);
        gain.gain.linearRampToValueAtTime(0, now + 0.11);
        gain.gain.linearRampToValueAtTime(0.22, now + 0.13);
        gain.gain.setValueAtTime(0.22, now + 0.22);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);

        // Sine accent overlay
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now + 0.12);
        const gain2 = ctx.createGain();
        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.12, now + 0.14);
        gain2.gain.linearRampToValueAtTime(0, now + 0.35);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.4);
    }

    // Game won — POWERFUL triumphant fanfare with applause
    playVictory() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        // ===== MASTER OUTPUT — LOUD =====
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.55;
        masterGain.connect(ctx.destination);

        // ===== REVERB for epic space =====
        const reverbDelay = ctx.createDelay(0.4);
        reverbDelay.delayTime.value = 0.25;
        const reverbFB = ctx.createGain();
        reverbFB.gain.value = 0.3;
        const reverbLP = ctx.createBiquadFilter();
        reverbLP.type = 'lowpass';
        reverbLP.frequency.value = 3000;
        reverbDelay.connect(reverbLP);
        reverbLP.connect(reverbFB);
        reverbFB.connect(reverbDelay);
        const reverbOut = ctx.createGain();
        reverbOut.gain.value = 0.35;
        reverbLP.connect(reverbOut);
        reverbOut.connect(masterGain);

        // ===== TIMPANI HITS — powerful drum impact =====
        const playTimpani = (time, freq, vol) => {
            // Noise burst for attack
            const nLen = ctx.sampleRate * 0.08;
            const nBuf = ctx.createBuffer(1, nLen, ctx.sampleRate);
            const nData = nBuf.getChannelData(0);
            for (let i = 0; i < nLen; i++) {
                nData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (nLen * 0.1));
            }
            const nSrc = ctx.createBufferSource();
            nSrc.buffer = nBuf;
            const nGain = ctx.createGain();
            nGain.gain.setValueAtTime(vol * 0.6, time);
            nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
            const nFlt = ctx.createBiquadFilter();
            nFlt.type = 'lowpass';
            nFlt.frequency.value = 400;
            nSrc.connect(nFlt);
            nFlt.connect(nGain);
            nGain.connect(masterGain);
            nSrc.start(time);
            nSrc.stop(time + 0.2);

            // Low tone body
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.7, time + 0.5);
            const g = ctx.createGain();
            g.gain.setValueAtTime(vol, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
            osc.connect(g);
            g.connect(masterGain);
            osc.start(time);
            osc.stop(time + 0.7);
        };

        // Two big timpani hits
        playTimpani(now, 80, 0.9);
        playTimpani(now + 0.3, 65, 1.0);

        // ===== BRASS FANFARE — bold chord progression =====
        const playBrass = (freq, time, dur, vol = 0.7) => {
            // Sawtooth for brass timbre
            const osc1 = ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.value = freq;

            // Second harmonic
            const osc2 = ctx.createOscillator();
            osc2.type = 'square';
            osc2.frequency.value = freq * 2;
            const o2g = ctx.createGain();
            o2g.gain.value = 0.12;
            osc2.connect(o2g);

            // Brass filter — slight nasal quality
            const flt = ctx.createBiquadFilter();
            flt.type = 'lowpass';
            flt.frequency.setValueAtTime(1200, time);
            flt.frequency.linearRampToValueAtTime(3500, time + 0.08);
            flt.Q.value = 1.5;

            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(vol, time + 0.06);
            gain.gain.setValueAtTime(vol * 0.85, time + dur * 0.5);
            gain.gain.linearRampToValueAtTime(0, time + dur);

            osc1.connect(flt);
            o2g.connect(flt);
            flt.connect(gain);
            gain.connect(masterGain);
            gain.connect(reverbDelay);
            osc1.start(time); osc1.stop(time + dur + 0.05);
            osc2.start(time); osc2.stop(time + dur + 0.05);
        };

        // Fanfare: three bold chords → triumphant sustained chord
        // Chord 1: C major (C4 E4 G4) — hit!
        playBrass(261.63, now + 0.15, 0.35, 0.65);
        playBrass(329.63, now + 0.15, 0.35, 0.55);
        playBrass(392.00, now + 0.15, 0.35, 0.50);

        // Chord 2: G major (G4 B4 D5) — hit!
        playBrass(392.00, now + 0.55, 0.35, 0.70);
        playBrass(493.88, now + 0.55, 0.35, 0.60);
        playBrass(587.33, now + 0.55, 0.35, 0.55);

        // Chord 3: C major high (C5 E5 G5 C6) — TRIUMPHANT HOLD!
        playBrass(523.25, now + 0.95, 1.8, 0.80);
        playBrass(659.25, now + 0.95, 1.8, 0.70);
        playBrass(783.99, now + 0.95, 1.8, 0.65);
        playBrass(1046.50, now + 1.05, 1.6, 0.55);

        // Timpani accent on final chord
        playTimpani(now + 0.95, 70, 1.0);

        // ===== SHIMMERING OVERTONES =====
        [1568, 2093].forEach((f, i) => {
            const sh = ctx.createOscillator();
            sh.type = 'sine';
            sh.frequency.value = f;
            const sg = ctx.createGain();
            const st = now + 1.1 + i * 0.15;
            sg.gain.setValueAtTime(0, st);
            sg.gain.linearRampToValueAtTime(0.12, st + 0.1);
            sg.gain.exponentialRampToValueAtTime(0.001, st + 2.0);
            sh.connect(sg);
            sg.connect(masterGain);
            sh.start(st); sh.stop(st + 2.1);
        });

        // ===== CROWD APPLAUSE — synthesized clapping =====
        this._playApplause(ctx, masterGain, now + 0.6, 4.0);
    }

    // Synthesized applause: many randomized short noise bursts simulating a crowd clapping
    _playApplause(ctx, destination, startTime, duration) {
        const applauseGain = ctx.createGain();
        applauseGain.gain.setValueAtTime(0, startTime);
        applauseGain.gain.linearRampToValueAtTime(0.45, startTime + 0.5);
        applauseGain.gain.setValueAtTime(0.45, startTime + duration * 0.6);
        applauseGain.gain.linearRampToValueAtTime(0, startTime + duration);

        // Bandpass to shape clap sound
        const clapFilter = ctx.createBiquadFilter();
        clapFilter.type = 'bandpass';
        clapFilter.frequency.value = 2800;
        clapFilter.Q.value = 0.8;

        // High-pass to remove rumble
        const hiPass = ctx.createBiquadFilter();
        hiPass.type = 'highpass';
        hiPass.frequency.value = 800;

        clapFilter.connect(hiPass);
        hiPass.connect(applauseGain);
        applauseGain.connect(destination);

        // Generate continuous clapping texture: layered noise bursts
        const layers = 5;
        for (let layer = 0; layer < layers; layer++) {
            const totalSamples = Math.ceil(ctx.sampleRate * duration);
            const buf = ctx.createBuffer(1, totalSamples, ctx.sampleRate);
            const data = buf.getChannelData(0);

            // Random clap events — irregular spacing like real crowd
            const clapInterval = 0.08 + Math.random() * 0.06; // ~80-140ms between claps
            const clapSamples = Math.floor(ctx.sampleRate * 0.012); // each clap ~12ms
            let pos = Math.floor(Math.random() * ctx.sampleRate * 0.05); // random offset per layer

            while (pos < totalSamples) {
                // Each clap: short burst of filtered noise
                for (let i = 0; i < clapSamples && (pos + i) < totalSamples; i++) {
                    const env = Math.exp(-i / (clapSamples * 0.2));
                    data[pos + i] += (Math.random() * 2 - 1) * env * 0.5;
                }
                // Irregular spacing
                const gap = clapInterval + (Math.random() - 0.5) * 0.08;
                pos += Math.floor(ctx.sampleRate * gap);
            }

            const src = ctx.createBufferSource();
            src.buffer = buf;
            const layerGain = ctx.createGain();
            layerGain.gain.value = 0.35 + Math.random() * 0.15;
            src.connect(layerGain);
            layerGain.connect(clapFilter);
            src.start(startTime + layer * 0.03);
            src.stop(startTime + duration + 0.1);
        }

        // Add a second texture: higher frequency "whistling/cheering" undertone
        const cheerLen = Math.ceil(ctx.sampleRate * duration);
        const cheerBuf = ctx.createBuffer(1, cheerLen, ctx.sampleRate);
        const cheerData = cheerBuf.getChannelData(0);
        for (let i = 0; i < cheerLen; i++) {
            cheerData[i] = (Math.random() * 2 - 1) * 0.15;
        }
        const cheerSrc = ctx.createBufferSource();
        cheerSrc.buffer = cheerBuf;
        const cheerFilter = ctx.createBiquadFilter();
        cheerFilter.type = 'bandpass';
        cheerFilter.frequency.value = 3500;
        cheerFilter.Q.value = 1.2;
        const cheerGain = ctx.createGain();
        cheerGain.gain.setValueAtTime(0, startTime);
        cheerGain.gain.linearRampToValueAtTime(0.2, startTime + 0.8);
        cheerGain.gain.setValueAtTime(0.2, startTime + duration * 0.5);
        cheerGain.gain.linearRampToValueAtTime(0, startTime + duration);
        cheerSrc.connect(cheerFilter);
        cheerFilter.connect(cheerGain);
        cheerGain.connect(destination);
        cheerSrc.start(startTime);
        cheerSrc.stop(startTime + duration + 0.1);
    }

    // Defeat — descending minor feel
    playDefeat() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const notes = [
            { freq: 392.00, time: 0, dur: 0.4 },     // G4
            { freq: 349.23, time: 0.2, dur: 0.4 },    // F4
            { freq: 311.13, time: 0.4, dur: 0.4 },    // Eb4
            { freq: 261.63, time: 0.6, dur: 0.8 },    // C4
        ];

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0.12;
        masterGain.connect(ctx.destination);

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = note.freq;
            const gain = ctx.createGain();
            const t = now + note.time;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, t + note.dur);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(t);
            osc.stop(t + note.dur + 0.05);
        });
    }

    // Select piece — soft click
    playSelect() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Invalid move — low buzz
    playInvalid() {
        if (this.muted || !this._ensureContext()) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 150;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.08);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
    }
}
