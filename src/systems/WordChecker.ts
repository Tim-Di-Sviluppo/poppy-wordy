// ================================================================
//  WordChecker.ts – Finds valid Italian words in the bubble grid
//  ──────────────────────────────────────────────────────────────
//  Algorithm: DFS from the newly-placed bubble, exploring all 6
//  hex neighbours recursively. Each bubble is visited at most once
//  per path. Paths that form a dictionary word are returned.
//
//  Optimisations vs. the original array-based checker:
//   • hasPrefix() prunes DFS branches that can never form a word
//   • hasWord()   is O(1) via Set lookup (ItalianDictionary)
//   • MAX_WORD_LEN is driven by WORD_RULES.maxLength (gameConfig)
//
//  Complexity: O(B × 6^min(L,grid)) where B = placed bubbles,
//              L = WORD_RULES.maxLength (pruned by prefix lookup).
// ================================================================

import { Bubble }            from '../objects/Bubble';
import { BubblePool }        from './BubblePool';
import { getNeighbors }      from './HexGrid';
import { GRID, WORD_RULES }  from '../config/gameConfig';
import { ItalianDictionary } from './ItalianDictionary';

export interface WordMatch {
  /** The matched word (uppercase). */
  word: string;
  /** The sequence of bubbles that spell the word, in order. */
  bubbles: Bubble[];
}

export class WordChecker {
  private pool:       BubblePool;
  private dictionary: ItalianDictionary;

  // DFS state (reset per search)
  private visited     = new Set<Bubble>();
  private path:         Bubble[] = [];
  private currentWord = '';

  constructor(pool: BubblePool, dictionary: ItalianDictionary) {
    this.pool       = pool;
    this.dictionary = dictionary;
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Searches the full grid for any valid word.
   * Use after placing a bubble; returns all current matches.
   */
  findAllWords(): WordMatch[] {
    const found = new Map<string, WordMatch>();
    for (const bubble of this.pool.getAll()) {
      this.visited     = new Set();
      this.path        = [];
      this.currentWord = '';
      this.dfs(bubble, found);
    }
    return Array.from(found.values());
  }

  /**
   * Searches for words reachable from a specific starting bubble.
   * More efficient than findAllWords — use after each bubble placement.
   *
   * Still finds all words that PASS THROUGH the given bubble, not just
   * words starting at it, because we also run DFS from neighbours.
   */
  findWordsNear(startBubble: Bubble): WordMatch[] {
    const found = new Map<string, WordMatch>();

    const seeds: Bubble[] = [startBubble];
    if (startBubble.gridCoord) {
      for (const nb of getNeighbors(startBubble.gridCoord, GRID.maxRows)) {
        const b = this.pool.get(nb);
        if (b && b.state === 'placed') seeds.push(b);
      }
    }

    for (const seed of seeds) {
      this.visited     = new Set();
      this.path        = [];
      this.currentWord = '';
      this.dfs(seed, found);
    }
    return Array.from(found.values());
  }

  // ── DFS ─────────────────────────────────────────────────────

  private dfs(current: Bubble, found: Map<string, WordMatch>): void {
    if (current.state !== 'placed') return;

    this.visited.add(current);
    this.path.push(current);
    this.currentWord += current.letter;   // letters are already uppercase

    const len = this.currentWord.length;

    // ── Prefix pruning ─────────────────────────────────────────
    // If no dictionary word starts with this prefix, backtrack immediately.
    if (!this.dictionary.hasPrefix(this.currentWord)) {
      this.visited.delete(current);
      this.path.pop();
      this.currentWord = this.currentWord.slice(0, -1);
      return;
    }

    // ── Word check ─────────────────────────────────────────────
    // hasWord is case-insensitive and enforces minLength internally.
    if (len >= WORD_RULES.minLength && this.dictionary.hasWord(this.currentWord)) {
      if (!found.has(this.currentWord)) {
        found.set(this.currentWord, {
          word:    this.currentWord,
          bubbles: [...this.path],
        });
      }
    }

    // ── Recurse ────────────────────────────────────────────────
    if (len < WORD_RULES.maxLength && current.gridCoord) {
      for (const nbCoord of getNeighbors(current.gridCoord, GRID.maxRows)) {
        const nb = this.pool.get(nbCoord);
        if (nb && !this.visited.has(nb) && nb.state === 'placed') {
          this.dfs(nb, found);
        }
      }
    }

    // ── Backtrack ──────────────────────────────────────────────
    this.visited.delete(current);
    this.path.pop();
    this.currentWord = this.currentWord.slice(0, -1);
  }
}
