import { useCallback, useEffect, useState } from 'react'
import type { DiscoveredEntity } from '../config/ha'

/**
 * The house as HA knows it, not as a list in this repo describes it.
 *
 * One call returns every entity worth showing, already grouped by HA area, so
 * adding a room or a lamp in Home Assistant is enough — nothing here changes.
 * Fetched when the panel opens and on demand, not polled: it is a full states
 * dump, and nobody is looking at it while the clock is on screen.
 */

export interface HouseArea {
  area: string
  entities: DiscoveredEntity[]
}

export interface HouseState {
  areas: HouseArea[]
  loading: boolean
  configured: boolean
  refresh: () => void
  toggle: (entity: DiscoveredEntity) => void
}

/** Domains do not share one on/off service — a cover opens, a lock locks. */
function serviceFor(domain: string, state: string): { domain: string; service: string } | null {
  switch (domain) {
    case 'cover': return { domain, service: state === 'open' ? 'close_cover' : 'open_cover' }
    case 'lock':  return { domain, service: state === 'locked' ? 'unlock' : 'lock' }
    case 'light': case 'switch': case 'fan': case 'input_boolean':
      return { domain, service: state === 'on' ? 'turn_off' : 'turn_on' }
    default: return null
  }
}

/** What the entity's state becomes once the service call lands. */
function optimisticState(domain: string, state: string): string {
  if (domain === 'cover') return state === 'open' ? 'closed' : 'open'
  if (domain === 'lock') return state === 'locked' ? 'unlocked' : 'locked'
  return state === 'on' ? 'off' : 'on'
}

export function useHouse(): HouseState {
  const [areas, setAreas] = useState<HouseArea[]>([])
  const [loading, setLoading] = useState(true)
  const [configured, setConfigured] = useState(true)

  // No loading flag on refresh: blanking a panel you are looking at to say
  // "Loading…" is worse than letting the tiles update under you.
  const refresh = useCallback(() => {
    fetch('/api/ha/house')
      .then(r => r.json())
      .then((data: { areas?: HouseArea[]; configured?: boolean }) => {
        setAreas(data.areas ?? [])
        setConfigured(data.configured !== false)
      })
      .catch(() => setAreas([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const toggle = useCallback((entity: DiscoveredEntity) => {
    const call = serviceFor(entity.domain, entity.state)
    if (!call) return
    const next = optimisticState(entity.domain, entity.state)
    setAreas(prev => prev.map(a => ({
      ...a,
      entities: a.entities.map(e => e.entity_id === entity.entity_id ? { ...e, state: next } : e),
    })))
    fetch('/api/ha/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...call, entity_id: entity.entity_id }),
    }).catch(() => {})
  }, [])

  return { areas, loading, configured, refresh, toggle }
}
