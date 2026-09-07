/**
 * The single icon set.
 *
 * One rule, applied everywhere: solid marks for transport controls (they must
 * read from across a dark room), line marks for everything else. Both inherit
 * `currentColor`, share a 24×24 grid, and line marks share one stroke width —
 * so nothing in the UI can render in a colour or weight the palette didn't ask
 * for. This replaces the mix of colour emoji and monospace glyphs, which
 * Chromium rendered at wildly different weights and hues.
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
  | 'bulb' | 'thermometer' | 'droplet' | 'flame' | 'bolt' | 'coin'
  | 'sun' | 'cloud' | 'cloudSun' | 'rain' | 'snow' | 'fog' | 'wind' | 'unknown'

const SOLID: Partial<Record<IconName, React.ReactNode>> = {
  rewind: <path d="M11.4 4.8v14.4L2.6 12zM21.4 4.8v14.4L12.6 12z" />,
  play: <path d="M5.4 3.4 21.4 12 5.4 20.6z" />,
  pause: <path d="M5.2 3.6h4.6v16.8H5.2zM14.2 3.6h4.6v16.8h-4.6z" />,
  stop: <rect x="4" y="4" width="16" height="16" rx="2.2" />,
}

const LINE: Partial<Record<IconName, React.ReactNode>> = {
  volumeDown: <>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M16 9.6a3.2 3.2 0 0 1 0 4.8" />
  </>,
  volumeUp: <>
    <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
    <path d="M15.4 9.6a3.2 3.2 0 0 1 0 4.8" />
    <path d="M18.4 6.9a7 7 0 0 1 0 10.2" />
  </>,
  list: <>
    <path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" />
  </>,
  alarm: <>
    <circle cx="12" cy="13.2" r="7.2" />
    <path d="M12 9.6v3.6l2.6 1.8" />
    <path d="M3.4 5.6 6.8 2.8" /><path d="M20.6 5.6 17.2 2.8" />
  </>,
  home: <>
    <path d="M3.6 10.4 12 3.6l8.4 6.8" />
    <path d="M5.8 12v8.4h12.4V12" />
  </>,
  close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
  refresh: <>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20.4 3.6v4.8h-4.8" />
  </>,
  moon: <path d="M20 14.4A8.6 8.6 0 0 1 9.6 4 8.8 8.8 0 1 0 20 14.4z" />,
  check: <path d="M4.8 12.6 9.6 17.4 19.2 6.6" />,
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  minus: <path d="M5 12h14" />,
  trash: <>
    <path d="M4.4 6.8h15.2" />
    <path d="M9.6 6.8V4.4h4.8v2.4" />
    <path d="M6.4 6.8 7.4 20h9.2l1-13.2" />
  </>,
  chevronUp: <path d="M5.6 15 12 8.6l6.4 6.4" />,
  chevronDown: <path d="M5.6 9 12 15.4 18.4 9" />,
  toggleOn: <>
    <rect x="2.4" y="6.6" width="19.2" height="10.8" rx="5.4" />
    <circle cx="16.2" cy="12" r="3" fill="currentColor" />
  </>,
  toggleOff: <>
    <rect x="2.4" y="6.6" width="19.2" height="10.8" rx="5.4" />
    <circle cx="7.8" cy="12" r="3" />
  </>,
  bulb: <>
    <path d="M9 17.4a6 6 0 1 1 6 0v1.8H9z" />
    <path d="M9.8 21.6h4.4" />
  </>,
  thermometer: <>
    <path d="M14 13.6V5.2a2 2 0 1 0-4 0v8.4a4.4 4.4 0 1 0 4 0z" />
  </>,
  droplet: <path d="M12 3.2c3.4 4 5.6 6.7 5.6 9.4a5.6 5.6 0 1 1-11.2 0c0-2.7 2.2-5.4 5.6-9.4z" />,
  flame: <>
    <path d="M12 21.2a5.6 5.6 0 0 0 5.6-5.6c0-4.4-5.6-8.4-5.6-12.8 0 0-4 3.2-4 7.6 0 1.6.8 2.6 1.6 3.2 0-1.6 1.2-2.8 1.2-2.8s-1.2 2.4-1.2 4.8a4 4 0 0 0 2.4 5.6z" />
  </>,
  bolt: <path d="M13.6 2.4 5.2 13.6h5.6l-.4 8 8.4-11.2h-5.6z" />,
  coin: <>
    <rect x="2.4" y="5.6" width="19.2" height="12.8" rx="2" />
    <circle cx="12" cy="12" r="2.8" />
    <path d="M6 12v.1" /><path d="M18 12v.1" />
  </>,
  sun: <>
    <circle cx="12" cy="12" r="4.4" />
    <path d="M12 2.4v2.4" /><path d="M12 19.2v2.4" />
    <path d="M2.4 12h2.4" /><path d="M19.2 12h2.4" />
    <path d="M5.2 5.2 6.9 6.9" /><path d="M17.1 17.1l1.7 1.7" />
    <path d="M18.8 5.2 17.1 6.9" /><path d="M6.9 17.1 5.2 18.8" />
  </>,
  cloud: <path d="M7.2 19.2a4.4 4.4 0 0 1-.4-8.8 5.6 5.6 0 0 1 10.8-1.2 4 4 0 0 1 .4 10z" />,
  cloudSun: <>
    <circle cx="7.6" cy="7.6" r="3" />
    <path d="M7.6 2.4v1.6" /><path d="M2.4 7.6H4" /><path d="M3.9 3.9 5 5" />
    <path d="M10.4 20.4a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10 1 3.6 3.6 0 0 1-.4 7z" />
  </>,
  rain: <>
    <path d="M7.6 15.2a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10-1.2 3.8 3.8 0 0 1 .4 9.2z" />
    <path d="M9 18v2.8" /><path d="M13 18v2.8" /><path d="M17 18v2.8" />
  </>,
  snow: <>
    <path d="M7.6 14.8a4 4 0 0 1-.4-8 5.2 5.2 0 0 1 10-1.2 3.8 3.8 0 0 1 .4 9.2z" />
    <path d="M9 18.4v.1" /><path d="M13 20.4v.1" /><path d="M17 18.4v.1" />
  </>,
  fog: <>
    <path d="M4.4 8.8h15.2" /><path d="M6.4 12.8h13.2" />
    <path d="M4.4 16.8h11.2" />
  </>,
  wind: <>
    <path d="M3.6 8.8h9.6a2.8 2.8 0 1 0-2.8-2.8" />
    <path d="M3.6 15.2h12.8a2.8 2.8 0 1 1-2.8 2.8" />
  </>,
  unknown: <>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M9.6 9.6a2.4 2.4 0 1 1 3.2 2.3v1.7" />
    <path d="M12 17.2v.1" />
  </>,
}

interface Props {
  name: IconName
  /** Any CSS length. Defaults to 1em so the type scale drives icon size. */
  size?: string | number
  style?: React.CSSProperties
}

export default function Icon({ name, size = '1em', style }: Props) {
  const solid = SOLID[name]
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0, ...style }}
      {...(solid
        ? { fill: 'currentColor', stroke: 'none' }
        : {
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.9,
            strokeLinecap: 'round' as const,
            strokeLinejoin: 'round' as const,
          })}
    >
      {solid ?? LINE[name] ?? LINE.unknown}
    </svg>
  )
}
