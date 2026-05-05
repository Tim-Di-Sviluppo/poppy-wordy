// ================================================================
//  Physics.ts – Updates a flying bubble each frame
//  ──────────────────────────────────────────────────────────────
//  Call Physics.update() in GameScene.update() every frame.
//  Returns a CollisionResult when the bubble should stop.
//
//  ── TUNING GUIDE ───────────────────────────────────────────────
//  All constants that affect feel are in gameConfig.ts → PHYSICS:
//    launchSpeed        → overall bubble speed
//    wallBounceFactor   → 1.0 = elastic, <1 = damped
//  Internal:
//    COLLISION_DIST     → tweak snap sensitivity (default = diameter)
// ================================================================

import { GRID, PHYSICS, HEX_ROW_HEIGHT } from '../config/gameConfig';
import { Bubble } from '../objects/Bubble';
import { BubblePool } from './BubblePool';
import { worldToHex, findSnapCell, HexCoord, WALL_LEFT, WALL_RIGHT } from './HexGrid';

/**
 * Returned when the flying bubble should stop and snap to the grid.
 * snapCoord is null only if no valid snap cell was found.
 */
export interface CollisionResult {
  type: 'ceiling' | 'bubble';
  snapCoord: HexCoord | null;
}

/**
 * Distance threshold for bubble-bubble collision detection.
 * Two bubble centres collide when their distance < COLLISION_DIST.
 *
 * ── PHYSICS TUNING POINT ─────────────────────────────────────────
 * Increase to make snap happen earlier (more forgiving).
 * Decrease to require more precise hits.
 */
const COLLISION_DIST = GRID.bubbleRadius * 1.95;

export class Physics {
  /**
   * Advances the flying bubble by delta time and checks for collisions.
   *
   * @param bubble   The bubble currently in flight
   * @param deltaMs  Frame delta time in milliseconds (from Phaser update)
   * @param pool     All placed bubbles (for collision detection)
   * @returns        CollisionResult if bubble should stop, null otherwise
   */
  static update(
    bubble: Bubble,
    deltaMs: number,
    pool: BubblePool,
  ): CollisionResult | null {
    const dt = deltaMs / 1000; // ms → seconds for Euler integration

    // ── Apply Curve (Magnus effect) ───────────────────────────────
    if (bubble.spin && bubble.spin !== 0) {
      const speed = Math.sqrt(bubble.vx * bubble.vx + bubble.vy * bubble.vy);
      if (speed > 0) {
        // Orthogonal vector scaled by spin and curveForce
        const perpX = -bubble.vy / speed;
        const perpY = bubble.vx / speed;
        bubble.vx += perpX * bubble.spin * PHYSICS.curveForce * dt;
        bubble.vy += perpY * bubble.spin * PHYSICS.curveForce * dt;
      }
    }

    // ── Move bubble ──────────────────────────────────────────────
    bubble.x += bubble.vx * dt;
    bubble.y += bubble.vy * dt;

    // ── Wall bounce (left and right) ─────────────────────────────
    // ── PHYSICS TUNING POINT ─────────────────────────────────────
    // wallBounceFactor controls energy loss on each wall hit.
    // At 1.0, the horizontal speed is perfectly preserved.
    if (bubble.x < WALL_LEFT) {
      bubble.x = 2 * WALL_LEFT - bubble.x;          // reflect position
      bubble.vx = Math.abs(bubble.vx) * PHYSICS.wallBounceFactor;
    } else if (bubble.x > WALL_RIGHT) {
      bubble.x = 2 * WALL_RIGHT - bubble.x;
      bubble.vx = -Math.abs(bubble.vx) * PHYSICS.wallBounceFactor;
    }

    // ── Bubble–bubble collision ───────────────────────────────────
    for (const placed of pool.getValues()) {
      if (placed.state !== 'placed') continue;

      const dx = bubble.x - placed.x;
      const dy = bubble.y - placed.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < COLLISION_DIST * COLLISION_DIST) {
        const hitCoord = placed.gridCoord;
        if (!hitCoord) continue;

        const snapCoord = findSnapCell(
          bubble.x,
          bubble.y,
          hitCoord,
          c => pool.isEmpty(c),
        );
        return { type: 'bubble', snapCoord };
      }
    }

    // ── Ceiling collision ─────────────────────────────────────────
    const ceilingY = GRID.topPadding + GRID.bubbleRadius;
    if (bubble.y <= ceilingY) {
      bubble.y = ceilingY;
      const hitCoord = worldToHex(bubble.x, GRID.topPadding);
      let snapCoord: HexCoord | null = hitCoord;

      // If the ceiling cell is occupied, find an adjacent empty one
      if (!pool.isEmpty(hitCoord)) {
        snapCoord = findSnapCell(bubble.x, bubble.y, hitCoord, c => pool.isEmpty(c));
      }
      return { type: 'ceiling', snapCoord };
    }

    return null; // still flying
  }
}
