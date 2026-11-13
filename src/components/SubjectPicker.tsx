import { useEffect, useId, useRef, useState } from 'react'
import { nextColor } from '../lib/palette.ts'
import type { Subject } from '../lib/types.ts'
import { PlusIcon } from './Icons.tsx'

const NONE = '__none__'
const NEW = '__new__'

type Item = { id: string; label: string; color?: string; kind: 'none' | 'subject' | 'new' }

type Props = {
  subjects: Subject[]
  selectedId: string | null
  onSelect(id: string | null): void
  onAdd(name: string, color: string): Subject
}

/**
 * Choose what you are studying; the choice is offered first when logging.
 * This is a hand-built dropdown (not the browser's) so each subject can show
 * its colour. Keyboard: Up/Down to move, Enter or Space to choose, Escape to close.
 */
export function SubjectPicker({ subjects, selectedId, onSelect, onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(() => nextColor(subjects.length))
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const selected = subjects.find((s) => s.id === selectedId)
  const items: Item[] = [
    { id: NONE, label: 'No subject', kind: 'none' },
    ...subjects.map((s): Item => ({ id: s.id, label: s.name, color: s.color, kind: 'subject' })),
    { id: NEW, label: 'New subject…', kind: 'new' },
  ]
  const currentId = adding ? NEW : (selected?.id ?? NONE)

  // close when clicking anywhere else
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // keep the highlighted option in view when moving with the keyboard
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, listId])

  function show() {
    const rect = trigger.current?.getBoundingClientRect()
    // open upwards when there is not enough room underneath
    setOpenUp(rect !== undefined && window.innerHeight - rect.bottom < 280 && rect.top > 280)
    setActiveIndex(Math.max(0, items.findIndex((i) => i.id === currentId)))
    setOpen(true)
  }

  function choose(item: Item) {
    setOpen(false)
    setAdding(item.kind === 'new')
    if (item.kind === 'none') onSelect(null)
    if (item.kind === 'subject') onSelect(item.id)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        show()
      }
      return
    }
    const last = items.length - 1
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(last, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIndex(0) }
    else if (e.key === 'End') { e.preventDefault(); setActiveIndex(last) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(items[activeIndex]) }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false) }
    else if (e.key === 'Tab') setOpen(false)
  }

  function add() {
    const trimmed = name.trim()
    if (trimmed === '') return
    onSelect(onAdd(trimmed, color).id)
    setName('')
    setColor(nextColor(subjects.length + 1))
    setAdding(false)
  }

  return (
    <div className="subject-picker">
      <span className="eyebrow" id={`${listId}-label`}>Studying</span>
      <div className="dropdown" ref={root}>
        <button
          ref={trigger} className="dropdown-trigger"
          role="combobox" aria-haspopup="listbox" aria-expanded={open}
          aria-controls={listId} aria-labelledby={`${listId}-label`}
          aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
          onClick={() => (open ? setOpen(false) : show())}
          onKeyDown={onKeyDown}
        >
          {adding ? (
            <><PlusIcon /><span className="dropdown-text">New subject…</span></>
          ) : selected ? (
            <><span className="dot" style={{ background: selected.color }} /><span className="dropdown-text">{selected.name}</span></>
          ) : (
            <><span className="dot hollow" /><span className="dropdown-text muted">No subject</span></>
          )}
          <svg className="caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.5 4.5L6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <ul
            className={`dropdown-list${openUp ? ' up' : ''}`}
            role="listbox" id={listId} aria-labelledby={`${listId}-label`}
          >
            {items.map((item, index) => (
              <li
                key={item.id} id={`${listId}-${index}`}
                role="option" aria-selected={item.id === currentId}
                className={`${index === activeIndex ? 'active' : ''}${item.kind === 'new' ? ' divider' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(item)}
              >
                {item.kind === 'subject' && <span className="dot" style={{ background: item.color }} />}
                {item.kind === 'none' && <span className="dot hollow" />}
                {item.kind === 'new' && <PlusIcon />}
                <span className="dropdown-text">{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {adding && (
        <div className="inline">
          <input
            type="color" aria-label="New subject colour"
            value={color} onChange={(e) => setColor(e.target.value)}
          />
          <input
            type="text" placeholder="Subject name" aria-label="New subject name"
            value={name} maxLength={40} autoFocus
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          />
          <button className="small" onClick={add} disabled={name.trim() === ''}>Add</button>
        </div>
      )}
    </div>
  )
}
