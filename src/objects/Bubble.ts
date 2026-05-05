// ================================================================
//  Bubble.ts – The core game object: a letter-bearing bubble
//  ──────────────────────────────────────────────────────────────
//  Extends Phaser.GameObjects.Container so it can hold both
//  a Graphics circle and a Text label as children.
// ================================================================

import Phaser from 'phaser';
import { GRID, COLOURS } from '../config/gameConfig';
import { HexCoord } from '../systems/HexGrid';

export type BubbleState = 'placed' | 'flying' | 'dead';

export class Bubble extends Phaser.GameObjects.Container {
  // ── Public state ──────────────────────────────────────────────

  /** Letter this bubble carries (uppercase). */
  public letter: string;

  /** Grid coordinate when placed; null while flying. */
  public gridCoord: HexCoord | null = null;

  /** Lifecycle state of this bubble. */
  public state: BubbleState = 'placed';

  /** Velocity components (px/s). Used only in 'flying' state. */
  public vx = 0;
  public vy = 0;

  /** Spin applied to the bubble (from -1 to 1). Used to curve the shot. */
  public spin = 0;

  // ── Private children ──────────────────────────────────────────
  private circle: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, letter: string) {
    super(scene, x, y);

    this.letter = letter.toUpperCase();

    this.circle = scene.add.graphics();
    this.renderCircle(false);
    this.add(this.circle);

    // Letter label – slightly smaller than radius for better fit
    this.label = scene.add.text(0, 0, this.letter, {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: `${Math.round(GRID.bubbleRadius * 0.9)}px`,
      fontStyle: '700',
      color: '#1a3d2e',
      resolution: Math.max(2, window.devicePixelRatio || 2),
    }).setOrigin(0.5, 0.5);
    this.add(this.label);

    scene.add.existing(this);
  }

  // ── Visual State ──────────────────────────────────────────────

  setHighlight(on: boolean): void {
    this.renderCircle(on);
    this.label.setColor(on ? '#ffffff' : '#0f2d1e');
  }

  private renderCircle(highlight: boolean): void {
    const r = GRID.bubbleRadius;
    this.circle.clear();

    // ── 0. Outer glow (highlight only) ────────────────────────────
    if (highlight) {
      this.circle.fillStyle(0x00c97a, 0.22);
      this.circle.fillCircle(0, 0, r + 9);
      this.circle.fillStyle(0x00c97a, 0.10);
      this.circle.fillCircle(0, 0, r + 14);
    }

    // ── 1. Drop shadow ─────────────────────────────────────────────
    this.circle.fillStyle(0x000000, highlight ? 0.10 : 0.14);
    this.circle.fillCircle(0.5, 3, r - 1);

    // ── 2. Glass body — ultra-transparent, almost colourless ───────
    //    iOS liquid glass is essentially invisible at the centre,
    //    with colour only at the frosted rim.
    const bodyTint = highlight ? 0x007a48 : 0xd4f4e4;
    const bodyAlpha = highlight ? 0.82 : 0.18;
    this.circle.fillStyle(bodyTint, bodyAlpha);
    this.circle.fillCircle(0, 0, r - 1);

    // ── 3. Inner depth layer — simulate frosted-glass translucency ─
    //    A slightly lighter fill in the centre creates perceived depth
    if (!highlight) {
      this.circle.fillStyle(0xffffff, 0.22);
      this.circle.fillCircle(-r * 0.08, -r * 0.06, r * 0.72);

      // Very subtle inner-shadow ring just inside the rim (dark crescent)
      this.circle.lineStyle(2.5, 0x000000, 0.07);
      this.circle.strokeCircle(0, 0, r - 2.5);
    }

    // ── 4. Luminous rim — the signature iOS liquid glass bright edge ─
    //    Top half brighter, bottom half dimmer (wrap-around light)
    const rimColour = highlight ? 0xffffff : 0xffffff;
    const rimAlpha  = highlight ? 0.95 : 0.80;
    this.circle.lineStyle(1.5, rimColour, rimAlpha);
    this.circle.strokeCircle(0, 0, r - 1);

    // ── 5. Primary specular — large soft oval, upper-left ──────────
    //    This is the main "glass convex lens" reflection
    this.circle.fillStyle(0xffffff, 0.68);
    this.circle.fillEllipse(-r * 0.22, -r * 0.40, r * 0.58, r * 0.28);

    // ── 6. Secondary specular — smaller softer blob ─────────────────
    this.circle.fillStyle(0xffffff, 0.40);
    this.circle.fillEllipse(-r * 0.30, -r * 0.30, r * 0.30, r * 0.14);

    // ── 7. Specular hot-spot — tiny bright point ───────────────────
    this.circle.fillStyle(0xffffff, 0.95);
    this.circle.fillCircle(-r * 0.20, -r * 0.50, r * 0.065);

    // ── 8. Bottom rim gleam — thin crescent at base ────────────────
    //    The secondary light source reflected from below
    this.circle.fillStyle(0xffffff, 0.18);
    this.circle.fillEllipse(r * 0.12, r * 0.62, r * 0.48, r * 0.14);

    // ── 9. Inner fresnel tint ring — coloured rim glow ─────────────
    //    Gives it the subtle chromatic "soap film" iridescence
    if (!highlight) {
      this.circle.lineStyle(1.2, 0x86e8b8, 0.45);
      this.circle.strokeCircle(0, r * 0.10, r * 0.82);
    }
  }

  // ── Animations ────────────────────────────────────────────────

  /**
   * Satisfying snap-in animation when a bubble lands on the grid.
   * Two-stage: quick squash into position, then a springy settle.
   */
  bounceImpact(): void {
    this.scene.tweens.chain({
      targets: this,
      tweens: [
        {
          scaleX: 1.30,
          scaleY: 0.72,
          duration: 55,
          ease: 'Sine.easeOut',
        },
        {
          scaleX: 0.88,
          scaleY: 1.18,
          duration: 70,
          ease: 'Sine.easeInOut',
        },
        {
          scaleX: 1.07,
          scaleY: 0.94,
          duration: 55,
          ease: 'Sine.easeInOut',
        },
        {
          scaleX: 1.0,
          scaleY: 1.0,
          duration: 40,
          ease: 'Linear',
        },
      ],
    });
  }

  /**
   * Highlights the bubble in Sunny Yellow, then triggers a burst pop.
   */
  highlightWord(delay = 0): void {
    this.state = 'dead';
    this.scene.time.delayedCall(delay, () => {
      if (!this.scene) return;

      const r = GRID.bubbleRadius;

      // Flash yellow
      this.circle.clear();
      this.circle.fillStyle(COLOURS.tertiaryContainer, 1);
      this.circle.fillCircle(0, 0, r - 1);
      this.circle.lineStyle(2, COLOURS.tertiary, 0.9);
      this.circle.strokeCircle(0, 0, r - 1);
      this.circle.fillStyle(0xffffff, 0.55);
      this.circle.fillEllipse(-r * 0.28, -r * 0.38, r * 0.55, r * 0.26);
      this.label.setColor('#4a3500');

      // Inflate then burst
      this.scene.tweens.chain({
        targets: this,
        tweens: [
          { scaleX: 1.25, scaleY: 1.25, duration: 90, ease: 'Sine.easeOut' },
          { scaleX: 0, scaleY: 0, duration: 0, ease: 'Linear',
            onComplete: () => this._spawnBurstParticles() },
        ],
      });
    });
  }

  /**
   * Plays the burst effect: emits expanding translucent rings.
   * Called automatically by highlightWord.
   */
  private _spawnBurstParticles(): void {
    if (!this.scene) return;
    const r = GRID.bubbleRadius;
    const wx = this.x;
    const wy = this.y;

    // Three expanding ring "shards"
    for (let i = 0; i < 3; i++) {
      const ring = this.scene.add.graphics();
      ring.lineStyle(2, 0xf7ce48, 1 - i * 0.25);
      ring.strokeCircle(0, 0, r * 0.5);
      ring.setPosition(wx, wy);
      ring.setDepth(10);

      this.scene.tweens.add({
        targets: ring,
        scaleX: 1 + i * 0.6 + 1.2,
        scaleY: 1 + i * 0.6 + 1.2,
        alpha: 0,
        delay: i * 35,
        duration: 280,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.destroy(),
      });
    }

    // Small white flash circle
    const flash = this.scene.add.graphics();
    flash.fillStyle(0xffffff, 0.7);
    flash.fillCircle(0, 0, r * 0.85);
    flash.setPosition(wx, wy);
    flash.setDepth(11);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 160,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });

    this.destroy();
  }

  /**
   * Silent pop — used for non-word-match removal.
   */
  pop(delay = 0): void {
    this.state = 'dead';
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      delay,
      duration: 200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (this.scene) this._spawnBurstParticles();
        else this.destroy();
      },
    });
  }

  /**
   * Float away animation for isolated bubbles.
   */
  floatAway(delay = 0): void {
    this.state = 'dead';
    this.scene.tweens.add({
      targets: this,
      y: this.y - 120,
      alpha: 0,
      scaleX: 0.6,
      scaleY: 0.6,
      delay,
      duration: 420,
      ease: 'Cubic.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}
