export interface Alarm {
  id: string
  label: string
  time: string      // "07:30"
  days: number[]    // 0=Sun..6=Sat; empty = one-off
  enabled: boolean
}

export interface Episode {
  id: string
  title: string
  duration: number       // seconds
  publishedAt: number    // ms timestamp
  audioTrack: { ino: string }
  podcast: {
    title: string
    itemId: string
    coverUrl: string
  }
}
