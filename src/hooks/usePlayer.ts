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
  select: (episode: Episode) => void   // load without playing
  play: () => void                     // play current episode
  stop: () => void                     // pause
  skip: (seconds: number) => void
  seekTo: (ratio: number) => void
  setSleepTimer: (minutes: number) => void
  cancelSleepTimer: () => void
}

export function usePlayer(): PlayerState {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  // Ref mirrors state so play() can read the current episode without a stale closure.
  // Both must be updated together in select(). Do not remove the ref.
  const currentEpisodeRef = useRef<Episode | null>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [sleepTimerEnds, setSleepTimerEnds] = useState<number | null>(null)
  const [sleepTimer, setSleepTimerDisplay] = useState<number | null>(null)
  // Desired seek position to apply once duration is known after a src change
  const startTimeRef = useRef(0)

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
    const onDurationChange = () => {
      setDuration(el.duration || 0)
      if (startTimeRef.current > 0 && el.duration) {
        el.currentTime = startTimeRef.current
        startTimeRef.current = 0
      }
    }
    const onEnded = () => { setPlaying(false); setSleepTimerEnds(null) }
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('durationchange', onDurationChange)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('durationchange', onDurationChange)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  // Sleep timer countdown — auto-pauses when it hits zero
  useEffect(() => {
    if (sleepTimerEnds === null) { setSleepTimerDisplay(null); return }
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

  function reportProgress(ep: Episode, currentTime: number, duration: number) {
    if (!duration) return
    fetch(`/api/abs-progress/${ep.podcast.itemId}/${ep.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentTime,
        duration,
        progress: currentTime / duration,
        isFinished: currentTime / duration > 0.99,
      }),
    }).catch(() => {})
  }

  // 30s progress sync while playing — uses refs so the interval never goes stale
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      const el = audioRef.current
      const ep = currentEpisodeRef.current
      if (el && ep && el.duration) reportProgress(ep, el.currentTime, el.duration)
    }, 30_000)
    return () => clearInterval(id)
  }, [playing])

  // Load episode into audio element without playing
  const select = useCallback((episode: Episode) => {
    const el = audioRef.current
    const prev = currentEpisodeRef.current
    if (el && prev && el.duration) reportProgress(prev, el.currentTime, el.duration)
    if (el) { el.pause(); el.src = '' }
    startTimeRef.current = episode.startTime ?? 0
    setPlaying(false)
    setProgress(0)
    setElapsed(0)
    setDuration(0)
    setSleepTimerEnds(null)
    currentEpisodeRef.current = episode
    setCurrentEpisode(episode)
  }, [])

  // Play the currently selected episode
  const play = useCallback(() => {
    const el = audioRef.current
    const ep = currentEpisodeRef.current
    if (!el || !ep) return
    const src = `/api/stream/${ep.podcast.itemId}/${ep.audioTrack.ino}`
    // Only reset src if we're loading a different episode
    if (!el.src.endsWith(ep.audioTrack.ino)) {
      el.src = src
      setProgress(0); setElapsed(0); setDuration(0)
    }
    el.play().then(() => setPlaying(true)).catch(console.error)
  }, [])

  const stop = useCallback(() => {
    const el = audioRef.current
    const ep = currentEpisodeRef.current
    if (el && ep && el.duration) reportProgress(ep, el.currentTime, el.duration)
    el?.pause()
    setPlaying(false)
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
    select, play, stop, skip, seekTo, setSleepTimer, cancelSleepTimer,
  }
}
