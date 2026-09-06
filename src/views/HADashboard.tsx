import { groupBySectionOrdered, HA_ENTITIES } from '../config/ha'
import type { EntityConfig } from '../config/ha'
import type { HAState } from '../hooks/useHA'

const WEATHER_ICON: Record<string, string> = {
  'sunny': '☀', 'clear-night': '☾', 'partlycloudy': '⛅', 'cloudy': '☁',
  'rainy': '☂', 'pouring': '☂', 'snowy': '❄', 'snowy-rainy': '❄',
  'fog': '≈', 'windy': '〜', 'lightning': '⚡', 'lightning-rainy': '⚡',
  'hail': '●',
}

function formatValue(state: string, format?: EntityConfig['format']): string {
  const n = parseFloat(state)
  if (isNaN(n) || state === 'unknown' || state === 'unavailable') return '—'
  switch (format) {
    case 'temp':     return `${n.toFixed(1)}°`
    case 'humidity': return `${n.toFixed(0)}%`
    case 'rate_gbp': return `${(n * 100).toFixed(1)}p`
    case 'cost_gbp': return `£${n.toFixed(2)}`
    default:         return String(n)
  }
}

interface Props {
  states: HAState[]
  loading: boolean
  onToggle: (entity_id: string, state: string) => void
  onClose: () => void
  onRefresh: () => void
}

export default function HADashboard({ states, loading, onToggle, onClose, onRefresh }: Props) {
  const byId = Object.fromEntries(states.map(s => [s.entity_id, s]))
  const sections = groupBySectionOrdered(HA_ENTITIES)

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <span style={s.title}>House</span>
          <div style={s.headerActions}>
            <button style={s.iconBtn} onClick={onRefresh}>↺</button>
            <button style={s.iconBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={s.status}>Loading…</div>
        ) : (
          <div style={s.body}>
            {sections.map(([section, entities]) => (
              <div key={section} style={s.section}>
                <div style={s.sectionLabel}>{section}</div>
                <div style={s.row}>
                  {entities.map(entity => (
                    <EntityTile
                      key={entity.id}
                      config={entity}
                      haState={byId[entity.id] ?? null}
                      onToggle={onToggle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}

function EntityTile({ config, haState, onToggle }: {
  config: EntityConfig
  haState: HAState | null
  onToggle: (id: string, state: string) => void
}) {
  const state = haState?.state ?? 'unavailable'
  const attrs = haState?.attributes ?? {}

  switch (config.type) {
    case 'toggle': {
      const on = state === 'on'
      return (
        <button
          style={{ ...s.tile, ...s.toggleTile, ...(on ? s.tileOn : {}) }}
          onClick={() => onToggle(config.id, state)}
        >
          <span style={s.tileIcon}>💡</span>
          <span style={s.tileLabel}>{config.label}</span>
        </button>
      )
    }

    case 'sensor':
      return (
        <div style={{ ...s.tile, ...s.dataTile }}>
          <span style={s.tileValue}>{formatValue(state, config.format)}</span>
          <span style={s.tileLabel}>{config.label}</span>
        </div>
      )

    case 'weather': {
      const icon = WEATHER_ICON[state] ?? '?'
      return (
        <div style={{ ...s.tile, ...s.dataTile, flex: 2 }}>
          <span style={s.tileIcon}>{icon}</span>
          <span style={s.tileLabel}>{state}</span>
        </div>
      )
    }

    case 'climate': {
      const current = attrs.current_temperature as number | undefined
      const target = attrs.temperature as number | undefined
      const action = attrs.hvac_action as string | undefined
      return (
        <div style={{ ...s.tile, ...s.dataTile }}>
          <span style={s.tileValue}>{current !== undefined ? `${current}°` : '—'}</span>
          <span style={s.tileLabel}>{target !== undefined ? `→ ${target}°` : action ?? config.label}</span>
        </div>
      )
    }
  }
}

const TILE = '18vw'

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-end', zIndex: 10,
  },
  sheet: {
    width: '100%', background: 'var(--surface)',
    borderTop: '1px solid var(--border)', maxHeight: '80vh',
    display: 'flex', flexDirection: 'column',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '3vw 4vw', borderBottom: '1px solid var(--border)', flexShrink: 0,
  },
  title: { fontSize: '3vw', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.6 },
  headerActions: { display: 'flex', gap: '2vw', alignItems: 'center' },
  iconBtn: {
    background: 'none', border: 'none', color: 'var(--amber)',
    fontSize: '3vw', cursor: 'pointer', opacity: 0.5,
  },
  status: { textAlign: 'center', opacity: 0.4, padding: '8vw', fontSize: '3vw' },
  body: { overflowY: 'auto', flex: 1, padding: '3vw 4vw', display: 'flex', flexDirection: 'column', gap: '4vw' },
  section: { display: 'flex', flexDirection: 'column', gap: '2vw' },
  sectionLabel: { fontSize: '2vw', opacity: 0.35, letterSpacing: '0.2em', textTransform: 'uppercase' },
  row: { display: 'flex', gap: '2vw', flexWrap: 'wrap' },
  tile: {
    height: TILE, minWidth: TILE,
    borderRadius: '1.5vw',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '0.8vw',
    padding: '0 2vw',
  },
  toggleTile: {
    border: '1px solid var(--border)', background: 'none',
    color: 'var(--amber)', cursor: 'pointer', opacity: 0.5,
  },
  tileOn: {
    background: 'var(--amber-faint)', border: '1px solid var(--amber-dim)', opacity: 1,
  },
  dataTile: {
    border: '1px solid var(--border)', background: 'none', color: 'var(--amber)',
  },
  tileIcon: { fontSize: '5vw', lineHeight: 1 },
  tileValue: { fontSize: '4vw', fontWeight: 200, lineHeight: 1 },
  tileLabel: { fontSize: '1.8vw', opacity: 0.45, letterSpacing: '0.05em' },
}
