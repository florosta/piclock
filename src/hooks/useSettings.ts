import { useEffect, useState } from 'react'

const COLOUR_KEY = 'piclock-accent'
const DEFAULT_COLOUR = '#e8c97a'

function applyAccent(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const r = (n >> 16) & 0xff
  const g = (n >> 8) & 0xff
  const b = n & 0xff
  const root = document.documentElement.style
  root.setProperty('--amber', hex)
  root.setProperty('--amber-dim', `rgba(${r},${g},${b},0.4)`)
  root.setProperty('--amber-faint', `rgba(${r},${g},${b},0.12)`)
}

export interface SettingsState {
  brightness: number
  setBrightness: (value: number) => void
  shutdown: () => void
  accentColor: string
  setAccentColor: (hex: string) => void
}

export function useSettings(onBrightness: (value: number) => void): SettingsState {
  const [brightness, setBrightnessState] = useState(15)
  const [accentColor, setAccentColorState] = useState(
    () => localStorage.getItem(COLOUR_KEY) ?? DEFAULT_COLOUR
  )

  useEffect(() => {
    fetch('/api/brightness')
      .then(r => r.json())
      .then(({ value }: { value: number }) => setBrightnessState(value))
      .catch(() => {})
  }, [])

  useEffect(() => { applyAccent(accentColor) }, [accentColor])

  function setBrightness(value: number) {
    const v = Math.max(Math.round(31 * 0.05), Math.min(31, value))
    setBrightnessState(v)
    onBrightness(v)
    fetch('/api/brightness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: v }),
    }).catch(() => {})
  }

  function shutdown() {
    fetch('/api/system/shutdown', { method: 'POST' }).catch(() => {})
  }

  function setAccentColor(hex: string) {
    localStorage.setItem(COLOUR_KEY, hex)
    setAccentColorState(hex)
  }

  return { brightness, setBrightness, shutdown, accentColor, setAccentColor }
}
