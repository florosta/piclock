import { configFor, iconFor, showInHousePanel, sortAreas, sortEntities, valueFor } from '../config/ha'
import type { DiscoveredEntity, EntityConfig } from '../config/ha'
import type { HouseState } from '../hooks/useHouse'
import Icon from '../ui/Icon'
import Scroller from '../ui/Scroller'
import Sheet from '../ui/Sheet'
import { s as sheet } from '../ui/styles'
import Touchable from '../ui/Touchable'

interface Props {
  house: HouseState
  onClose: () => void
}

export default function HADashboard({ house, onClose }: Props) {
  const { areas, loading, configured, toggle } = house

  // Everything below is derived from what HA reported — no entity, area or
  // ordering is written down in this repo.
  const sections = sortAreas(areas).map(({ area, entities }) => {
    const withConfig = entities
      .filter(entity => showInHousePanel(entity))
      .map(entity => ({ entity, config: configFor(entity) }))
      .filter(({ config }) => config.label)
    const order = sortEntities(withConfig.map(w => w.config))
    return {
      area,
      items: order
        .map(config => withConfig.find(w => w.config.id === config.id)!)
        .filter(Boolean),
    }
  }).filter(section => section.items.length > 0)

  return (
    <Sheet title="House" onClose={onClose}>
      {loading ? (
        <div style={sheet.status}>Loading…</div>
      ) : !configured ? (
        <div style={sheet.status}>Home Assistant is not configured</div>
      ) : sections.length === 0 ? (
        <div style={sheet.status}>Nothing to show</div>
      ) : (
        <Scroller style={{ ...sheet.body, minHeight: 0 }}>
          {sections.map(({ area, items }) => (
            <div key={area} style={s.section}>
              <div style={sheet.sectionLabel}>{area}</div>
              <div style={s.row}>
                {items.map(({ entity, config }) => (
                  <EntityTile
                    key={entity.entity_id}
                    entity={entity}
                    config={config}
                    onToggle={toggle}
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

function EntityTile({ entity, config, onToggle }: {
  entity: DiscoveredEntity
  config: EntityConfig
  onToggle: (entity: DiscoveredEntity) => void
}) {
  const icon = iconFor(config, entity.state)
  const on = entity.state === 'on' || entity.state === 'open' || entity.state === 'unlocked'

  if (config.type === 'toggle') {
    return (
      <Touchable
        onClick={() => onToggle(entity)}
        active={on}
        style={{ ...s.tile, ...s.toggleTile }}
      >
        <Icon name={icon} style={{ fontSize: 'var(--t-lg)' }} />
        <span style={s.tileLabel}>{config.label}</span>
      </Touchable>
    )
  }

  // Every read-only tile shares one shape: icon, value, label. Weather reads as
  // words rather than a number, so it takes two columns and a smaller value.
  const wide = config.type === 'weather'
  const label =
    config.type === 'climate' && entity.attributes.temperature !== undefined
      ? `${config.label} ${entity.attributes.temperature}°`
      : config.label

  return (
    <div style={{ ...s.tile, ...(wide ? s.wideTile : {}) }}>
      <span style={s.tileIcon}><Icon name={icon} /></span>
      <span style={{ ...s.tileValue, ...(wide ? s.wordValue : {}) }}>
        {valueFor(config, entity.state, entity.attributes, entity.device_class)}
      </span>
      <span style={s.tileLabel}>{label}</span>
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
  // HA names entities for the whole house, so labels here run longer than a
  // hand-written list's ever did — two lines rather than an ellipsis.
  tileLabel: {
    fontSize: 'var(--t-xs)',
    opacity: 'var(--o-tertiary)',
    letterSpacing: 'var(--track-label)',
    textAlign: 'center', lineHeight: 1.15,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
    overflow: 'hidden', maxWidth: '100%',
  },
  wideTile: { gridColumn: 'span 2' },
  wordValue: { fontSize: 'var(--t-md)' },
  tileIcon: { fontSize: 'var(--t-md)', opacity: 'var(--o-tertiary)', display: 'flex' },
  tileValue: {
    fontSize: 'var(--t-lg)', fontWeight: 200, lineHeight: 1,
    fontVariantNumeric: 'tabular-nums',
    textTransform: 'capitalize',
  },
}
