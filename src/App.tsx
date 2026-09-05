import { useEffect, useState } from 'react'
import { usePlayer } from './hooks/usePlayer'
import { useEpisodes } from './hooks/useEpisodes'
import { useBacklight } from './hooks/useBacklight'
import ClockView from './views/ClockView'
import EpisodePicker from './views/EpisodePicker'

export default function App() {
  const player = usePlayer()
  const episodes = useEpisodes()
  useBacklight()
  const [showPicker, setShowPicker] = useState(false)

  // Auto-select the latest episode once loaded
  useEffect(() => {
    if (episodes.episodes.length > 0 && !player.currentEpisode) {
      player.select(episodes.episodes[0])
    }
  }, [episodes.episodes])

  return (
    <>
      <audio ref={player.audioRef} style={{ display: 'none' }} />
      <ClockView player={player} onShowPicker={() => setShowPicker(true)} />
      {showPicker && (
        <EpisodePicker
          episodes={episodes}
          currentEpisode={player.currentEpisode}
          onSelect={ep => { player.select(ep); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
