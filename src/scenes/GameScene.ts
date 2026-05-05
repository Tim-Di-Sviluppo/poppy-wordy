// ================================================================
//  GameScene.ts – Main game scene
//  ──────────────────────────────────────────────────────────────
//  Orchestrates: grid initialisation, launcher, physics loop,
//  word detection, animations, score, and game-over.
// ================================================================

import Phaser from 'phaser';
import {
  GRID, CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOURS, LETTER_WEIGHTS, GAME_OVER_Y, GAME_DURATION_SECONDS,
} from '../config/gameConfig';
import { Bubble } from '../objects/Bubble';
import { BubblePool } from '../systems/BubblePool';
import { hexToWorld, HexCoord } from '../systems/HexGrid';
import { Launcher } from '../systems/Launcher';
import { Physics } from '../systems/Physics';
import { WordChecker, WordMatch } from '../systems/WordChecker';
import { parseDictionary, createFallbackDictionary, ItalianDictionary } from '../systems/ItalianDictionary';

// ── Letter Pool ─────────────────────────────────────────────────
/** Builds a weighted letter array for random selection. */
function buildLetterPool(): string[] {
  const pool: string[] = [];
  for (const [letter, weight] of Object.entries(LETTER_WEIGHTS)) {
    const count = Math.max(1, Math.round(weight * 10));
    for (let i = 0; i < count; i++) pool.push(letter);
  }
  return pool;
}

export class GameScene extends Phaser.Scene {
  // ── Systems ───────────────────────────────────────────────────
  private pool!: BubblePool;
  private launcher!: Launcher;
  private wordChecker!: WordChecker;
  private letterPool!: string[];

  // ── Flying bubble ─────────────────────────────────────────────
  private flyingBubble: Bubble | null = null;

  // ── Queued bubbles ────────────────────────────────────────────
  private currentBubble!: Bubble;
  private nextBubble!: Bubble;

  // ── Score & Time ──────────────────────────────────────────────
  private score = 0;
  private timeLeft = GAME_DURATION_SECONDS;
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;

  // ── State flag: prevents input during animations ──────────────
  private isBusy = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Phaser preload: runs before create().
   * Loads the binary dictionary via Phaser's loader so the game
   * waits for it automatically (no async/await gymnastics needed).
   */
  preload(): void {
    const loadText = this.add.text(
      CANVAS_WIDTH / 2, this.scale.height / 2,
      'Caricamento...',
      {
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '20px',
        fontStyle: '600',
        color: COLOURS.hudText,
        resolution: 2,
      },
    ).setOrigin(0.5).setDepth(20);

    this.load.on('complete', () => loadText.destroy());

    // Loads as ArrayBuffer, accessible via this.cache.binary.get('italian-dict')
    this.load.binary('italian-dict', 'dictionaries/it.dawg');
  }

  create(): void {
    // ... (logic remains same)
    let dictionary: ItalianDictionary;
    const buffer = this.cache.binary.get('italian-dict') as ArrayBuffer | null;
    if (buffer) {
      try {
        dictionary = parseDictionary(buffer);
      } catch (e) {
        dictionary = createFallbackDictionary();
      }
    } else {
      dictionary = createFallbackDictionary();
    }

    this.letterPool = buildLetterPool();
    this.pool = new BubblePool();
    this.wordChecker = new WordChecker(this.pool, dictionary);
    this.score = 0;
    this.timeLeft = GAME_DURATION_SECONDS;
    this.isBusy = false;
    this.flyingBubble = null;

    this.drawBackground();
    this.fillInitialGrid();
    this.createHUD();

    // Create the two queued bubbles and hand them to the launcher
    this.currentBubble = this.makeBubble(0, 0, this.randomLetter());
    this.nextBubble = this.makeBubble(0, 0, this.randomLetter());

    this.launcher = new Launcher(
      this,
      this.currentBubble,
      this.nextBubble,
      this.onLaunch.bind(this),
    );

    // Timer setup
    this.time.addEvent({
      delay: 1000,
      callback: this.tickTimer,
      callbackScope: this,
      loop: true,
    });

    // Overlay buttons (HTML)
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.onclick = () => {
        document.getElementById('game-over')?.classList.remove('visible');
        this.scene.restart();
      };
    }

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.onclick = () => {
        document.getElementById('game-over')?.classList.remove('visible');
        this.scene.start('MenuScene');
      };
    }
  }

  update(_time: number, delta: number): void {
    if (!this.flyingBubble) return;

    const result = Physics.update(this.flyingBubble, delta, this.pool);

    if (result) {
      this.handleBubbleLanded(result.snapCoord);
    }
  }

  // ── Background ────────────────────────────────────────────────

  private drawBackground(): void {
    const bg = this.add.graphics().setDepth(0);
    const screenHeight = this.scale.height;

    // Main Light Surface
    this.add.rectangle(0, 0, CANVAS_WIDTH, this.scale.height, 0xf9f9f7).setOrigin(0);

    // Top HUD Bar - subtle tonal difference
    bg.fillStyle(COLOURS.surfaceContainer, 1);
    bg.fillRect(0, 0, CANVAS_WIDTH, 68);

    // Bottom Border of Top Bar
    bg.lineStyle(1, COLOURS.bubbleBorder, 0.4);
    bg.beginPath();
    bg.moveTo(0, 68);
    bg.lineTo(CANVAS_WIDTH, 68);
    bg.strokePath();

    // Launcher Panel at the bottom
    const panelY = screenHeight - 130;
    bg.fillStyle(COLOURS.surfaceContainer, 1);
    bg.fillRect(0, panelY, CANVAS_WIDTH, 130);

    // Top Border of Launcher Panel
    bg.lineStyle(1, COLOURS.bubbleBorder, 0.4);
    bg.beginPath();
    bg.moveTo(0, panelY);
    bg.lineTo(CANVAS_WIDTH, panelY);
    bg.strokePath();

    // Primary Accent Line
    bg.lineStyle(3, COLOURS.primary, 1);
    bg.beginPath();
    bg.moveTo(CANVAS_WIDTH / 2 - 40, panelY);
    bg.lineTo(CANVAS_WIDTH / 2 + 40, panelY);
    bg.strokePath();
  }

  // ── Initial Grid Population ───────────────────────────────────
  // ... (fillInitialGrid remains same)

  private fillInitialGrid(): void {
    for (let row = 0; row < GRID.startRows; row++) {
      const colCount = GRID.cols - (row % 2 === 1 ? 1 : 0);
      for (let col = 0; col < colCount; col++) {
        const coord: HexCoord = { col, row };
        const world = hexToWorld(coord);
        const bubble = this.makeBubble(world.x, world.y, this.randomLetter());
        bubble.state = 'placed';
        this.pool.add(coord, bubble);
      }
    }
  }

  // ── HUD ───────────────────────────────────────────────────────

  private createHUD(): void {
    const labelStyle = {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '13px',
      fontStyle: '700',
      color: COLOURS.hudDim,
      letterSpacing: 1,
      resolution: 2,
    };
    const valueStyle = {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '26px',
      fontStyle: '800',
      color: COLOURS.hudText,
      letterSpacing: -0.5,
      resolution: 2,
    };

    // Score label + value
    this.add.text(24, 14, 'PUNTEGGIO', labelStyle as Phaser.Types.GameObjects.Text.TextStyle).setDepth(10);
    this.scoreText = this.add.text(24, 30, '0', valueStyle as Phaser.Types.GameObjects.Text.TextStyle).setDepth(10);

    // Time label + value
    this.add.text(CANVAS_WIDTH - 24, 14, 'TEMPO', labelStyle as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(1, 0).setDepth(10);
    this.timeText = this.add.text(CANVAS_WIDTH - 24, 30, this.formatTime(this.timeLeft), valueStyle as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(1, 0).setDepth(10);
  }

  private updateHUD(): void {
    this.scoreText.setText(String(this.score));
    this.timeText.setText(this.formatTime(this.timeLeft));
  }

  private formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  private tickTimer(): void {
    if (this.timeLeft <= 0) return;
    this.timeLeft--;
    this.updateHUD();
    if (this.timeLeft <= 0) {
      this.triggerGameOver();
    }
  }

  // ── Launch ────────────────────────────────────────────────────

  /**
   * Called by Launcher when the player releases a valid aim.
   * Creates the flying bubble and locks input until it lands.
   */
  private onLaunch(vx: number, vy: number, spin: number): void {
    if (this.isBusy || this.flyingBubble || this.timeLeft <= 0) return;

    // Convert the current launcher bubble into a flying bubble
    const flying = this.currentBubble;
    flying.state = 'flying';
    flying.vx = vx;
    flying.vy = vy;
    flying.spin = spin;
    flying.setHighlight(false);
    flying.setDepth(8);

    this.flyingBubble = flying;
    this.launcher.canShoot = false;

    // Prepare the new current and next bubbles, advance launcher display
    const newCurrent = this.nextBubble;
    const newNext = this.makeBubble(0, 0, this.randomLetter());
    this.currentBubble = newCurrent;
    this.nextBubble = newNext;
    this.launcher.advance(newCurrent, newNext);
  }

  // ── Bubble Land ───────────────────────────────────────────────

  /**
   * Called when Physics.update detects a collision.
   * Snaps the flying bubble to the grid, then runs word detection.
   */
  private handleBubbleLanded(snapCoord: HexCoord | null): void {
    const flying = this.flyingBubble!;
    this.flyingBubble = null;

    if (!snapCoord) {
      // No valid snap position found – destroy and allow next shot
      flying.pop();
      this.launcher.canShoot = true;
      return;
    }

    // Snap to grid position
    const world = hexToWorld(snapCoord);
    flying.setPosition(world.x, world.y);
    flying.angle = 0; // Fix: reset visual spin rotation
    flying.state = 'placed';
    flying.setDepth(2);
    this.pool.add(snapCoord, flying);
    flying.bounceImpact();

    // Check game-over (bubble landed too low)
    if (world.y > this.scale.height - 130) {
      this.triggerGameOver();
      return;
    }

    // Run word detection near the newly placed bubble
    this.isBusy = true;
    const matches = this.wordChecker.findWordsNear(flying);

    if (matches.length > 0) {
      this.handleMatches(matches);
    } else {
      this.isBusy = false;
      this.launcher.canShoot = true;
    }
  }

  // ── Word Match Handling ───────────────────────────────────────

  /**
   * Processes found word matches:
   * 1. Removes matched bubbles with pop animation
   * 2. Then removes isolated bubbles (float away)
   * 3. Updates score and re-enables shooting
   */
  private handleMatches(matches: WordMatch[]): void {
    // If multiple words found, take the longest one first
    matches.sort((a, b) => b.word.length - a.word.length);
    const best = matches[0];

    // Show word toast in HTML overlay
    this.showWordToast(best.word);

    // Score: base points per letter × word-length bonus
    const basePoints = best.bubbles.length * 10;
    const bonus = best.bubbles.length >= 5 ? best.bubbles.length * 5 : 0;
    this.score += basePoints + bonus;
    this.updateHUD();

    // Remove matched bubbles from pool first
    this.pool.removeMany(best.bubbles);

    // Pop animation → use highlightWord for golden flash cascade
    best.bubbles.forEach((b, i) => b.highlightWord(i * 55));

    // After pop animations finish, handle isolated bubbles
    const popDuration = best.bubbles.length * 40 + 250;
    this.time.delayedCall(popDuration, () => {
      const isolated = this.pool.getIsolatedBubbles();
      this.pool.removeMany(isolated);
      isolated.forEach((b, i) => b.floatAway(i * 30));

      const clearDuration = isolated.length * 30 + 400;
      this.time.delayedCall(clearDuration, () => {
        this.isBusy = false;
        this.launcher.canShoot = true;
      });
    });
  }

  // ── Word Toast ────────────────────────────────────────────────

  private showWordToast(word: string): void {
    const toast = document.getElementById('word-toast');
    if (!toast) return;

    toast.textContent = word;
    toast.classList.add('visible');

    setTimeout(() => toast.classList.remove('visible'), 1400);
  }

  // ── Game Over ─────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.launcher.canShoot = false;
    this.isBusy = true;

    const overlay = document.getElementById('game-over');
    const finalScore = document.getElementById('final-score');
    if (overlay) overlay.classList.add('visible');
    if (finalScore) finalScore.textContent = `Punteggio: ${this.score}`;
  }

  // ── Utilities ─────────────────────────────────────────────────

  /** Creates a Bubble at the given world position. */
  private makeBubble(x: number, y: number, letter: string): Bubble {
    return new Bubble(this, x, y, letter).setDepth(2) as Bubble;
  }

  /** Picks a random letter from the weighted pool. */
  private randomLetter(): string {
    return this.letterPool[Math.floor(Math.random() * this.letterPool.length)];
  }
}
