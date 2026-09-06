import { useCallback, useEffect, useState } from 'react'
import { HA_ENTITY_IDS } from '../config/ha'

export interface HAState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
}

export function useHA() {
  const [states, setStates] = useState<HAState[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    fetch(`/api/ha/states?ids=${HA_ENTITY_IDS.join(',')}`)
      .then(r => r.json())
      .then((data: HAState[]) => { setStates(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { refresh() }, [refresh])

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
