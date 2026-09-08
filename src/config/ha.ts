import type { IconName } from '../ui/Icon'

export type EntityType = 'toggle' | 'sensor' | 'climate' | 'weather'
export type SensorFormat = 'temp' | 'humidity' | 'rate_gbp' | 'cost_gbp' | 'binary' | 'plain'

export interface EntityConfig {
  id: string
  label: string
  section: string
  type: EntityType
  unit?: string
  format?: SensorFormat
  /** Optional override; otherwise the icon is derived from type + format. */
  icon?: IconName
}

/**
 * The two readings shown above the clock. These stay explicit: the clock face
 * is not the place for whatever HA happens to return. Everything in the house
 * panel is discovered — see /api/ha/house and `configFor` below.
 */
export const CLOCK_ENTITIES: EntityConfig[] = [
  { id: 'weather.forecast_home',           label: 'Weather', section: 'Outside', type: 'weather' },
  { id: 'sensor.home_outdoor_temperature', label: 'Outside', section: 'Outside', type: 'sensor', format: 'temp' },
]

export const HA_ENTITY_IDS = CLOCK_ENTITIES.map(e => e.id)

// ---------------------------------------------------------------------------
// Discovery — the house panel asks HA what exists rather than reading a list
// ---------------------------------------------------------------------------

/** One entity as /api/ha/house reports it. */
export interface DiscoveredEntity {
  entity_id: string
  domain: string
  name: string
  area: string
  device_class: string
  unit: string
  state: string
  attributes: Record<string, unknown>
}

/**
 * Areas listed here come first, in this order; everything else follows
 * alphabetically. This is a bedside clock, so the bedroom leads.
 */
export const AREA_ORDER = ['Bedroom', 'Bathroom', 'Kitchen', 'Living Room', 'Outside']

/** Per-entity tweaks on top of what HA reports. Add a line to tidy something. */
export const OVERRIDES: Record<string, { label?: string; icon?: IconName; hide?: true }> = {
  // 'sensor.some_noisy_entity': { hide: true },
}

const TOGGLE_DOMAINS = new Set(['light', 'switch', 'fan', 'input_boolean', 'cover', 'lock'])

/** Returns true for entities that should appear in the house panel. */
export function showInHousePanel(e: DiscoveredEntity): boolean {
  if (e.domain === 'light') return true
  if (e.domain === 'switch') return e.device_class === 'outlet' || e.device_class === 'plug'
  return false
}

const FORMAT_BY_CLASS: Record<string, SensorFormat> = {
  temperature: 'temp',
  humidity: 'humidity',
  battery: 'humidity',
  monetary: 'cost_gbp',
}

const ICON_BY_CLASS: Record<string, IconName> = {
  temperature: 'thermometer',
  humidity: 'droplet',
  battery: 'bolt',
  power: 'bolt',
  energy: 'bolt',
  monetary: 'coin',
  illuminance: 'sun',
  door: 'door',
  window: 'door',
  opening: 'door',
  garage_door: 'door',
  motion: 'person',
  occupancy: 'person',
  presence: 'person',
  moisture: 'droplet',
}

/**
 * A discovered entity, described the way the rest of the app expects.
 * HA names an entity for the whole house ("Bedroom Left Bedside Light"); in a
 * panel already grouped by area that prefix is just noise, so it comes off.
 */
export function configFor(e: DiscoveredEntity): EntityConfig {
  const override = OVERRIDES[e.entity_id] ?? {}

  let label = override.label ?? e.name
  if (e.area && label.toLowerCase().startsWith(e.area.toLowerCase() + ' ')) {
    label = label.slice(e.area.length + 1)
  }
  // "Left Bedside Light" under a bulb icon says light twice. Only for lights —
  // "Bedroom Temperature" needs its noun.
  if (e.domain === 'light') label = label.replace(/\s+(light|lights|lamp)$/i, '')

  const type: EntityType =
    e.domain === 'climate' ? 'climate'
    : e.domain === 'weather' ? 'weather'
    : TOGGLE_DOMAINS.has(e.domain) ? 'toggle'
    : 'sensor'

  const format: SensorFormat =
    e.domain === 'binary_sensor' ? 'binary'
    : FORMAT_BY_CLASS[e.device_class] ?? 'plain'

  return {
    id: e.entity_id,
    label: label || e.entity_id,
    section: e.area || 'Unassigned',
    type,
    unit: e.unit,
    format,
    icon: override.icon ?? ICON_BY_CLASS[e.device_class],
  }
}

/** Sort areas by AREA_ORDER, then alphabetically; Unassigned always last. */
export function sortAreas<T extends { area: string }>(areas: T[]): T[] {
  const rank = (a: string) => {
    if (a === 'Unassigned') return AREA_ORDER.length + 1
    const i = AREA_ORDER.indexOf(a)
    return i === -1 ? AREA_ORDER.length : i
  }
  return [...areas].sort((a, b) => rank(a.area) - rank(b.area) || a.area.localeCompare(b.area))
}

/** Things you can act on first, then readings. */
export function sortEntities(entities: EntityConfig[]): EntityConfig[] {
  const rank = (t: EntityType) => (t === 'toggle' ? 0 : t === 'climate' ? 1 : t === 'weather' ? 2 : 3)
  return [...entities].sort((a, b) => rank(a.type) - rank(b.type) || a.label.localeCompare(b.label))
}

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

/** Binary sensors read better as a word than as on/off. */
const BINARY_WORDS: Record<string, [string, string]> = {
  door: ['Open', 'Shut'], window: ['Open', 'Shut'], garage_door: ['Open', 'Shut'],
  motion: ['Motion', 'Still'], occupancy: ['In', 'Out'], presence: ['Home', 'Away'],
  moisture: ['Wet', 'Dry'], problem: ['Problem', 'OK'], smoke: ['Smoke', 'Clear'],
  opening: ['Open', 'Shut'], battery: ['Low', 'OK'],
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
export function valueFor(
  config: EntityConfig,
  state: string,
  attrs: Record<string, unknown>,
  deviceClass = '',
): string {
  if (config.type === 'weather') return WEATHER_LABEL[state] ?? state.replace(/-/g, ' ')
  if (config.format === 'binary') {
    const [on, off] = BINARY_WORDS[deviceClass] ?? ['On', 'Off']
    return state === 'on' ? on : off
  }
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
    // Anything else keeps HA's own unit, rounded to something readable at a
    // glance rather than to the sensor's full precision.
    default:         return `${n >= 100 ? Math.round(n) : Number(n.toFixed(1))}${config.unit ? ` ${config.unit}` : ''}`
  }
}

