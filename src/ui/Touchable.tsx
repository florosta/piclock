import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Touch behaviour shared by everything pressable.
 *
 * The screen is a finger, not a mouse, so three things differ from a plain
 * <button>:
 *
 *  1. Feedback lands on pointerdown, not on release — the control dims and
 *     shrinks the instant it is touched, which is what makes a touchscreen
 *     feel direct rather than like a remote cursor.
 *  2. A press that travels turns into a scroll, not a tap. Dragging a finger
 *     across a list to scroll it must never fire the row it started on, so any
 *     movement past DRAG_SLOP cancels the activation.
 *  3. Optional press-and-hold repeat, for controls you want to run up (volume,
 *     seek, time steppers) without lifting your finger between steps.
 */

const DRAG_SLOP = 12      // px of travel before a press is treated as a scroll
const REPEAT_DELAY = 450  // ms held before repeat begins
const REPEAT_RATE = 110   // ms between repeats

interface Options {
  onActivate: () => void
  disabled?: boolean
  /** Repeat onActivate while held. */
  repeat?: boolean
}

function useTouchable({ onActivate, disabled, repeat }: Options) {
  const [pressed, setPressed] = useState(false)
  const origin = useRef<{ x: number; y: number } | null>(null)
  const cancelled = useRef(false)
  const repeated = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const activate = useRef(onActivate)
  // Synced in an effect rather than during render: the handlers below read it
  // only from pointer events and timers, which always run after commit.
  useEffect(() => { activate.current = onActivate })

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const end = useCallback(() => {
    clearTimers()
    setPressed(false)
    origin.current = null
  }, [clearTimers])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return
    origin.current = { x: e.clientX, y: e.clientY }
    cancelled.current = false
    repeated.current = false
    setPressed(true)

    if (repeat) {
      const tick = () => {
        if (cancelled.current) return
        repeated.current = true
        activate.current()
        timers.current.push(setTimeout(tick, REPEAT_RATE))
      }
      timers.current.push(setTimeout(tick, REPEAT_DELAY))
    }
  }, [disabled, repeat])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const start = origin.current
    if (!start || cancelled.current) return
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_SLOP) {
      cancelled.current = true
      end()
    }
  }, [end])

  const onPointerUp = useCallback(() => end(), [end])
  const onPointerCancel = useCallback(() => { cancelled.current = true; end() }, [end])

  // Activation still runs off click, so keyboard and assistive tech work when
  // the app is opened from a desktop browser on the LAN. The pointer handlers
  // above only decide whether that click is allowed to count.
  const onClick = useCallback(() => {
    if (disabled || cancelled.current) return
    if (repeated.current) { repeated.current = false; return }
    activate.current()
  }, [disabled])

  return {
    pressed,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClick },
  }
}

interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  /** Lit state — an active alarm, a playing track, a light that is on. */
  active?: boolean
  repeat?: boolean
  style?: React.CSSProperties
  activeStyle?: React.CSSProperties
  'aria-label'?: string
}

export default function Touchable({
  children, onClick, disabled, active, repeat, style, activeStyle, ...rest
}: ButtonProps) {
  const { pressed, handlers } = useTouchable({ onActivate: onClick, disabled, repeat })

  return (
    <button
      type="button"
      disabled={disabled}
      {...handlers}
      {...rest}
      style={{
        ...base,
        ...style,
        ...(active ? { ...on, ...activeStyle } : {}),
        ...(disabled ? off : {}),
        ...(pressed && !disabled ? press : {}),
      }}
    >
      {children}
    </button>
  )
}

const base: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--amber)',
  borderRadius: 'var(--r-md)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  opacity: 'var(--o-primary)',
  transition: 'transform var(--dur) ease-out, opacity var(--dur) ease-out, background var(--dur) ease-out',
  padding: 0,
}

const on: React.CSSProperties = {
  background: 'var(--amber-faint)',
  borderColor: 'var(--amber-dim)',
  opacity: 1,
}

const off: React.CSSProperties = {
  opacity: 'var(--o-disabled)',
}

/** The press state: shrink and brighten together, so the touch reads as contact. */
const press: React.CSSProperties = {
  transform: 'scale(0.94)',
  background: 'var(--amber-faint)',
  opacity: 1,
}
