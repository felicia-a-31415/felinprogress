import { SOUND_GROUPS, SOUNDS } from '../audio/sounds.ts'
import { SOUND_IDS } from '../lib/types.ts'
import type { SoundId, SoundMix } from '../lib/types.ts'
import { ChevronLeft, PauseIcon, PlayIcon } from './Icons.tsx'
import { Slider } from './Slider.tsx'

type Props = {
  mix: SoundMix
  masterVolume: number
  playing: boolean
  onTogglePlaying(): void
  onVolume(id: SoundId, volume: number): void
  onMaster(volume: number): void
  onCollapse(): void
}

export function SoundsBar({ mix, masterVolume, playing, onTogglePlaying, onVolume, onMaster, onCollapse }: Props) {
  const active = SOUND_IDS.filter((id) => mix[id] > 0).length
  return (
    <aside className="sounds" aria-label="Sounds">
      <div className="sounds-head">
        <button className="icon-btn" onClick={onCollapse} aria-label="Hide sounds" title="Hide sounds">
          <ChevronLeft />
        </button>
        <div className="sounds-title">
          <h2>Sounds</h2>
          <span className="muted small">
            {active === 0 ? 'Raise a slider to start' : playing ? `${active} playing` : `${active} paused`}
          </span>
        </div>
        <button
          className="play-btn"
          onClick={onTogglePlaying}
          disabled={active === 0}
          aria-label={playing ? 'Pause sounds' : 'Play sounds'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <label className="sound-row on master-row">
        <span className="sound-name">Master volume</span>
        <Slider value={masterVolume} label="Master volume" onChange={onMaster} />
      </label>

      {SOUND_GROUPS.map((group) => (
        <section key={group.title} className="sound-group">
          <h3>{group.title}</h3>
          {group.ids.map((id) => (
            <label key={id} className={`sound-row${mix[id] > 0 ? ' on' : ''}`}>
              <span className="sound-name">{SOUNDS[id].label}</span>
              <Slider
                value={mix[id]}
                label={`${SOUNDS[id].label} volume`}
                onChange={(v) => onVolume(id, v)}
              />
            </label>
          ))}
        </section>
      ))}
    </aside>
  )
}
