// Search normalization. Text and queries are folded to a Latin "skeleton":
// lower-case, Bulgarian Cyrillic transliterated, accents removed, "y" read as
// "i", repeated letters collapsed. So "sirene" finds "сирене", "nutela" finds
// "Nutella", and both "chay" and "chai" find "чай".

const BG: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
  к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
  ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sht', ъ: 'a', ь: 'y', ю: 'yu', я: 'ya',
  ё: 'yo', ы: 'y', э: 'e',
};

export function fold(s: string): string {
  // Transliterate before stripping marks: NFD would turn "й" into "и" + breve.
  let out = '';
  for (const ch of s.toLowerCase().normalize('NFC')) out += BG[ch] ?? ch;
  return out
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/y/g, 'i')
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
