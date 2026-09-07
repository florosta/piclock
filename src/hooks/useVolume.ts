import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * System volume, with a fallback.
 *
 * The server drives the PipeWire sink (or an ALSA control, if that is all the Pi
 * has). If it finds neither it says so — `supported: false` — and rather than
 * presenting a control that silently does nothing we fall back to the <audio>
 * element's own gain, which at least covers the podcast.
 *
 * That fallback is a substitute, never a second stage. When the server is
 * driving the sink the element stays wide open: attenuating in both places
 * multiplies (80% sink x 80% element = 64%), so the podcast would sit quieter
 * than the alarm at every setting and disappear at low ones — and mpv plays the
 * alarm straight to the same sink, so it would never match.
 *
 * Writes are optimistic and throttled: dragging the slider must feel immediate,
 * but must not shell out on every animation frame.
 */

const WRITE_MS = 120

export interface VolumeState {
  value: number
  /** False when the server found no ALSA control — the slider is then local. */
  systemVolume: boolean
  set: (value: number) => void
}

export function useVolume(audioRef: React.RefObject<HTMLAudioElement | null>): VolumeState {
  const [value, setValue] = useState(50)
  const [systemVolume, setSystemVolume] = useState(true)
  const pending = useRef<number | null>(null)
  const sent = useRef<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/volume')
      .then(r => r.json())
      .then(({ value, supported }: { value: number; supported?: boolean }) => {
        setValue(value)
        setSystemVolume(supported !== false)
      })
      .catch(() => {})
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [])

  const flush = useCallback(() => {
    timer.current = null
    const next = pending.current
    pending.current = null
    // Nothing new to say: the trailing write after a drag would otherwise
    // repeat the value the leading write already sent.
    if (next === null || next === sent.current) return
    sent.current = next
    fetch('/api/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: next }),
    })
      .then(r => r.json())
      .then((res: { ok?: boolean }) => { if (res.ok === false) setSystemVolume(false) })
      .catch(() => {})
  }, [])

  const set = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(next)))
    setValue(clamped)
    pending.current = clamped
    if (timer.current === null) {
      // Send the first move immediately, then at most one write per WRITE_MS.
      flush()
      timer.current = setTimeout(flush, WRITE_MS)
    }
  }, [flush])

  // One place owns the element's gain, so it also corrects itself if the server
  // turns out not to support system volume after the first write.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = systemVolume ? 1 : value / 100
  }, [audioRef, systemVolume, value])

  return { value, systemVolume, set }
}
