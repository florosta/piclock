import { useEffect, useState } from 'react'
import { usePlayer } from './hooks/usePlayer'
import { useEpisodes } from './hooks/useEpisodes'
import { useBacklight } from './hooks/useBacklight'
import { useAlarms } from './hooks/useAlarms'
import type { Alarm } from './hooks/useAlarms'
import ClockView from './views/ClockView'
import EpisodePicker from './views/EpisodePicker'
import AlarmManager from './views/AlarmManager'
import AlarmFiring from './views/AlarmFiring'

export default function App() {
  const player = usePlayer()
  const episodes = useEpisodes()
  useBacklight()

  const [showPicker, setShowPicker] = useState(false)
  const [showAlarms, setShowAlarms] = useState(false)
  const [firingAlarm, setFiringAlarm] = useState<Alarm | null>(null)

  const alarmState = useAlarms((alarm) => setFiringAlarm(alarm))

  // Auto-select latest episode once loaded
  useEffect(() => {
    if (episodes.episodes.length > 0 && !player.currentEpisode) {
      player.select(episodes.episodes[0])
    }
  }, [episodes.episodes])

  function handleDismiss() {
    alarmState.dismiss()
    setFiringAlarm(null)
  }

  function handleSnooze() {
    alarmState.snooze()
    setFiringAlarm(null)
  }

  return (
    <>
      <audio ref={player.audioRef} style={{ display: 'none' }} />

      <ClockView
        player={player}
        nextAlarm={alarmState.nextAlarm}
        onShowPicker={() => setShowPicker(true)}
        onShowAlarms={() => setShowAlarms(true)}
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
          alarms={alarmState.alarms}
          onAdd={alarmState.addAlarm}
          onToggle={alarmState.toggleAlarm}
          onDelete={alarmState.deleteAlarm}
          onClose={() => setShowAlarms(false)}
        />
      )}

      {firingAlarm && (
        <AlarmFiring
          alarm={firingAlarm}
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
        />
      )}
    </>
  )
}
