import { useEffect, useState } from 'react'
import type { Episode } from '../types'

export interface EpisodesState {
  episodes: Episode[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useEpisodes(): EpisodesState {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  function fetchEpisodes() {
    setLoading(true)
    setError(null)
    fetch('/api/episodes')
      .then(r => { if (!r.ok) throw new Error(r.statusText); return r.json() })
      .then((data: Episode[]) => { setEpisodes(data); setLoading(false) })
      .catch((e: Error) => { setError(e.message); setLoading(false) })
  }

  useEffect(() => { fetchEpisodes() }, [])

  return { episodes, loading, error, refresh: fetchEpisodes }
}
