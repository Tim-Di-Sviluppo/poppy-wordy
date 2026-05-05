// ================================================================
//  ItalianDictionary.ts  –  Runtime dictionary wrapper
//  ──────────────────────────────────────────────────────────────
//  Decodes the binary "ITWD" file produced by build-dawg.mjs and
//  exposes two O(1)/O(log N) lookup methods used by WordChecker:
//
//    hasWord(word)   – O(1) via Set
//    hasPrefix(pfx)  – O(log N) via binary-search on sorted array
//
//  The binary file uses prefix-delta encoding (sorted word list)
//  which is typically 30-50 % smaller than a plain text file.
// ================================================================

const MAGIC = 'ITWD';
const MIN_LENGTH = 3;

export class ItalianDictionary {
  /** Sorted uppercase word array – used for hasPrefix binary search. */
  private sorted: string[];
  /** Set of uppercase words – O(1) hasWord lookup. */
  private wordSet: Set<string>;

  constructor(sorted: string[], wordSet: Set<string>) {
    this.sorted  = sorted;
    this.wordSet = wordSet;
  }

  get size(): number {
    return this.wordSet.size;
  }

  /**
   * Returns true if `word` is a valid Italian word.
   * Case-insensitive; ignores strings shorter than MIN_LENGTH.
   */
  hasWord(word: string): boolean {
    if (word.length < MIN_LENGTH) return false;
    return this.wordSet.has(word.toUpperCase());
  }

  /**
   * Returns true if at least one dictionary word starts with `prefix`.
   * Used by WordChecker to prune DFS branches early.
   * O(log N) binary search.
   */
  hasPrefix(prefix: string): boolean {
    if (prefix.length === 0) return true;
    const p   = prefix.toUpperCase();
    let lo = 0, hi = this.sorted.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sorted[mid] < p) lo = mid + 1;
      else hi = mid - 1;
    }
    return lo < this.sorted.length && this.sorted[lo].startsWith(p);
  }
}

// ── Parser ───────────────────────────────────────────────────────

/**
 * Decodes a binary ITWD buffer (produced by build-dawg.mjs) into
 * an ItalianDictionary instance.
 *
 * Throws if the magic header is missing or the buffer is truncated.
 */
export function parseDictionary(buffer: ArrayBuffer): ItalianDictionary {
  const view  = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Validate magic
  const magic = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (magic !== MAGIC) throw new Error(`Invalid dictionary magic: "${magic}"`);

  const wordCount  = view.getUint32(4, true);
  // const dataLength = view.getUint32(8, true); // available for validation

  // Decode prefix-delta entries starting at offset 12
  let offset = 12;
  let prev   = '';
  const sorted: string[] = [];

  for (let i = 0; i < wordCount; i++) {
    const keep = bytes[offset++];
    const add  = bytes[offset++];
    const suffix = String.fromCharCode(...bytes.subarray(offset, offset + add));
    offset += add;
    const word = prev.slice(0, keep) + suffix;
    sorted.push(word);
    prev = word;
  }

  const wordSet = new Set(sorted);
  return new ItalianDictionary(sorted, wordSet);
}

// ── Fallback (used if fetch fails) ───────────────────────────────

/**
 * Minimal in-memory dictionary for graceful degradation when the
 * binary file cannot be loaded (e.g. first-run before build step).
 */
export function createFallbackDictionary(): ItalianDictionary {
  const words: string[] = [
    'CASA','SOLE','MARE','STELLA','ALBERO','FIORE','NUVOLA','ARCOBALENO',
    'SALE','SERA','LUNA','ROSA','RIVA','VINO','LAGO','MELA','PANE','ARIA',
    'LUCE','ANNO','NOTE','NAVE','ONDA','VITA','MANO','GIRO','NOME','PACE',
    'RAME','RAMO','RETE','RISO','RITO','TELA','TEMA','TIRO','TONO','TORO',
    'VELA','VELO','VENA','VERA','VERO','VISO','ERA','ORA','VIA','ALA','ORO',
    'UNO','UNA','UVA','AGO','TORSO','PINOLO','CANE','GATTO','AMICO','CAMPO',
    'CARTA','DENTE','FERRO','FIUME','FORNO','GEMMA','GIOCO','GOMMA','GUSTO',
    'LIBRO','LUOGO','MONTE','MOSCA','MUSEO','MUSICA','NOTTE','OPERA','PARCO',
    'PASTA','PIETRA','PIZZA','PORTA','POSTO','PRIMA','PROVA','PUNTO','RADIO',
    'RAGNO','RATTO','RETE','ROCCA','RUOTA','SALTO','SCENA','SEGNO','SENSO',
    'SERPE','SOGNO','SORTE','SPADA','SPAGO','SPUME','STATO','STIMA','SUONO',
    'TAVOLA','TEMPO','TERRA','TORRE','TRENO','TROVA','VALLE','VENTO','VERDE',
  ].sort();
  const wordSet = new Set(words);
  console.warn('[ItalianDictionary] Using fallback mini-dictionary.');
  return new ItalianDictionary(words, wordSet);
}
