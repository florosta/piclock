import { useCallback, useEffect, useRef } from 'react'
import type { VolumeState } from '../hooks/useVolume'
import Icon from '../ui/Icon'
import Sheet from '../ui/Sheet'

interface Props {
  volume: VolumeState
  onClose: () => void
}

export default function VolumeSheet({ volume, onClose }: Props) {
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const setFromX = useCallback((clientX: number) => {
    const node = track.current
    if (!node) return
    const r = node.getBoundingClientRect()
    volume.set(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)))
  }, [volume])

  useEffect(() => {
    function move(e: PointerEvent) { if (dragging.current) setFromX(e.clientX) }
    function up() { dragging.current = false }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
  }, [setFromX])

  return (
    <Sheet title="Volume" onClose={onClose}>
      <div style={s.body}>
        <div style={s.sliderBlock}>
          <div style={s.sliderHead}>
            <Icon name={volume.value === 0 ? 'volumeDown' : 'volumeUp'} />
            <span style={s.sliderValue}>{volume.value}%</span>
            {!volume.systemVolume && <span style={s.note}>app only</span>}
          </div>
          <div
            ref={track}
            style={s.track}
            onPointerDown={e => { dragging.current = true; setFromX(e.clientX) }}
          >
            <div style={s.trackBase} />
            <div style={{ ...s.trackFill, width: `${volume.value}%` }} />
          </div>
        </div>
      </div>
    </Sheet>
  )
}

const s: Record<string, React.CSSProperties> = {
  body: {
    padding: 'var(--s-2) var(--s-4) var(--s-4)',
  },
  sliderBlock: {
    padding: 'var(--s-2) var(--s-3) var(--s-1)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-raised)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
  },
  sliderHead: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    fontSize: 'var(--t-md)',
  },
  sliderValue: {
    fontSize: 'var(--t-lg)', fontWeight: 200, lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
  },
  note: {
    marginLeft: 'auto',
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
    textTransform: 'uppercase',
  },
  track: {
    height: '7vw',
    display: 'flex', alignItems: 'center',
    position: 'relative',
    touchAction: 'none',
  },
  trackBase: {
    position: 'absolute', inset: 'auto 0', top: '50%',
    transform: 'translateY(-50%)',
    height: '2.4vw',
    background: 'var(--surface-track)',
    borderRadius: '999px',
    pointerEvents: 'none',
  },
  trackFill: {
    position: 'absolute', left: 0, top: '50%',
    transform: 'translateY(-50%)',
    height: '2.4vw',
    background: 'var(--amber-dim)',
    borderRadius: '999px',
    pointerEvents: 'none',
  },
}
