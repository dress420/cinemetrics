// Gemeinsame Helfer für „Where to watch“ (FilmDetailPanel) und den Streaming-Filter

export const REGIONS = [
  { code: 'DE', label: 'Germany' },
  { code: 'AT', label: 'Austria' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'GB', label: 'UK' },
  { code: 'US', label: 'USA' },
]

const REGION_KEY = 'cinemetrics-region'
export const getRegion = () => { try { return localStorage.getItem(REGION_KEY) || 'DE' } catch { return 'DE' } }
export const saveRegion = (r) => { try { localStorage.setItem(REGION_KEY, r) } catch {} }

// Kostenlos zuerst, dann Abo, dann Leihen/Kaufen
export const OFFER_GROUPS = [
  { key: 'free',   label: 'Free',   from: ['free', 'ads'] },
  { key: 'stream', label: 'Stream', from: ['flatrate'] },
  { key: 'rent',   label: 'Rent',   from: ['rent'] },
  { key: 'buy',    label: 'Buy',    from: ['buy'] },
]

const byPriority = (a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999)

/**
 * Macht aus einem TMDB-Watch-Providers-Eintrag (eine Region) die Gruppen für die Anzeige.
 * Anbieter, die einen Titel kostenlos zeigen, tauchen nicht nochmal unter „Stream“ auf.
 * @param entry  results[REGION] aus /movie|tv/{id}/watch/providers
 * @returns      [{ key, label, providers: [{ provider_id, provider_name, logo_path }] }]
 */
export function groupOffers(entry) {
  if (!entry) return []
  const freeIds = new Set()
  return OFFER_GROUPS.map(g => {
    const seen = new Set()
    const providers = g.from
      .flatMap(k => entry[k] || [])
      .sort(byPriority)
      .filter(p => {
        if (seen.has(p.provider_id)) return false
        if (g.key === 'stream' && freeIds.has(p.provider_id)) return false
        seen.add(p.provider_id)
        if (g.key === 'free') freeIds.add(p.provider_id)
        return true
      })
    return { key: g.key, label: g.label, providers }
  }).filter(g => g.providers.length > 0)
}
