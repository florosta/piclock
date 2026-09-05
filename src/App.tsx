import { useState } from 'react'
import { usePlayer } from './hooks/usePlayer'
import { useEpisodes } from './hooks/useEpisodes'
import ClockView from './views/ClockView'
import PodcastView from './views/PodcastView'

type View = 'clock' | 'podcasts'

export default function App() {
  const [view, setView] = useState<View>('clock')
  const player = usePlayer()
  const episodes = useEpisodes()

  return (
    <>
      <audio ref={player.audioRef} style={{ display: 'none' }} />
      {view === 'clock' ? (
        <ClockView player={player} onOpenPodcasts={() => setView('podcasts')} />
      ) : (
        <PodcastView player={player} episodes={episodes} onClose={() => setView('clock')} />
      )}
    </>
  )
}
