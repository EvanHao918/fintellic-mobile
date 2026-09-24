// src/utils/meter.ts
// Client-side free-read meter — mirrors the web app (FREE_DAILY=3, localStorage day-key of read IDs).
// The value is public: browsing the feed/companies is always free; only opening a full decode counts.
// Pro users are never metered. Re-opening an already-read decode the same day is free.
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FREE_DAILY = 3;

function dayKey(): string {
  const d = new Date();
  return `as_reads_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export async function readIdsToday(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(dayKey());
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

async function saveIds(ids: string[]): Promise<void> {
  try { await AsyncStorage.setItem(dayKey(), JSON.stringify(ids)); } catch {}
}

export async function readsToday(): Promise<number> {
  return (await readIdsToday()).length;
}

/**
 * Local fallback gate — used ONLY for anonymous users when the server didn't report
 * view_limit_info. Logged-in users are gated by the server (per-account) via reconcile().
 * Returns { allowed, remaining }. Pro bypasses entirely.
 */
export async function gateRead(id: number | string, isPro: boolean): Promise<{ allowed: boolean; remaining: number }> {
  if (isPro) return { allowed: true, remaining: Infinity };
  const key = String(id);
  const ids = await readIdsToday();
  if (ids.includes(key)) return { allowed: true, remaining: Math.max(0, FREE_DAILY - ids.length) };
  if (ids.length >= FREE_DAILY) return { allowed: false, remaining: 0 };
  ids.push(key);
  await saveIds(ids);
  return { allowed: true, remaining: Math.max(0, FREE_DAILY - ids.length) };
}

/** Overwrite the local counter with the server's authoritative seen-ids (server always wins). */
export async function reconcile(seenIds: (number | string)[]): Promise<void> {
  if (!Array.isArray(seenIds)) return;
  await saveIds(seenIds.map(String));
}

/**
 * Authoritative gate from the server's view_limit_info (per-account for logged-in, per-IP for anon).
 * Returns whether THIS filing may be shown. Already-seen ids are free re-reads.
 */
export function gateFromServer(vli: any, id: number | string): boolean {
  if (!vli || vli.is_pro) return true;
  const seen = (vli.seen_ids || []).map(String);
  if (seen.includes(String(id))) return true;            // already counted today → free re-read
  return (vli.views_remaining ?? FREE_DAILY) > 0;        // room left → allowed
}
