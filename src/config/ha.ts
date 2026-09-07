import type { IconName } from '../ui/Icon'

export type EntityType = 'toggle' | 'sensor' | 'climate' | 'weather'
export type SensorFormat = 'temp' | 'humidity' | 'rate_gbp' | 'cost_gbp' | 'plain'

export interface EntityConfig {
  id: string
  label: string
  section: string
  type: EntityType
  unit?: string
  format?: SensorFormat
  /** Optional override; otherwise the icon is derived from type + format. */
  icon?: IconName
  /** Show this entity in the meta line above the clock. */
  clock?: true
}

export const HA_ENTITIES: EntityConfig[] = [
  // Bedroom
  { id: 'light.bedroom_left_bedside_light',  label: 'Left',      section: 'Bedroom', type: 'toggle' },
  { id: 'light.bedroom_right_bedside_light', label: 'Right',     section: 'Bedroom', type: 'toggle' },
  { id: 'switch.bedroom_daylight',           label: 'SAD',       section: 'Bedroom', type: 'toggle' },
  { id: 'sensor.bedroom_bedroom_temperature',label: 'Temp',      section: 'Bedroom', type: 'sensor', format: 'temp' },
  { id: 'sensor.bedroom_bedroom_humidity',   label: 'Humidity',  section: 'Bedroom', type: 'sensor', format: 'humidity' },
  { id: 'climate.bedroom',                   label: 'Tado',      section: 'Bedroom', type: 'climate' },
  // Outside
  { id: 'weather.forecast_home',             label: 'Weather',   section: 'Outside', type: 'weather', clock: true },
  { id: 'sensor.home_outdoor_temperature',   label: 'Outside',   section: 'Outside', type: 'sensor', format: 'temp', clock: true },
  // Energy
  { id: 'sensor.octopus_energy_electricity_23e5131289_1200021397432_current_rate',                    label: 'Rate',      section: 'Energy', type: 'sensor', format: 'rate_gbp' },
  { id: 'sensor.octopus_energy_electricity_23e5131289_1200021397432_previous_accumulative_cost',      label: 'Yesterday', section: 'Energy', type: 'sensor', format: 'cost_gbp' },
]

export const HA_ENTITY_IDS = HA_ENTITIES.map(e => e.id)

/** Entities shown in the meta line above the clock, in config order. */
export const CLOCK_ENTITIES = HA_ENTITIES.filter(e => e.clock)

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

/** Derived from the entity's own type and format, so config/ha.ts stays one
 *  line per entity. Set `icon` on the entity to override. */
export function iconFor(config: EntityConfig, state: string): IconName {
  if (config.icon) return config.icon
  switch (config.type) {
    case 'toggle':  return 'bulb'
    case 'climate': return 'radiator'
    case 'weather': return WEATHER_ICON[state] ?? 'unknown'
    case 'sensor':  return SENSOR_ICON[config.format ?? ''] ?? 'unknown'
  }
}

/** The value a tile or the clock meta line shows for an entity. */
export function valueFor(config: EntityConfig, state: string, attrs: Record<string, unknown>): string {
  if (config.type === 'weather') return WEATHER_LABEL[state] ?? state.replace(/-/g, ' ')
  if (config.type === 'climate') {
    const current = attrs.current_temperature
    return current === undefined ? '—' : `${current}°`
  }
  const n = parseFloat(state)
  if (isNaN(n) || state === 'unknown' || state === 'unavailable') return '—'
  switch (config.format) {
    case 'temp':     return `${n.toFixed(1)}°`
    case 'humidity': return `${n.toFixed(0)}%`
    case 'rate_gbp': return `${(n * 100).toFixed(1)}p`
    case 'cost_gbp': return `£${n.toFixed(2)}`
    default:         return String(n)
  }
}

// Group by section, preserving order
export function groupBySectionOrdered(entities: EntityConfig[]): [string, EntityConfig[]][] {
  const map = new Map<string, EntityConfig[]>()
  for (const e of entities) {
    if (!map.has(e.section)) map.set(e.section, [])
    map.get(e.section)!.push(e)
  }
  return [...map.entries()]
}
