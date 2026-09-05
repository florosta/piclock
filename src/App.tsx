import { useRef, useState } from 'react'
import ClockView from './views/ClockView'
import PodcastView from './views/PodcastView'
import type { Episode } from './types'

export type View = 'clock' | 'podcasts'

export default function App() {
  const [view, setView] = useState<View>('clock')
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  function playEpisode(ep: Episode) {
    setCurrentEpisode(ep)
    setPlaying(true)
    // defer so audio src updates first
    setTimeout(() => audioRef.current?.play(), 50)
  }

  function togglePlayPause() {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) }
    else { el.pause(); setPlaying(false) }
  }

  function skip(seconds: number) {
    if (audioRef.current) audioRef.current.currentTime += seconds
  }

  const streamSrc = currentEpisode
    ? `/api/stream/${currentEpisode.podcast.itemId}/${currentEpisode.audioTrack.ino}`
    : undefined

  return (
    <>
      {streamSrc && (
        <audio
          ref={audioRef}
          src={streamSrc}
          onEnded={() => setPlaying(false)}
        />
      )}
      {view === 'clock' ? (
        <ClockView
          onOpenPodcasts={() => setView('podcasts')}
          currentEpisode={currentEpisode}
          playing={playing}
          onToggle={togglePlayPause}
        />
      ) : (
        <PodcastView
          onClose={() => setView('clock')}
          currentEpisode={currentEpisode}
          playing={playing}
          onPlay={playEpisode}
          onToggle={togglePlayPause}
          onSkip={skip}
          audioRef={audioRef}
        />
      )}
    </>
  )
}
