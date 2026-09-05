import { useCallback, useEffect, useRef, useState } from 'react'
import type { Episode } from '../types'

export interface PlayerState {
  audioRef: React.RefObject<HTMLAudioElement | null>
  currentEpisode: Episode | null
  playing: boolean
  progress: number        // 0–1
  elapsed: number         // seconds
  duration: number        // seconds
  sleepTimer: number | null  // seconds remaining, null = off
  play: (episode: Episode) => void
  togglePlayPause: () => void
  skip: (seconds: number) => void
  seekTo: (ratio: number) => void
  setSleepTimer: (minutes: number) => void
  cancelSleepTimer: () => void
}

export function usePlayer(): PlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sleepTimerEnds, setSleepTimerEnds] = useState<number | null>(null)
  const [sleepTimer, setSleepTimerDisplay] = useState<number | null>(null)

  // Update src and autoplay when episode changes
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (!currentEpisode) { el.src = ''; return }
    el.src = `/api/stream/${currentEpisode.podcast.itemId}/${currentEpisode.audioTrack.ino}`
    setProgress(0)
    setElapsed(0)
    setDuration(0)
    el.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }, [currentEpisode?.id])

  // Attach audio event listeners once
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTimeUpdate = () => {
      if (el.duration) {
        setProgress(el.currentTime / el.duration)
        setElapsed(el.currentTime)
      }
    }
    const onDurationChange = () => setDuration(el.duration || 0)
    const onEnded = () => setPlaying(false)
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('durationchange', onDurationChange)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  // Sleep timer countdown
  useEffect(() => {
    if (sleepTimerEnds === null) {
      setSleepTimerDisplay(null)
      return
    }
    const tick = () => {
      const remaining = Math.ceil((sleepTimerEnds - Date.now()) / 1000)
      if (remaining <= 0) {
        audioRef.current?.pause()
        setPlaying(false)
        setSleepTimerEnds(null)
      } else {
        setSleepTimerDisplay(remaining)
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [sleepTimerEnds])

  const play = useCallback((episode: Episode) => setCurrentEpisode(episode), [])

  const togglePlayPause = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) }
    else { el.pause(); setPlaying(false) }
  }, [])

  const skip = useCallback((seconds: number) => {
    const el = audioRef.current
    if (el) el.currentTime = Math.max(0, el.currentTime + seconds)
  }, [])

  const seekTo = useCallback((ratio: number) => {
    const el = audioRef.current
    if (el && el.duration) el.currentTime = ratio * el.duration
  }, [])

  const setSleepTimer = useCallback((minutes: number) => {
    setSleepTimerEnds(Date.now() + minutes * 60 * 1000)
  }, [])

  const cancelSleepTimer = useCallback(() => setSleepTimerEnds(null), [])

  return {
    audioRef, currentEpisode, playing, progress, elapsed, duration, sleepTimer,
    play, togglePlayPause, skip, seekTo, setSleepTimer, cancelSleepTimer,
  }
}
