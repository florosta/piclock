import type { HAState } from '../hooks/useHA'

const WEATHER_ICON: Record<string, string> = {
  'sunny': '☀', 'clear-night': '☾', 'partlycloudy': '⛅', 'cloudy': '☁',
  'rainy': '☂', 'pouring': '☂', 'snowy': '❄', 'snowy-rainy': '❄',
  'fog': '≈', 'windy': '〜', 'lightning': '⚡', 'lightning-rainy': '⚡',
  'hail': '●', 'exceptional': '!',
}

interface Props {
  states: HAState[]
  loading: boolean
  onToggle: (entity_id: string, state: string) => void
  onClose: () => void
  onRefresh: () => void
}

export default function HADashboard({ states, loading, onToggle, onClose, onRefresh }: Props) {
  function get(id: string) { return states.find(s => s.entity_id === id) }
  function val(id: string) { return get(id)?.state ?? '—' }
  function attr(id: string, key: string) { return get(id)?.attributes[key] }

  const bedroomTemp = val('sensor.bedroom_bedroom_temperature')
  const bedroomHumidity = val('sensor.bedroom_bedroom_humidity')
  const outdoorTemp = val('sensor.home_outdoor_temperature')
  const weatherCondition = val('sensor.home_weather_condition')
  const weatherIcon = WEATHER_ICON[weatherCondition] ?? '?'
  const currentRate = val('sensor.octopus_energy_electricity_23e5131289_1200021397432_current_rate')
  const yesterdayCost = val('sensor.octopus_energy_electricity_23e5131289_1200021397432_previous_accumulative_cost')
  const climateTarget = attr('climate.bedroom', 'temperature') as number | undefined
  const climateAction = attr('climate.bedroom', 'hvac_action') as string | undefined

  const lights = [
    { id: 'light.bedroom_left_bedside_light', label: 'Left' },
    { id: 'light.bedroom_right_bedside_light', label: 'Right' },
    { id: 'switch.bedroom_daylight', label: 'SAD' },
  ]

  function fmt(val: string, unit: string) {
    return val === 'unknown' || val === 'unavailable' || val === '—' ? '—' : `${parseFloat(val).toFixed(1)}${unit}`
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.sheet} onClick={e => e.stopPropagation()}>

        <div style={s.header}>
          <span style={s.title}>House</span>
          <div style={s.headerActions}>
            <button style={s.iconBtn} onClick={onRefresh} title="Refresh">↺</button>
            <button style={s.iconBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={s.status}>Loading…</div>
        ) : (
          <div style={s.body}>

            {/* Bedroom */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Bedroom</div>
              <div style={s.row}>
                {lights.map(({ id, label }) => {
                  const on = get(id)?.state === 'on'
                  return (
                    <button
                      key={id}
                      style={{ ...s.tile, ...s.toggleTile, ...(on ? s.tileOn : {}) }}
                      onClick={() => onToggle(id, get(id)?.state ?? 'off')}
                    >
                      <span style={s.tileIcon}>💡</span>
                      <span style={s.tileLabel}>{label}</span>
                    </button>
                  )
                })}
                <div style={{ ...s.tile, ...s.dataTile }}>
                  <span style={s.tileValue}>{fmt(bedroomTemp, '°')}</span>
                  <span style={s.tileLabel}>{fmt(bedroomHumidity, '%')}</span>
                </div>
                {climateTarget !== undefined && (
                  <div style={{ ...s.tile, ...s.dataTile }}>
                    <span style={s.tileValue}>{climateTarget}°</span>
                    <span style={s.tileLabel}>{climateAction ?? 'tado'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Outside */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Outside</div>
              <div style={s.row}>
                <div style={{ ...s.tile, ...s.dataTile, flex: 2 }}>
                  <span style={s.tileIcon}>{weatherIcon}</span>
                  <span style={s.tileLabel}>{weatherCondition}</span>
                </div>
                <div style={{ ...s.tile, ...s.dataTile }}>
                  <span style={s.tileValue}>{fmt(outdoorTemp, '°')}</span>
                  <span style={s.tileLabel}>outside</span>
                </div>
              </div>
            </div>

            {/* Energy */}
            <div style={s.section}>
              <div style={s.sectionLabel}>Energy</div>
              <div style={s.row}>
                <div style={{ ...s.tile, ...s.dataTile }}>
                  <span style={s.tileValue}>
                    {currentRate !== '—' && currentRate !== 'unknown' ? `${(parseFloat(currentRate) * 100).toFixed(1)}p` : '—'}
                  </span>
                  <span style={s.tileLabel}>now /kWh</span>
                </div>
                <div style={{ ...s.tile, ...s.dataTile }}>
                  <span style={s.tileValue}>
                    {yesterdayCost !== '—' && yesterdayCost !== 'unknown' ? `£${parseFloat(yesterdayCost).toFixed(2)}` : '—'}
                  </span>
                  <span style={s.tileLabel}>yesterday</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  )
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
    border: '1px solid var(--border)', background: 'none',
    color: 'var(--amber)',
  },
  tileIcon: { fontSize: '5vw', lineHeight: 1 },
  tileValue: { fontSize: '4vw', fontWeight: 200, lineHeight: 1 },
  tileLabel: { fontSize: '1.8vw', opacity: 0.45, letterSpacing: '0.05em' },
}
