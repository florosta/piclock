import { groupBySectionOrdered, HA_ENTITIES } from '../config/ha'
import type { EntityConfig } from '../config/ha'
import type { HAState } from '../hooks/useHA'
import Icon from '../ui/Icon'
import type { IconName } from '../ui/Icon'
import Sheet, { IconButton } from '../ui/Sheet'
import { s as sheet } from '../ui/styles'
import Touchable from '../ui/Touchable'

const WEATHER_ICON: Record<string, IconName> = {
  'sunny': 'sun', 'clear-night': 'moon', 'partlycloudy': 'cloudSun', 'cloudy': 'cloud',
  'rainy': 'rain', 'pouring': 'rain', 'snowy': 'snow', 'snowy-rainy': 'snow',
  'fog': 'fog', 'windy': 'wind', 'lightning': 'bolt', 'lightning-rainy': 'bolt',
  'hail': 'snow',
}

const WEATHER_LABEL: Record<string, string> = {
  'partlycloudy': 'Partly cloudy', 'clear-night': 'Clear', 'snowy-rainy': 'Sleet',
  'lightning-rainy': 'Thunder', 'pouring': 'Heavy rain', 'exceptional': 'Extreme',
}

const SENSOR_ICON: Record<string, IconName> = {
  temp: 'thermometer', humidity: 'droplet', rate_gbp: 'bolt', cost_gbp: 'coin',
}

/** Icons come from the entity's own type and format, so config/ha.ts stays
 *  a single line per entity. Set `icon` there to override. */
function iconFor(config: EntityConfig, state: string): IconName {
  if (config.icon) return config.icon
  switch (config.type) {
    case 'toggle':  return 'bulb'
    case 'climate': return 'flame'
    case 'weather': return WEATHER_ICON[state] ?? 'unknown'
    case 'sensor':  return SENSOR_ICON[config.format ?? ''] ?? 'unknown'
  }
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
    <Sheet
      title="House"
      onClose={onClose}
      actions={<IconButton name="refresh" label="Refresh" onClick={onRefresh} />}
    >
      {loading ? (
        <div style={sheet.status}>Loading…</div>
      ) : (
        <div className="scroll" style={{ ...sheet.body, minHeight: 0 }}>
          {sections.map(([section, entities]) => (
            <div key={section} style={s.section}>
              <div style={sheet.sectionLabel}>{section}</div>
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
    </Sheet>
  )
}

function EntityTile({ config, haState, onToggle }: {
  config: EntityConfig
  haState: HAState | null
  onToggle: (id: string, state: string) => void
}) {
  const state = haState?.state ?? 'unavailable'
  const attrs = haState?.attributes ?? {}
  const icon = iconFor(config, state)

  if (config.type === 'toggle') {
    return (
      <Touchable
        onClick={() => onToggle(config.id, state)}
        active={state === 'on'}
        style={{ ...s.tile, ...s.toggleTile }}
      >
        <Icon name={icon} style={{ fontSize: 'var(--t-lg)' }} size="1em" />
        <span style={sheet.label}>{config.label}</span>
      </Touchable>
    )
  }

  // Every read-only tile shares one shape: icon, value, label. Weather has no
  // number, so its condition takes the value slot.
  const value =
    config.type === 'weather' ? (WEATHER_LABEL[state] ?? state.replace(/-/g, ' '))
    : config.type === 'climate' ? (attrs.current_temperature !== undefined ? `${attrs.current_temperature}°` : '—')
    : formatValue(state, config.format)

  const label =
    config.type === 'climate' && attrs.temperature !== undefined
      ? `${config.label} ${attrs.temperature}°`
      : config.label

  return (
    <div style={{
      ...s.tile,
      // Weather reads as words rather than a number, so it gets two columns.
      ...(config.type === 'weather' ? s.wideTile : {}),
    }}>
      <span style={s.tileIcon}><Icon name={icon} /></span>
      <span style={{ ...s.tileValue, ...(config.type === 'weather' ? s.wordValue : {}) }}>{value}</span>
      <span style={sheet.label}>{label}</span>
    </div>
  )
}

const TILE = '15vw'

const s: Record<string, React.CSSProperties> = {
  section: { display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' },
  row: {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, ${TILE})`,
    gap: 'var(--s-2)',
  },
  tile: {
    height: TILE, width: '100%', minWidth: 0,
    borderRadius: 'var(--r-md)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 'var(--s-1)',
    padding: '0 var(--s-2)',
    border: '1px solid var(--border)',
    background: 'none',
    color: 'var(--amber)',
  },
  toggleTile: { opacity: 'var(--o-secondary)' },
  wideTile: { gridColumn: 'span 2' },
  wordValue: { fontSize: 'var(--t-md)' },
  tileIcon: { fontSize: 'var(--t-md)', opacity: 'var(--o-tertiary)', display: 'flex' },
  tileValue: {
    fontSize: 'var(--t-lg)', fontWeight: 200, lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    textTransform: 'capitalize',
  },
}
