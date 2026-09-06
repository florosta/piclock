import { useEffect, useState } from 'react'
import { usePlayer } from './hooks/usePlayer'
import { useEpisodes } from './hooks/useEpisodes'
import { useBacklight } from './hooks/useBacklight'
import { useAlarms } from './hooks/useAlarms'
import { useHA } from './hooks/useHA'
import ClockView from './views/ClockView'
import EpisodePicker from './views/EpisodePicker'
import AlarmManager from './views/AlarmManager'
import AlarmFiring from './views/AlarmFiring'
import HADashboard from './views/HADashboard'

export default function App() {
  const player = usePlayer()
  const episodes = useEpisodes()
  const alarms = useAlarms()
  const ha = useHA()
  useBacklight()

  const [showPicker, setShowPicker] = useState(false)
  const [showAlarms, setShowAlarms] = useState(false)
  const [showHA, setShowHA] = useState(false)

  useEffect(() => {
    if (episodes.episodes.length > 0 && !player.currentEpisode) {
      player.select(episodes.episodes[0])
    }
  }, [episodes.episodes])

  return (
    <>
      <audio ref={player.audioRef} style={{ display: 'none' }} />

      <ClockView
        player={player}
        nextAlarm={alarms.nextAlarm}
        onShowPicker={() => setShowPicker(true)}
        onShowAlarms={() => setShowAlarms(true)}
        onShowHA={() => { ha.refresh(); setShowHA(true) }}
      />

      {showPicker && (
        <EpisodePicker
          episodes={episodes}
          currentEpisode={player.currentEpisode}
          onSelect={ep => { player.select(ep); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showAlarms && (
        <AlarmManager
          alarms={alarms.alarms}
          onAdd={alarms.addAlarm}
          onToggle={alarms.toggleAlarm}
          onDelete={alarms.deleteAlarm}
          onClose={() => setShowAlarms(false)}
        />
      )}

      {showHA && (
        <HADashboard
          states={ha.states}
          loading={ha.loading}
          onToggle={ha.toggle}
          onRefresh={ha.refresh}
          onClose={() => setShowHA(false)}
        />
      )}

      {alarms.firingAlarm && (
        <AlarmFiring
          alarm={alarms.firingAlarm}
          onDismiss={alarms.dismiss}
          onSnooze={alarms.snooze}
        />
      )}
    </>
  )
}
