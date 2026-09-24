// src/theme/allsight.ts
// AllSight design system (2026 rebuild) — dark, brand-green, matching the web app.
// New screens import from here. The legacy src/theme/index.ts (Hermes gold/beige) is being phased out.
import { Platform } from 'react-native';

// Type system: editorial serif display (Iowan Old Style — an iOS system serif, matches the web brand)
// paired with the system sans for UI/body and a mono for tickers/numbers.
const SERIF = Platform.select({
  web: "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Times New Roman', serif",
  default: 'Iowan Old Style',
}) as string;
const MONO = Platform.select({
  web: "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, monospace",
  ios: 'Menlo',
  default: 'monospace',
}) as string;

export const AS = {
  color: {
    bg: '#080d12',
    surface: '#0e1720',
    surface2: '#111c26',
    ink: '#eef3f2',
    ink2: '#9fb0ad',
    ink3: '#61726f',
    accent: '#1FB47A',
    accentInk: '#04150e',
    // sentiment / direction
    bull: '#22c55e',
    bear: '#f0616d',
    neutral: '#8b95c9',
    mix: '#e0a040',
    gold: '#e0b44c',
    // lines / chrome
    line: 'rgba(255,255,255,0.08)',
    line2: 'rgba(255,255,255,0.05)',
    // keyword tags (calm indigo)
    tag: '#7ea2f0',
    tagBg: 'rgba(91,123,240,0.12)',
    scrim: 'rgba(0,0,0,0.55)',
  },
  // Market-pulse / voiceprint 6-color palette (matches web #pfx PAL) — for the feed header waveform.
  pulse: ['#3B5BDB', '#0F9D77', '#8B5CF6', '#C07D1A', '#BD4636', '#C2337A'],
  // Deterministic letter-avatar palette (matches web _avColor + the backend logo fallback).
  avatar: ['#0E9F6E', '#18C0AA', '#30B4EE', '#7284F2', '#F2AA36', '#F7866A', '#DB2777', '#8B5CF6', '#5B7A55', '#E5484D'],
  radius: { sm: 8, md: 11, lg: 14, xl: 16, pill: 999 },
  space: (n: number) => n * 4,
  font: {
    serif: SERIF,   // editorial display — masthead title, company names, hooks, section heads
    mono: MONO,     // tickers, %, prices
    // body / UI = system sans (leave fontFamily undefined)
  },
} as const;

// Deterministic avatar background from a ticker/name (same hash as the web app).
export function avatarColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AS.avatar[h % AS.avatar.length];
}

// First 1-2 letters for the letter-avatar.
export function avatarLetters(ticker?: string, name?: string): string {
  const t = (ticker || '').toUpperCase();
  if (t) return t.slice(0, 2);
  return (name || '?').trim().slice(0, 2).toUpperCase();
}

// Color for the AllSight "read"/sentiment pill, driven by internal polarity (never shown as a word).
export function polarityColor(polarity?: string, aiSentiment?: string): string {
  const p = (polarity || '').toLowerCase();
  if (p === 'negative') return AS.color.bear;
  if (p === 'positive') return AS.color.bull;
  if (p === 'mixed') return AS.color.mix;
  if (p === 'neutral') return AS.color.neutral;
  // fall back to parsing the read text so pre-scorecard filings still colour right
  const r = (aiSentiment || '').toLowerCase();
  if (r.indexOf('negative') >= 0) return AS.color.bear;
  if (r.indexOf('positive') >= 0) return AS.color.bull;
  if (r.indexOf('mixed') >= 0) return AS.color.mix;
  return AS.color.bull;
}

// "▲x.x% since filed" colour for a since-filed move.
export function moveColor(pct?: number | null): string {
  if (pct == null) return AS.color.ink3;
  return pct >= 0 ? AS.color.bull : AS.color.bear;
}
