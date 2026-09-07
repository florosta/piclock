import { useRef } from 'react'
import Icon from './Icon'
import Touchable from './Touchable'
import { s } from './styles'

/**
 * The one bottom sheet. Episodes, alarms and the house panel were each
 * redefining their own overlay, header, title and close button with slightly
 * different padding and type sizes; they now all render through this, so they
 * open, sit and dismiss identically.
 *
 * Dismissal is deliberately dumb-finger-proof:
 *  - tapping the dimmed backdrop closes, but only if the finger went down and
 *    came up on the backdrop without travelling — so flicking a list and
 *    lifting off past its edge no longer throws the sheet away;
 *  - a downward swipe on the grab handle closes, which is where a hand
 *    reaches first.
 */

const TAP_SLOP = 12
const SWIPE_CLOSE = 60

interface Props {
  title: string
  onClose: () => void
  /** Extra icon buttons in the header, left of the close button. */
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function Sheet({ title, onClose, actions, children }: Props) {
  const down = useRef<{ x: number; y: number; onBackdrop: boolean } | null>(null)
  const swipe = useRef<number | null>(null)

  function backdropDown(e: React.PointerEvent) {
    down.current = { x: e.clientX, y: e.clientY, onBackdrop: e.target === e.currentTarget }
  }

  function backdropUp(e: React.PointerEvent) {
    const start = down.current
    down.current = null
    if (!start || !start.onBackdrop) return
    if (e.target !== e.currentTarget) return
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_SLOP) return
    onClose()
  }

  return (
    <div
      style={s.overlay}
      onPointerDown={backdropDown}
      onPointerUp={backdropUp}
    >
      <div style={s.sheet} onPointerDown={e => e.stopPropagation()}>

        <div
          style={s.grip}
          onPointerDown={e => { swipe.current = e.clientY }}
          onPointerMove={e => {
            if (swipe.current !== null && e.clientY - swipe.current > SWIPE_CLOSE) {
              swipe.current = null
              onClose()
            }
          }}
          onPointerUp={() => { swipe.current = null }}
        >
          <div style={s.gripBar} />
        </div>

        <div style={s.header}>
          <span style={s.title}>{title}</span>
          <div style={s.actions}>
            {actions}
            <IconButton name="close" label="Close" onClick={onClose} />
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

/** Bare icon button for sheet headers and rows — no chrome, just the mark. */
export function IconButton({ name, label, onClick, tone = 'secondary' }: {
  name: React.ComponentProps<typeof Icon>['name']
  label: string
  onClick: () => void
  tone?: 'secondary' | 'tertiary'
}) {
  return (
    <Touchable
      aria-label={label}
      onClick={onClick}
      style={{
        ...s.iconBtn,
        opacity: tone === 'secondary' ? 'var(--o-secondary)' : 'var(--o-tertiary)',
      }}
    >
      <Icon name={name} />
    </Touchable>
  )
}
