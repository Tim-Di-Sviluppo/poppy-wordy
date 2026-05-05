// ================================================================
//  HexGrid.ts – Hexagonal grid coordinate utilities
//  ──────────────────────────────────────────────────────────────
//  Uses "offset rows" hex layout:
//    - Even rows start at leftMargin
//    - Odd rows are shifted right by bubbleRadius (honeycomb effect)
// ================================================================

import { GRID, HEX_ROW_HEIGHT, CANVAS_WIDTH } from '../config/gameConfig';

/** A position in the hex grid (column, row). */
export interface HexCoord {
  col: number;
  row: number;
}

/** A 2D world position in pixels. */
export interface WorldPos {
  x: number;
  y: number;
}

// ── Coordinate Conversion ────────────────────────────────────────

/**
 * Converts a hex grid coordinate to a world pixel position.
 *
 * Formula:
 *   x = leftMargin + col * diameter + (isOdd ? radius : 0)
 *   y = topPadding + row * rowHeight
 */
export function hexToWorld(coord: HexCoord): WorldPos {
  const diameter = GRID.bubbleRadius * 2;
  const rowOffset = (coord.row % 2 === 1) ? GRID.bubbleRadius : 0;
  return {
    x: GRID.leftMargin + coord.col * diameter + rowOffset,
    y: GRID.topPadding + coord.row * HEX_ROW_HEIGHT,
  };
}

/**
 * Converts a world pixel position to the nearest hex coordinate.
 *
 * Searches all cells in the ±2 row range of the estimated row
 * and returns the one with the smallest Euclidean distance.
 */
export function worldToHex(wx: number, wy: number, maxRows = GRID.maxRows): HexCoord {
  const rawRow = (wy - GRID.topPadding) / HEX_ROW_HEIGHT;
  const rowMin = Math.max(0, Math.floor(rawRow) - 1);
  const rowMax = Math.min(maxRows - 1, Math.ceil(rawRow) + 1);

  let best: HexCoord = { col: 0, row: 0 };
  let bestDistSq = Infinity;

  for (let r = rowMin; r <= rowMax; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const w = hexToWorld({ col: c, row: r });
      const dx = wx - w.x;
      const dy = wy - w.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        best = { col: c, row: r };
      }
    }
  }
  return best;
}

// ── Neighbour Queries ────────────────────────────────────────────

/**
 * Returns up to 6 valid hex neighbours of a given coord.
 *
 * Uses "odd-row offset" convention:
 *   - Even row offset neighbours above/below: col shift = 0 or -1
 *   - Odd  row offset neighbours above/below: col shift = 0 or +1
 */
export function getNeighbors(coord: HexCoord, maxRows = GRID.maxRows): HexCoord[] {
  const { col, row } = coord;
  const isOdd = row % 2 === 1;

  const candidates: HexCoord[] = [
    // Same row
    { col: col - 1, row },
    { col: col + 1, row },
    // Row above
    { col: col + (isOdd ?  0 : -1), row: row - 1 },
    { col: col + (isOdd ?  1 :  0), row: row - 1 },
    // Row below
    { col: col + (isOdd ?  0 : -1), row: row + 1 },
    { col: col + (isOdd ?  1 :  0), row: row + 1 },
  ];

  return candidates.filter(c => {
    const colLimit = (c.row % 2 === 1) ? GRID.cols - 1 : GRID.cols;
    return c.col >= 0 && c.col < colLimit &&
           c.row >= 0 && c.row < maxRows;
  });
}

// ── Snap Utility ────────────────────────────────────────────────

/**
 * Finds the best empty hex cell to snap an incoming bubble into.
 *
 * Strategy:
 *  1. Collect all empty neighbours of the hit cell.
 *  2. Also add the direct world→hex result as a candidate.
 *  3. Return the candidate with the smallest distance to the impact point.
 *
 * @param impactX  World X of the impact point
 * @param impactY  World Y of the impact point
 * @param hitCoord The occupied cell that was hit
 * @param isEmpty  Predicate that returns true if a cell is unoccupied
 */
export function findSnapCell(
  impactX: number,
  impactY: number,
  hitCoord: HexCoord,
  isEmpty: (c: HexCoord) => boolean,
  maxRows = GRID.maxRows,
): HexCoord | null {
  const candidates: HexCoord[] = getNeighbors(hitCoord, maxRows).filter(isEmpty);

  // Also try direct world-to-hex conversion
  const direct = worldToHex(impactX, impactY, maxRows);
  if (isEmpty(direct)) {
    // Add only if not already in list
    const exists = candidates.some(c => c.col === direct.col && c.row === direct.row);
    if (!exists) candidates.push(direct);
  }

  if (candidates.length === 0) return null;

  // Pick candidate closest to impact point
  return candidates.reduce((best, coord) => {
    const w = hexToWorld(coord);
    const dx = impactX - w.x;
    const dy = impactY - w.y;
    const dSq = dx * dx + dy * dy;

    const bw = hexToWorld(best);
    const bdx = impactX - bw.x;
    const bdy = impactY - bw.y;
    const bSq = bdx * bdx + bdy * bdy;

    return dSq < bSq ? coord : best;
  });
}

// ── Wall Bounds ─────────────────────────────────────────────────
/** Left wall X that a bubble centre cannot cross. */
export const WALL_LEFT  = GRID.leftMargin + GRID.bubbleRadius;

/** Right wall X that a bubble centre cannot cross. */
export const WALL_RIGHT = CANVAS_WIDTH - GRID.leftMargin - GRID.bubbleRadius;
