import type { SoundId } from '../lib/types.ts'

export type SoundInfo = {
  label: string
  /** file name inside public/sounds */
  file: string
  /** evens out how loud the recordings are relative to each other */
  gain: number
}

export const SOUNDS: Record<SoundId, SoundInfo> = {
  white: { label: 'White noise', file: 'white.wav', gain: 0.6 },
  pink: { label: 'Pink noise', file: 'pink.wav', gain: 0.45 },
  brown: { label: 'Brown noise', file: 'brown.wav', gain: 0.3 },
  rain: { label: 'Rain', file: 'rain.mp3', gain: 3 },
  heavyRain: { label: 'Heavy rain', file: 'heavy-rain.mp3', gain: 0.9 },
  window: { label: 'Rain on window', file: 'window.mp3', gain: 0.5 },
  thunder: { label: 'Thunder', file: 'thunder.mp3', gain: 1 },
  wind: { label: 'Wind', file: 'wind.mp3', gain: 1.3 },
  waves: { label: 'Ocean waves', file: 'waves.mp3', gain: 4 },
  river: { label: 'River', file: 'river.mp3', gain: 2.2 },
  fire: { label: 'Fireplace', file: 'fire.mp3', gain: 3 },
  birds: { label: 'Birds', file: 'birds.mp3', gain: 1.2 },
  crickets: { label: 'Crickets', file: 'crickets.mp3', gain: 12 },
  cafe: { label: 'Café', file: 'cafe.mp3', gain: 0.9 },
  library: { label: 'Library', file: 'library.mp3', gain: 3.5 },
  keyboard: { label: 'Keyboard', file: 'keyboard.mp3', gain: 1 },
  fan: { label: 'Fan', file: 'fan.mp3', gain: 8 },
}

export const SOUND_GROUPS: { title: string; ids: SoundId[] }[] = [
  { title: 'Noise', ids: ['white', 'pink', 'brown'] },
  { title: 'Rain', ids: ['rain', 'heavyRain', 'window', 'thunder'] },
  { title: 'Nature', ids: ['wind', 'waves', 'river', 'fire', 'birds', 'crickets'] },
  { title: 'Places', ids: ['cafe', 'library', 'keyboard', 'fan'] },
]
