import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * System volume, with a fallback.
 *
 * The server drives ALSA. If the Pi has no usable mixer control it says so
 * (`supported: false`), and rather than presenting a control that silently does
 * nothing we fall back to the <audio> element's own gain — which at least
 * controls the podcast, the only thing this app plays through the browser.
 *
 * Writes are optimistic and throttled: dragging the slider must feel immediate,
 * but must not shell out to amixer on every animation frame.
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
    if (audioRef.current) audioRef.current.volume = clamped / 100
    pending.current = clamped
    if (timer.current === null) {
      // Send the first move immediately, then at most one write per WRITE_MS.
      flush()
      timer.current = setTimeout(flush, WRITE_MS)
    }
  }, [audioRef, flush])

  return { value, systemVolume, set }
}
