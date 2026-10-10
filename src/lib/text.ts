// Search normalization. Text and queries are folded to a Latin "skeleton":
// lower-case, accents removed, Bulgarian Cyrillic transliterated, repeated
// letters collapsed. So "sirene" finds "сирене" and "nutela" finds "Nutella".

const BG: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
  ё: 'yo', ы: 'y', э: 'e',
};

export function fold(s: string): string {
  const lower = s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  let out = '';
  for (const ch of lower) out += BG[ch] ?? ch;
  return out
    .replace(/[^a-z0-9%]+/g, ' ')
    .replace(/([a-z])\1+/g, '$1')
    .trim();
}

export function tokens(query: string): string[] {
  return fold(query).split(' ').filter(Boolean);
}

/** True when every query token occurs somewhere in the folded haystack. */
export function matchesTokens(hay: string, toks: string[]): boolean {
  for (const t of toks) if (!hay.includes(t)) return false;
  return true;
}
