// ================================================================
//  BubblePool.ts – Manages the set of all placed bubbles
//  ──────────────────────────────────────────────────────────────
//  Stores bubbles in a Map keyed by "col,row" string.
//  Provides adjacency queries and isolated-bubble detection.
// ================================================================

import { Bubble } from '../objects/Bubble';
import { HexCoord, getNeighbors } from './HexGrid';
import { GRID } from '../config/gameConfig';

type CoordKey = string;

/** Generates the map key for a hex coordinate. */
function key(c: HexCoord): CoordKey {
  return `${c.col},${c.row}`;
}

export class BubblePool {
  private pool: Map<CoordKey, Bubble> = new Map();

  // ── Mutation ─────────────────────────────────────────────────

  /** Place a bubble at the given grid coord. */
  add(coord: HexCoord, bubble: Bubble): void {
    bubble.gridCoord = coord;
    this.pool.set(key(coord), bubble);
  }

  /** Remove the bubble at a coord (does NOT destroy the Phaser object). */
  remove(coord: HexCoord): void {
    this.pool.delete(key(coord));
  }

  /** Remove a set of bubbles by reference. */
  removeMany(bubbles: Bubble[]): void {
    for (const b of bubbles) {
      if (b.gridCoord) this.pool.delete(key(b.gridCoord));
    }
  }

  // ── Queries ──────────────────────────────────────────────────

  get(coord: HexCoord): Bubble | undefined {
    return this.pool.get(key(coord));
  }

  has(coord: HexCoord): boolean {
    return this.pool.has(key(coord));
  }

  isEmpty(coord: HexCoord): boolean {
    return !this.pool.has(key(coord));
  }

  getAll(): Bubble[] {
    return Array.from(this.pool.values());
  }

  getValues(): IterableIterator<Bubble> {
    return this.pool.values();
  }

  count(): number {
    return this.pool.size;
  }

  // ── Game-state Queries ────────────────────────────────────────

  /**
   * Returns bubbles that are NOT connected to the ceiling (row 0).
   *
   * Algorithm: BFS from all bubbles in row 0.
   * Any bubble not reached is considered isolated / floating.
   *
   * These should be removed (float away) after a word is cleared.
   */
  getIsolatedBubbles(): Bubble[] {
    const connected = new Set<CoordKey>();
    const queue: HexCoord[] = [];

    // Seed BFS from ceiling row
    for (const [k, b] of this.pool) {
      if (b.gridCoord && b.gridCoord.row === 0) {
        queue.push(b.gridCoord);
        connected.add(k);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const nb of getNeighbors(current, GRID.maxRows)) {
        const nk = key(nb);
        if (this.pool.has(nk) && !connected.has(nk)) {
          connected.add(nk);
          queue.push(nb);
        }
      }
    }

    // Collect all bubbles not reached by BFS
    return Array.from(this.pool.values()).filter(b =>
      b.gridCoord && !connected.has(key(b.gridCoord))
    );
  }

  /**
   * Returns the highest row index (largest Y) occupied by any bubble.
   * Used to detect the game-over condition.
   */
  getLowestRow(): number {
    let maxRow = 0;
    for (const b of this.pool.values()) {
      if (b.gridCoord && b.gridCoord.row > maxRow) {
        maxRow = b.gridCoord.row;
      }
    }
    return maxRow;
  }

  /** Clears all bubbles (destroys Phaser objects). */
  clear(): void {
    for (const b of this.pool.values()) b.destroy();
    this.pool.clear();
  }
}
