import { useCallback, useEffect, useState } from 'react'
import { HA_ENTITY_IDS } from '../config/ha'

export interface HAState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
}

/** The clock face shows weather, so HA is polled rather than fetched only when
 *  the house panel opens. Ten minutes: outdoor temperature and conditions do
 *  not move faster than that, and the Pi should not be chattering at HA. */
const POLL_MS = 10 * 60 * 1000

export function useHA() {
  const [states, setStates] = useState<HAState[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    fetch(`/api/ha/states?ids=${HA_ENTITY_IDS.join(',')}`)
      .then(r => r.json())
      .then((data: HAState[]) => { setStates(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const toggle = useCallback(async (entity_id: string, currentState: string) => {
    const domain = entity_id.split('.')[0]
    const service = currentState === 'on' ? 'turn_off' : 'turn_on'
    // Optimistic update
    setStates(prev => prev.map(s => s.entity_id === entity_id ? { ...s, state: service === 'turn_on' ? 'on' : 'off' } : s))
    await fetch('/api/ha/service', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, service, entity_id }),
    })
  }, [])

  const get = useCallback((id: string) => states.find(s => s.entity_id === id) ?? null, [states])

  return { states, loading, refresh, toggle, get }
}
