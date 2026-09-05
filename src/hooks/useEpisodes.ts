import { useEffect, useState } from 'react'
import type { Episode } from '../types'

export interface EpisodesState {
  episodes: Episode[]
  loading: boolean
  error: string | null
  reload: () => void
}

export function useEpisodes(): EpisodesState {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch('/api/episodes')
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then((data: Episode[]) => { setEpisodes(data); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }, [tick])

  const reload = () => setTick(t => t + 1)

  return { episodes, loading, error, reload }
}
