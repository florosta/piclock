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
