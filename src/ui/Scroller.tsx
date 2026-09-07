import { useCallback, useEffect, useRef } from 'react'

/**
 * A scrollable region that works whether or not the browser gives us real
 * touch.
 *
 * On the Pi, labwc/Chromium can present the DSI panel as a *mouse* rather than
 * a touchscreen — which is why it felt like a cursor in the first place, and
 * why lists would not scroll: a mouse drag does not pan an overflow container,
 * only a touch drag does. Taps still worked, so the symptom looked like
 * "scrolling is broken" rather than "this is not a touchscreen".
 *
 * So: native panning stays in charge for touch pointers, and for a mouse-type
 * pointer we drag the container ourselves, with a little momentum so a flick
 * still coasts. Whichever way the Pi reports its panel, lists scroll.
 */

const FRICTION = 0.94      // per frame; ~0.5s of coast from a firm flick
const MIN_VELOCITY = 0.04  // px/ms below which the glide stops
const MAX_SAMPLE_MS = 90   // velocity is measured over the last moments only

interface Props {
  children: React.ReactNode
  style?: React.CSSProperties
}

export default function Scroller({ children, style }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; top: number; t: number; v: number } | null>(null)
  const glide = useRef<number | null>(null)

  const stopGlide = useCallback(() => {
    if (glide.current !== null) { cancelAnimationFrame(glide.current); glide.current = null }
  }, [])

  useEffect(() => stopGlide, [stopGlide])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    stopGlide()
    // Touch panning is the browser's job — intercepting it would fight the
    // native scroller and lose.
    if (e.pointerType === 'touch' || !el.current) return
    drag.current = { y: e.clientY, top: el.current.scrollTop, t: e.timeStamp, v: 0 }
  }, [stopGlide])

  useEffect(() => {
    // Bound to the window, not the element: a drag that leaves the list still
    // scrolls it, and releasing anywhere still ends the drag.
    function move(e: PointerEvent) {
      const d = drag.current
      const node = el.current
      if (!d || !node) return
      const dy = e.clientY - d.y
      node.scrollTop = d.top - dy
      const dt = e.timeStamp - d.t
      if (dt > 0 && dt < MAX_SAMPLE_MS) d.v = -(e.clientY - d.y) / dt
      d.y = e.clientY
      d.top = node.scrollTop
      d.t = e.timeStamp
    }

    function up() {
      const d = drag.current
      const node = el.current
      drag.current = null
      if (!d || !node || Math.abs(d.v) < MIN_VELOCITY) return
      let v = d.v
      const step = () => {
        v *= FRICTION
        node.scrollTop += v * 16
        if (Math.abs(v) > MIN_VELOCITY) glide.current = requestAnimationFrame(step)
        else glide.current = null
      }
      glide.current = requestAnimationFrame(step)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [])

  return (
    <div
      ref={el}
      className="scroll"
      onPointerDown={onPointerDown}
      style={style}
    >
      {children}
    </div>
  )
}
