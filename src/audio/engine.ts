import type { SoundId } from '../lib/types.ts'
import { SOUNDS } from './sounds.ts'

/**
 * Plays recorded sounds on a loop.
 *
 * Each sound streams from its file through two audio elements ("voices").
 * Shortly before one voice reaches the end of the recording, the other
 * starts from the beginning and the two are crossfaded, so the loop has no
 * gap or click. Streaming keeps memory use low even for long recordings.
 */

type Voice = { el: HTMLAudioElement; gain: GainNode }

type Track = {
  voices: [Voice, Voice]
  active: 0 | 1
  out: GainNode
  fading: boolean
  stopTimer: number | undefined
}

export type SoundEngine = {
  /** call from a click handler so the browser allows audio */
  unlock(): void
  /** 0 turns the sound off */
  setVolume(id: SoundId, volume: number): void
  setPlaying(playing: boolean): void
  setMaster(volume: number): void
  playChime(): void
}

const CURVE_POINTS = 32
const FADE_IN = new Float32Array(CURVE_POINTS)
const FADE_OUT = new Float32Array(CURVE_POINTS)
for (let i = 0; i < CURVE_POINTS; i++) {
  const t = (i / (CURVE_POINTS - 1)) * (Math.PI / 2)
  FADE_IN[i] = Math.sin(t)
  FADE_OUT[i] = Math.cos(t)
}

export function createSoundEngine(): SoundEngine {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let limiter: DynamicsCompressorNode | null = null
  let masterVolume = 0.8
  let playing = false
  let watcher: number | undefined
  let suspendTimer: number | undefined
  const volumes = new Map<SoundId, number>()
  const tracks = new Map<SoundId, Track>()

  function ensure(): { ctx: AudioContext; master: GainNode; limiter: DynamicsCompressorNode } {
    if (ctx === null || master === null || limiter === null) {
      ctx = new AudioContext()
      // keeps many loud sounds at once from distorting
      limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -8
      limiter.knee.value = 8
      limiter.ratio.value = 12
      limiter.attack.value = 0.003
      limiter.release.value = 0.25
      limiter.connect(ctx.destination)
      master = ctx.createGain()
      master.gain.value = masterVolume
      master.connect(limiter)
    }
    window.clearTimeout(suspendTimer)
    if (ctx.state === 'suspended') void ctx.resume()
    return { ctx, master, limiter }
  }

  function wanted(id: SoundId): boolean {
    return playing && (volumes.get(id) ?? 0) > 0
  }

  function createTrack(id: SoundId): Track {
    const { ctx: c, master: m } = ensure()
    const out = c.createGain()
    out.gain.value = 0
    out.connect(m)
    const makeVoice = (index: 0 | 1): Voice => {
      const el = new Audio(`${import.meta.env.BASE_URL}sounds/${SOUNDS[id].file}`)
      el.preload = 'auto'
      const gain = c.createGain()
      gain.gain.value = 0
      c.createMediaElementSource(el).connect(gain)
      gain.connect(out)
      el.addEventListener('ended', () => onEnded(id, index))
      return { el, gain }
    }
    const track: Track = {
      voices: [makeVoice(0), makeVoice(1)],
      active: 0,
      out,
      fading: false,
      stopTimer: undefined,
    }
    tracks.set(id, track)
    return track
  }

  function play(el: HTMLAudioElement): void {
    // rejected if the browser is still blocking audio; the next click retries
    void el.play().catch(() => {})
  }

  /** start the idle voice from the top and fade it in over the active one */
  function crossover(track: Track, fade: number): void {
    if (ctx === null) return
    const from = track.voices[track.active]
    const next: 0 | 1 = track.active === 0 ? 1 : 0
    const to = track.voices[next]
    const now = ctx.currentTime
    track.fading = true
    track.active = next
    to.el.currentTime = 0
    play(to.el)
    for (const v of [from, to]) v.gain.gain.cancelScheduledValues(now)
    to.gain.gain.setValueCurveAtTime(FADE_IN, now, fade)
    from.gain.gain.setValueCurveAtTime(FADE_OUT, now, fade)
    window.setTimeout(() => {
      track.fading = false
      from.el.pause()
    }, fade * 1000 + 300)
  }

  /** a voice reached the end without a crossfade (timers were held back) */
  function onEnded(id: SoundId, index: 0 | 1): void {
    const track = tracks.get(id)
    if (track && track.active === index && wanted(id)) crossover(track, 0.05)
  }

  function watch(): void {
    for (const [id, track] of tracks) {
      if (!wanted(id) || track.fading) continue
      const el = track.voices[track.active].el
      if (!Number.isFinite(el.duration) || el.duration <= 0) continue
      const fade = Math.min(2.5, el.duration / 4)
      if (el.duration - el.currentTime <= fade + 0.5) crossover(track, fade)
    }
  }

  function sync(id: SoundId): void {
    const existing = tracks.get(id)
    if (!wanted(id)) {
      if (!existing || ctx === null) return
      existing.out.gain.setTargetAtTime(0, ctx.currentTime, 0.05)
      window.clearTimeout(existing.stopTimer)
      existing.stopTimer = window.setTimeout(() => {
        if (!wanted(id)) for (const v of existing.voices) v.el.pause()
      }, 300)
      return
    }
    const track = existing ?? createTrack(id)
    const c = ensure().ctx
    window.clearTimeout(track.stopTimer)
    const voice = track.voices[track.active]
    if (voice.el.paused) {
      const other = track.voices[track.active === 0 ? 1 : 0]
      other.el.pause()
      other.gain.gain.cancelScheduledValues(c.currentTime)
      other.gain.gain.setValueAtTime(0, c.currentTime)
      voice.gain.gain.cancelScheduledValues(c.currentTime)
      voice.gain.gain.setValueAtTime(1, c.currentTime)
      track.fading = false
      play(voice.el)
    }
    const level = (volumes.get(id) ?? 0) * SOUNDS[id].gain
    track.out.gain.setTargetAtTime(level, c.currentTime, 0.08)
  }

  function syncAll(): void {
    for (const id of volumes.keys()) sync(id)
    const anyWanted = [...volumes.keys()].some(wanted)
    if (anyWanted && watcher === undefined) {
      watcher = window.setInterval(watch, 400)
    } else if (!anyWanted && watcher !== undefined) {
      window.clearInterval(watcher)
      watcher = undefined
    }
    // let the audio system rest when nothing is playing
    window.clearTimeout(suspendTimer)
    if (!anyWanted && ctx !== null) {
      const c = ctx
      suspendTimer = window.setTimeout(() => {
        if (![...volumes.keys()].some(wanted)) void c.suspend()
      }, 4000)
    }
  }

  return {
    unlock() {
      ensure()
    },

    setVolume(id, volume) {
      volumes.set(id, volume)
      syncAll()
    },

    setPlaying(next) {
      playing = next
      syncAll()
    },

    setMaster(volume) {
      masterVolume = volume
      if (ctx !== null && master !== null) {
        master.gain.setTargetAtTime(volume, ctx.currentTime, 0.05)
      }
    },

    /** three rising notes; skips the master volume so it is always heard */
    playChime() {
      const { ctx: c, limiter: out } = ensure()
      const ring = () => {
        const notes = [880, 1108.73, 1318.51]
        notes.forEach((freq, i) => {
          const t = c.currentTime + i * 0.18
          const o = c.createOscillator()
          o.type = 'sine'
          o.frequency.value = freq
          const g = c.createGain()
          g.gain.setValueAtTime(0.0001, t)
          g.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
          o.connect(g)
          g.connect(out)
          o.start(t)
          o.stop(t + 1.3)
        })
        // keep the audio system awake until the chime has rung out
        window.clearTimeout(suspendTimer)
        suspendTimer = window.setTimeout(() => {
          if (![...volumes.keys()].some(wanted)) void c.suspend()
        }, 4000)
      }
      if (c.state === 'running') {
        ring()
        return
      }
      // The browser may be holding audio back until the next click. Drop
      // the chime unless audio starts within a second, so it never rings late.
      let expired = false
      window.setTimeout(() => { expired = true }, 1000)
      void c.resume().then(() => { if (!expired) ring() })
    },
  }
}
