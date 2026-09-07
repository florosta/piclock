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
  { id: 'weather.forecast_home',             label: 'Weather',   section: 'Outside', type: 'weather' },
  { id: 'sensor.home_outdoor_temperature',   label: 'Outside',   section: 'Outside', type: 'sensor', format: 'temp' },
  // Energy
  { id: 'sensor.octopus_energy_electricity_23e5131289_1200021397432_current_rate',                    label: 'Rate',      section: 'Energy', type: 'sensor', format: 'rate_gbp' },
  { id: 'sensor.octopus_energy_electricity_23e5131289_1200021397432_previous_accumulative_cost',      label: 'Yesterday', section: 'Energy', type: 'sensor', format: 'cost_gbp' },
]

export const HA_ENTITY_IDS = HA_ENTITIES.map(e => e.id)

// Group by section, preserving order
export function groupBySectionOrdered(entities: EntityConfig[]): [string, EntityConfig[]][] {
  const map = new Map<string, EntityConfig[]>()
  for (const e of entities) {
    if (!map.has(e.section)) map.set(e.section, [])
    map.get(e.section)!.push(e)
  }
  return [...map.entries()]
}
