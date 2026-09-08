export interface Alarm {
  id: string
  time: string      // "07:30"
  days: number[]    // 0=Sun..6=Sat; empty = one-off
  enabled: boolean
}

export interface Episode {
  id: string
  title: string
  duration: number       // seconds
  publishedAt: number    // ms timestamp
  startTime: number      // seconds — ABS saved position; 0 if not started or finished
  audioTrack: { ino: string }
  podcast: {
    title: string
    itemId: string
    coverUrl: string
  }
}
