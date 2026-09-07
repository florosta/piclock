import { groupBySectionOrdered, HA_ENTITIES, iconFor, valueFor } from '../config/ha'
import type { EntityConfig } from '../config/ha'
import type { HAState } from '../hooks/useHA'
import Icon from '../ui/Icon'
import Sheet, { IconButton } from '../ui/Sheet'
import { s as sheet } from '../ui/styles'
import Scroller from '../ui/Scroller'
import Touchable from '../ui/Touchable'

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
        <Scroller style={{ ...sheet.body, minHeight: 0 }}>
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
        </Scroller>
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
        <Icon name={icon} style={{ fontSize: 'var(--t-lg)' }} />
        <span style={sheet.label}>{config.label}</span>
      </Touchable>
    )
  }

  // Every read-only tile shares one shape: icon, value, label. Weather reads as
  // words rather than a number, so it takes two columns and a smaller value.
  const wide = config.type === 'weather'
  const label =
    config.type === 'climate' && attrs.temperature !== undefined
      ? `${config.label} ${attrs.temperature}°`
      : config.label

  return (
    <div style={{ ...s.tile, ...(wide ? s.wideTile : {}) }}>
      <span style={s.tileIcon}><Icon name={icon} /></span>
      <span style={{ ...s.tileValue, ...(wide ? s.wordValue : {}) }}>
        {valueFor(config, state, attrs)}
      </span>
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
    // A tile is a raised fill on the sheet — no outline.
    background: 'var(--surface-raised)',
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
