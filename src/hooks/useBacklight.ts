import { useEffect, useRef } from 'react'

const DIM_AFTER_MS = 2 * 60 * 1000  // 2 minutes
const DIM_VALUE = 2

async function setBrightness(value: number) {
  await fetch('/api/brightness', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ value }),
  })
}

export function useBacklight() {
  const fullBrightness = useRef(15)
  const isDimmed = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function scheduleDim() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      isDimmed.current = true
      setBrightness(DIM_VALUE)
    }, DIM_AFTER_MS)
  }

  function onActivity() {
    if (isDimmed.current) {
      isDimmed.current = false
      setBrightness(fullBrightness.current)
    }
    scheduleDim()
  }

  useEffect(() => {
    // Read current brightness so we know what to restore to
    fetch('/api/brightness')
      .then(r => r.json())
      .then(({ value }) => { fullBrightness.current = value })
      .catch(() => {})

    scheduleDim()
    document.addEventListener('pointerdown', onActivity)
    return () => {
      document.removeEventListener('pointerdown', onActivity)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
}
