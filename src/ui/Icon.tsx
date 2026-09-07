/**
 * The single icon set — solid marks only.
 *
 * Every icon is a filled silhouette in `currentColor` on one 24×24 grid. There
 * are no strokes anywhere: counters and cut-outs are real holes, punched with
 * `fill-rule: evenodd`, so an icon sits correctly on the page, on a raised
 * surface, or on the lit amber fill without carrying a background of its own.
 *
 * Solid rather than outlined is a deliberate match to the clock face: the whole
 * interface is now blocks of amber on black, and hairline icons fought that.
 * It also survives the backlight dropping to 2/31, where thin strokes go muddy.
 *
 * Default size is `1em`, so an icon is sized by its container's font-size and
 * every icon dimension in the app comes from the type scale in index.css.
 */

export type IconName =
  | 'rewind' | 'play' | 'pause' | 'stop'
  | 'volumeDown' | 'volumeUp'
  | 'list' | 'alarm' | 'home'
  | 'close' | 'refresh' | 'moon' | 'check' | 'plus' | 'minus' | 'trash'
  | 'chevronUp' | 'chevronDown'
  | 'toggleOn' | 'toggleOff'
  | 'bulb' | 'thermometer' | 'droplet' | 'radiator' | 'bolt' | 'coin'
  | 'sun' | 'cloud' | 'cloudSun' | 'rain' | 'snow' | 'fog' | 'wind' | 'unknown'

/** Icons whose holes need evenodd rather than nonzero winding. */
const EVENODD = new Set<IconName>([
  'alarm', 'home', 'toggleOn', 'toggleOff', 'coin', 'unknown', 'bulb', 'radiator',
])

const PATHS: Record<IconName, React.ReactNode> = {
  // ── transport ──────────────────────────────────────────────────────────
  rewind: <path d="M11.4 4.8v14.4L2.6 12zM21.4 4.8v14.4L12.6 12z" />,
  play: <path d="M5.4 3.4 21.4 12 5.4 20.6z" />,
  pause: <path d="M5.2 3.6h4.6v16.8H5.2zM14.2 3.6h4.6v16.8h-4.6z" />,
  stop: <rect x="4" y="4" width="16" height="16" rx="2.2" />,

  // ── volume: cone plus filled arc bands, computed as annulus sectors ────
  volumeDown: <>
    <path d="M2.6 9h4.3l5.5-4.8v15.6L6.9 15H2.6z" />
    <path d="M15.39 5.71A9.4 9.4 0 0 1 15.39 18.29L14.05 17.09A7.6 7.6 0 0 0 14.05 6.91Z" />
  </>,
  volumeUp: <>
    <path d="M2.6 9h4.3l5.5-4.8v15.6L6.9 15H2.6z" />
    <path d="M15.39 5.71A9.4 9.4 0 0 1 15.39 18.29L14.05 17.09A7.6 7.6 0 0 0 14.05 6.91Z" />
    <path d="M18.06 3.3A13 13 0 0 1 18.06 20.7L16.72 19.49A11.2 11.2 0 0 0 16.72 4.51Z" />
  </>,

  // ── navigation ─────────────────────────────────────────────────────────
  list: <>
    <rect x="2.8" y="5" width="18.4" height="2.9" rx="1.45" />
    <rect x="2.8" y="10.55" width="18.4" height="2.9" rx="1.45" />
    <rect x="2.8" y="16.1" width="18.4" height="2.9" rx="1.45" />
  </>,
  alarm: <path d="M12 5.6a7.6 7.6 0 1 0 0 15.2 7.6 7.6 0 0 0 0-15.2zm1.15 3.2v4.6l3.1 2.15-1.3 1.85-4.1-2.85V8.8zM2.4 5.5 6.5 2.1l1.7 2.05L4.1 7.55zm19.2 0L17.5 2.1l-1.7 2.05 4.1 3.4z" />,
  home: <path d="M12 2.6 1.6 11.3h3V21.4h14.8V11.3h3zm-2.2 12.2h4.4v6.6H9.8z" />,

  // ── controls ───────────────────────────────────────────────────────────
  close: <path d="m6.6 4.6 5.4 5.4 5.4-5.4 2 2-5.4 5.4 5.4 5.4-2 2-5.4-5.4-5.4 5.4-2-2 5.4-5.4L4.6 6.6z" />,
  refresh: <>
    <path d="M17.79 5.11A9 9 0 1 1 8.92 3.54L9.88 6.17A6.2 6.2 0 1 0 15.99 7.25Z" />
    <path d="M19.07 3.57 14.83 8.63 13.07 4.37Z" />
  </>,
  moon: <path d="M20.4 14.6A8.8 8.8 0 0 1 9.4 3.6 9 9 0 1 0 20.4 14.6z" />,
  check: <path d="m9.5 18.8-5.9-5.9 2.2-2.2 3.7 3.7 8.7-8.7 2.2 2.2z" />,
  plus: <path d="M10.4 4.4h3.2v5.9h5.9v3.4h-5.9v5.9h-3.2v-5.9H4.5v-3.4h5.9z" />,
  minus: <path d="M4.5 10.3h15v3.4h-15z" />,
  trash: <path d="M9.4 3.4h5.2l.7 1.9h4.9v2.9H3.8V5.3h4.9zM5.6 9.6h12.8l-.9 10.4a1.2 1.2 0 0 1-1.2 1.1H7.7a1.2 1.2 0 0 1-1.2-1.1z" />,
  chevronUp: <path d="M12 7.6 21 16.4H3z" />,
  chevronDown: <path d="M12 16.4 3 7.6h18z" />,

  toggleOn: <path d="M8 5.6h8a6.4 6.4 0 0 1 0 12.8H8A6.4 6.4 0 0 1 8 5.6zm8 3.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z" />,
  toggleOff: <path d="M8 5.6h8a6.4 6.4 0 0 1 0 12.8H8A6.4 6.4 0 0 1 8 5.6zm0 3.2a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4z" />,

  // ── entities ───────────────────────────────────────────────────────────
  bulb: <path d="M12 1.8a6.9 6.9 0 0 0-3.9 12.6v2.9h7.8v-2.9A6.9 6.9 0 0 0 12 1.8zM8.9 18.5h6.2v1.5H8.9zm.6 3h5v1.1h-5z" />,
  thermometer: <path d="M12 1.6a3 3 0 0 0-3 3v9.1a5.4 5.4 0 1 0 6 0V4.6a3 3 0 0 0-3-3z" />,
  droplet: <path d="M12 2.4c3.7 4.4 6 7.3 6 10.2a6 6 0 1 1-12 0c0-2.9 2.3-5.8 6-10.2z" />,
  // A radiator, not a flame: the flame silhouette was a near-twin of the
  // humidity droplet, and the two sit side by side in the Bedroom section.
  radiator: <path d="M2.6 3.8h18.8v14.4H2.6zm3.1 2.9v8.6h1.9V6.7zm4.4 0v8.6h1.9V6.7zm4.4 0v8.6h1.9V6.7zM4.6 19.4h2.2v2.8H4.6zm12.6 0h2.2v2.8h-2.2z" />,
  bolt: <path d="M14.2 1.8 4.6 14.2h5.6l-.6 8 9.8-12.8h-5.8z" />,
  coin: <path d="M1.8 5.2h20.4v13.6H1.8zm10.2 3.4a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8z" />,

  // ── weather ────────────────────────────────────────────────────────────
  sun: <>
    <circle cx="12" cy="12" r="5.2" />
    <path d="M10.6 1h2.8v3.4h-2.8zm0 18.6h2.8V23h-2.8zM1 10.6h3.4v2.8H1zm18.6 0H23v2.8h-3.4zM3.5 5.5l2-2 2.4 2.4-2 2zm12.6 12.6 2-2 2.4 2.4-2 2zM18.5 3.5l2 2-2.4 2.4-2-2zM5.9 16.1l2 2-2.4 2.4-2-2z" />
  </>,
  cloud: <path d="M6.9 20.2a4.9 4.9 0 0 1-.5-9.8 6.1 6.1 0 0 1 11.7-1.3 4.5 4.5 0 0 1 .4 11.1z" />,
  cloudSun: <>
    <circle cx="7.4" cy="6.4" r="3.2" />
    <path d="M6.2 1.2h2.4v2.2H6.2zm0 8.4h2.4v2.2H6.2zM1.4 5.2h2.2v2.4H1.4zm9.8 0h2.2v2.4h-2.2z" />
    <path d="M10.2 21.4a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.7-1.1 4.1 4.1 0 0 1 .4 9.9z" />
  </>,
  rain: <>
    <path d="M7.2 15.6a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.7-1.2 4.2 4.2 0 0 1 .4 10z" />
    <path d="M7.6 17.4h2.5l-1.4 4.9H6.2zm4.9 0H15l-1.4 4.9h-2.5zm4.9 0h2.5l-1.4 4.9h-2.5z" />
  </>,
  snow: <>
    <path d="M7.2 15.2a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.7-1.2 4.2 4.2 0 0 1 .4 10z" />
    <circle cx="8.4" cy="19" r="1.5" /><circle cx="12" cy="21.4" r="1.5" /><circle cx="15.6" cy="19" r="1.5" />
  </>,
  fog: <path d="M3 6.2h18v2.7H3zm2.4 5.5h16.2v2.7H5.4zM3 17.2h13.8v2.7H3z" />,
  wind: <path d="M2.6 6.4h9.8a2.2 2.2 0 1 0-2.2-2.2H7.4a4.9 4.9 0 1 1 4.9 4.9H2.6zm0 8.5h11.9a4.9 4.9 0 1 1-4.9 4.9h2.8a2.2 2.2 0 1 0 2.2-2.2H2.6z" />,
  unknown: <path d="M12 2.4a9.6 9.6 0 1 0 0 19.2 9.6 9.6 0 0 0 0-19.2zm-.2 3.8a3.7 3.7 0 0 1 2 6.8c-.5.3-.7.6-.7 1v.8h-2.4v-1.2c0-1.1.5-1.8 1.5-2.4.7-.4 1-.8 1-1.4a1.4 1.4 0 0 0-2.8 0H8a3.7 3.7 0 0 1 3.8-3.6zM10.7 16.4h2.6V19h-2.6z" />,
}

interface Props {
  name: IconName
  /** Any CSS length. Defaults to 1em so the type scale drives icon size. */
  size?: string | number
  style?: React.CSSProperties
}

export default function Icon({ name, size = '1em', style }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
      stroke="none"
      fillRule={EVENODD.has(name) ? 'evenodd' : 'nonzero'}
      clipRule={EVENODD.has(name) ? 'evenodd' : 'nonzero'}
      style={{ display: 'block', flexShrink: 0, ...style }}
    >
      {PATHS[name] ?? PATHS.unknown}
    </svg>
  )
}
