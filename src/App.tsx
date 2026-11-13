import { useEffect, useRef, useState } from 'react'
import './App.css'
import { createSoundEngine } from './audio/engine.ts'
import type { SoundEngine } from './audio/engine.ts'
import { ClockPanel } from './components/ClockPanel.tsx'
import { MoonIcon, SoundIcon, SunIcon } from './components/Icons.tsx'
import { LogCard } from './components/LogCard.tsx'
import { SoundsBar } from './components/SoundsBar.tsx'
import { StatsScreen } from './components/StatsScreen.tsx'
import { SubjectPicker } from './components/SubjectPicker.tsx'
import { elapsedMs, isFinished, pause, resume, startStopwatch, startTimer } from './lib/clock.ts'
import { getBrowserStorage } from './lib/storage.ts'
import { SOUND_IDS } from './lib/types.ts'
import type { SoundId } from './lib/types.ts'
import { useNow } from './state/useNow.ts'
import { useStore } from './state/useStore.ts'
import { useToday } from './state/useToday.ts'

const kv = getBrowserStorage()

export default function App() {
  const store = useStore(kv)
  const { settings, clock, setClock, pushDraft } = store

  const [engine] = useState<SoundEngine>(() => createSoundEngine())
  const [screen, setScreen] = useState<'timer' | 'stats'>('timer')
  const [playing, setPlaying] = useState(false)
  const now = useNow(clock !== null && clock.startedAt !== null)
  const todayKey = useToday()
  const draft = store.drafts[0]
  // archived subjects still count in the stats but are not offered for new sessions
  const activeSubjects = store.subjects.filter((s) => !s.archived)

  // 'system' follows the device; the toggle then pins light or dark
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])
  const dark = settings.theme === 'system' ? systemDark : settings.theme === 'dark'
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  // keep the audio engine in step with the saved mix
  useEffect(() => {
    for (const id of SOUND_IDS) engine.setVolume(id, settings.mix[id])
  }, [engine, settings.mix])
  useEffect(() => { engine.setPlaying(playing) }, [engine, playing])
  useEffect(() => { engine.setMaster(settings.masterVolume) }, [engine, settings.masterVolume])

  // timer finished: chime once, clear the clock, queue the session for logging
  const chimedFor = useRef<string | null>(null)
  useEffect(() => {
    if (clock !== null && isFinished(clock, now)) {
      // the id is derived from the clock so a repeat (or another tab) cannot
      // queue or chime for the same session twice
      const id = `timer-${clock.startedAt}-${clock.accumulatedMs}`
      if (chimedFor.current !== id) {
        chimedFor.current = id
        engine.playChime()
      }
      pushDraft(Math.round(clock.durationMs / 1000), false, id)
      setClock(null)
    }
  }, [clock, now, engine, setClock, pushDraft])

  function changeVolume(id: SoundId, volume: number) {
    if (volume > 0) {
      engine.unlock()
      setPlaying(true)
    }
    store.updateSettings({ mix: { ...settings.mix, [id]: volume } })
  }

  function togglePlaying() {
    engine.unlock()
    setPlaying((p) => !p)
  }

  function stopClock() {
    if (clock === null) return
    const seconds = Math.floor(elapsedMs(clock, Date.now()) / 1000)
    setClock(null)
    if (seconds >= 1) pushDraft(seconds, false)
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="wordmark">felinprogress</span>
        <nav className="segmented" aria-label="Screens">
          <button aria-pressed={screen === 'timer'} onClick={() => setScreen('timer')}>
            Timer
          </button>
          <button aria-pressed={screen === 'stats'} onClick={() => setScreen('stats')}>
            Stats
          </button>
        </nav>
        <button
          className="icon-btn theme-toggle"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Light mode' : 'Dark mode'}
          onClick={() => store.updateSettings({ theme: dark ? 'light' : 'dark' })}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      {store.saveFailed && (
        <p className="banner" role="alert">
          Your latest changes could not be saved. The browser's storage is full or blocked,
          so they will be lost when you close this page.
        </p>
      )}

      <div className={`body${settings.sidebarOpen ? ` centered-${screen}` : ''}`}>
        {!settings.sidebarOpen && (
          <button
            className={`sounds-tab${playing ? ' playing' : ''}`}
            aria-label="Show sounds" title="Show sounds"
            onClick={() => store.updateSettings({ sidebarOpen: true })}
          >
            <SoundIcon />
          </button>
        )}
        {settings.sidebarOpen && (
          <SoundsBar
            mix={settings.mix}
            masterVolume={settings.masterVolume}
            playing={playing}
            onTogglePlaying={togglePlaying}
            onVolume={changeVolume}
            onMaster={(masterVolume) => store.updateSettings({ masterVolume })}
            onCollapse={() => store.updateSettings({ sidebarOpen: false })}
          />
        )}
        {/* both screens stay mounted so switching never resets what you were doing */}
        <main className="main">
          <div hidden={screen !== 'timer'}>
            <ClockPanel
              clock={clock}
              now={now}
              lastTimerSeconds={settings.lastTimerSeconds}
              onStartTimer={(seconds) => {
                engine.unlock()
                store.updateSettings({ lastTimerSeconds: seconds })
                setClock(startTimer(seconds * 1000, Date.now()))
              }}
              onStartStopwatch={() => {
                engine.unlock()
                setClock(startStopwatch(Date.now()))
              }}
              onPause={() => clock && setClock(pause(clock, Date.now()))}
              onResume={() => clock && setClock(resume(clock, Date.now()))}
              onStop={stopClock}
            >
              <SubjectPicker
                subjects={activeSubjects}
                selectedId={settings.currentSubjectId}
                onSelect={(currentSubjectId) => store.updateSettings({ currentSubjectId })}
                onAdd={store.addSubject}
              />
            </ClockPanel>
          </div>
          <div hidden={screen !== 'stats'}>
            <StatsScreen store={store} todayKey={todayKey} onAddManual={() => pushDraft(1800, true)} />
          </div>
        </main>
      </div>

      {draft && (
        <LogCard
          key={draft.id}
          draft={draft}
          queued={store.drafts.length - 1}
          subjects={activeSubjects}
          preferredSubjectId={draft.manual ? null : settings.currentSubjectId}
          todayKey={todayKey}
          onAddSubject={store.addSubject}
          onLog={store.addSession}
          onClose={() => store.closeDraft(draft.id)}
        />
      )}
    </div>
  )
}
