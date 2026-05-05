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

    // Circle background
    // Rounded Square background
    this.circle = scene.add.graphics();
    this.renderCircle(false);
    this.add(this.circle);

    // Letter label
    this.label = scene.add.text(0, 1, this.letter, {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: `${Math.round(GRID.bubbleRadius * 1.0)}px`,
      fontStyle: '700',
      color: COLOURS.letterColour,
      resolution: Math.max(2, window.devicePixelRatio || 2),
    }).setOrigin(0.5, 0.5);
    this.add(this.label);

    scene.add.existing(this);
  }

  // ── Visual State ──────────────────────────────────────────────

  /**
   * Highlights the bubble (used for the launcher bubble).
   */
  setHighlight(on: boolean): void {
    this.renderCircle(on);
  }

  private renderCircle(highlight: boolean): void {
    const r = GRID.bubbleRadius;
    const size = r * 2 - 2;

    this.circle.clear();

    if (highlight) {
      // Primary Glow
      this.circle.fillStyle(COLOURS.primary, 0.15);
      this.circle.fillCircle(0, 0, r + 6);
    } else {
      // Soft Ambient Shadow
      this.circle.fillStyle(0x1a1c1b, 0.06);
      this.circle.fillCircle(1, 4, r);
    }

    // Main fill
    let fillColour: number;
    if (highlight) {
      fillColour = COLOURS.bubbleHighlight;
    } else {
      const isVowel = /^[AEIOU]$/.test(this.letter);
      fillColour = isVowel ? COLOURS.bubbleVocal : COLOURS.bubbleConsonant;
    }

    this.circle.fillStyle(fillColour, 1);
    this.circle.fillCircle(0, 0, r - 1);

    // Subtle tonal border
    this.circle.lineStyle(1.5, COLOURS.bubbleBorder, 0.6);
    this.circle.strokeCircle(0, 0, r - 1);

    // Tiny top highlight for tactile feel (adapted for circle)
    this.circle.fillStyle(0xffffff, 0.25);
    this.circle.fillRoundedRect(-size / 2 + 8, -r + 3, size - 16, 6, 3);
  }

  // ── Animations ────────────────────────────────────────────────

  /**
   * Plays the "pop" animation when part of a found word.
   */
  pop(delay = 0): void {
    this.state = 'dead';
    this.scene.tweens.add({
      targets: this,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      delay,
      duration: 250,
      ease: 'Back.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Highlights the bubble Sunny Yellow (achievements), then pops it.
   */
  highlightWord(delay = 0): void {
    this.state = 'dead';
    this.scene.time.delayedCall(delay, () => {
      if (!this.scene) return;

      const r = GRID.bubbleRadius;

      this.circle.clear();
      // Sunny Yellow Flash
      this.circle.fillStyle(COLOURS.tertiary, 1);
      this.circle.fillCircle(0, 0, r - 1);
      this.circle.lineStyle(2, 0x574500, 0.8);
      this.circle.strokeCircle(0, 0, r - 1);

      this.label.setColor('#ffffff');

      this.scene.tweens.add({
        targets: this,
        scaleX: 1.10,
        scaleY: 1.10,
        duration: 100,
        yoyo: false,
        ease: 'Sine.easeOut',
        onComplete: () => this.pop(80),
      });
    });
  }

  /**
   * Plays the "float away" animation for isolated bubbles
   * (not connected to the ceiling after a word is cleared).
   */
  floatAway(delay = 0): void {
    this.state = 'dead';
    this.scene.tweens.add({
      targets: this,
      y: this.y - 100,
      alpha: 0,
      delay,
      duration: 380,
      ease: 'Cubic.easeIn',
      onComplete: () => this.destroy(),
    });
  }

  /**
   * Small squash-and-stretch bounce when a bubble snaps into place.
   */
  bounceImpact(): void {
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.22,
      scaleY: 0.80,
      duration: 70,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }
}
