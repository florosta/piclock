import { useCallback, useEffect, useRef } from 'react'
import type { SettingsState } from '../hooks/useSettings'
import Icon from '../ui/Icon'
import Scroller from '../ui/Scroller'
import Sheet from '../ui/Sheet'
import Touchable from '../ui/Touchable'

const MIN_BRIGHTNESS = Math.round(31 * 0.05)  // ≈ 2 (6% of 31)

const COLOUR_ROWS = [
  [
    { label: 'Amber',      hex: '#e8c97a' },
    { label: 'Red',        hex: '#e87272' },
    { label: 'Green',      hex: '#7ae8a0' },
    { label: 'Blue',       hex: '#7ab8e8' },
    { label: 'White',      hex: '#dde0e4' },
  ],
  [
    { label: 'Dark amber', hex: '#b08030' },
    { label: 'Dark red',   hex: '#b04848' },
    { label: 'Dark green', hex: '#48b078' },
    { label: 'Dark blue',  hex: '#4898c8' },
    { label: 'Slate',      hex: '#8090a0' },
  ],
]

interface Props {
  settings: SettingsState
  onClose: () => void
}

export default function SettingsSheet({ settings, onClose }: Props) {
  return (
    <Sheet title="Settings" onClose={onClose}>
      <Scroller style={s.body}>
        <BrightnessSlider brightness={settings.brightness} setBrightness={settings.setBrightness} />
        <ColourPicker accent={settings.accentColor} setAccent={settings.setAccentColor} />

        <Touchable style={s.powerRow} onClick={settings.shutdown} aria-label="Power off">
          <Icon name="power" />
          <span>Power off</span>
        </Touchable>
      </Scroller>
    </Sheet>
  )
}

function ColourPicker({ accent, setAccent }: { accent: string; setAccent: (hex: string) => void }) {
  return (
    <div style={s.colourBlock}>
      <span style={s.colourLabel}>Colour</span>
      {COLOUR_ROWS.map((row, i) => (
        <div key={i} style={s.swatches}>
          {row.map(({ label, hex }) => {
            const active = hex.toLowerCase() === accent.toLowerCase()
            return (
              <Touchable
                key={hex}
                style={{ ...s.swatchOuter, background: active ? 'var(--surface-track)' : 'transparent' }}
                onClick={() => setAccent(hex)}
                aria-label={label}
              >
                <div style={{ ...s.swatchInner, background: hex }} />
              </Touchable>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function BrightnessSlider({ brightness, setBrightness }: {
  brightness: number
  setBrightness: (v: number) => void
}) {
  const track = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const pct = Math.round((brightness / 31) * 100)
  const fillPct = ((brightness - MIN_BRIGHTNESS) / (31 - MIN_BRIGHTNESS)) * 100

  const setFromX = useCallback((clientX: number) => {
    const node = track.current
    if (!node) return
    const r = node.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width))
    setBrightness(Math.round(MIN_BRIGHTNESS + ratio * (31 - MIN_BRIGHTNESS)))
  }, [setBrightness])

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
    <div style={s.sliderBlock}>
      <div style={s.sliderHead}>
        <Icon name="sun" />
        <span style={s.sliderValue}>{pct}%</span>
      </div>
      <div
        ref={track}
        style={s.track}
        onPointerDown={e => { dragging.current = true; setFromX(e.clientX) }}
      >
        <div style={s.trackBase} />
        <div style={{ ...s.trackFill, width: `${Math.max(0, fillPct)}%` }} />
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  body: {
    flex: 1, minHeight: 0,
    display: 'flex', flexDirection: 'column', gap: 'var(--s-2)',
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

  powerRow: {
    display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
    padding: 'var(--s-2) var(--s-3)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-raised)',
    fontSize: 'var(--t-md)',
    opacity: 'var(--o-secondary)',
    width: '100%',
  },

  colourBlock: {
    padding: 'var(--s-2) var(--s-3)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface-raised)',
    display: 'flex', flexDirection: 'column', gap: 'var(--s-1)',
  },
  colourLabel: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
  },
  swatches: {
    display: 'flex', gap: 'var(--s-2)', alignItems: 'center',
  },
  swatchOuter: {
    width: '8vw', height: '8vw',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  swatchInner: {
    width: '5.5vw', height: '5.5vw',
    borderRadius: '50%',
    flexShrink: 0,
  },
}
