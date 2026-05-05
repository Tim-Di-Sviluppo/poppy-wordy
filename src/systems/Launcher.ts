// ================================================================
//  Launcher.ts – Handles drag interaction and curveball flick
//  ──────────────────────────────────────────────────────────────
//  Drag the bubble to flick it. Spinning the drag creates curve.
// ================================================================

import Phaser from 'phaser';
import {
  GRID, PHYSICS, LAUNCHER, COLOURS, CANVAS_WIDTH, CANVAS_HEIGHT
} from '../config/gameConfig';
import { Bubble } from '../objects/Bubble';

export type LaunchCallback = (vx: number, vy: number, spin: number) => void;

interface PointHistory {
  x: number;
  y: number;
  time: number;
}

export class Launcher {
  private scene: Phaser.Scene;
  private onLaunch: LaunchCallback;

  // ── Launcher anchor position ──────────────────────────────────
  readonly x: number;
  readonly y: number;

  // ── Displayed bubbles ─────────────────────────────────────────
  private currentBubble: Bubble;
  private nextBubble: Bubble;

  // ── Visuals ───────────────────────────────────────────────────
  private launcherRing: Phaser.GameObjects.Graphics;

  // ── Next-bubble offset ────────────────────────────────────────
  private readonly NEXT_X_OFFSET = 68;
  private readonly NEXT_SCALE = 0.68;

  // ── Input state ───────────────────────────────────────────────
  private isDragging = false;
  private pointerHistory: PointHistory[] = [];
  private accumulatedSpin = 0;
  public canShoot = true;

  constructor(
    scene: Phaser.Scene,
    currentBubble: Bubble,
    nextBubble: Bubble,
    onLaunch: LaunchCallback,
  ) {
    this.scene = scene;
    this.onLaunch = onLaunch;
    this.currentBubble = currentBubble;
    this.nextBubble = nextBubble;

    // Fixed launcher position (bottom-centre)
    this.x = CANVAS_WIDTH / 2;
    this.y = scene.scale.height - 92;

    this.launcherRing = scene.add.graphics().setDepth(4);

    this.placeBubbles();
    this.drawLauncherRing();
    this.registerInput();
  }

  // ── Bubble Positioning ────────────────────────────────────────

  private placeBubbles(): void {
    this.currentBubble
      .setPosition(this.x, this.y)
      .setScale(1)
      .setDepth(6);
    this.currentBubble.setHighlight(true);
    this.currentBubble.angle = 0;

    this.nextBubble
      .setPosition(this.x + this.NEXT_X_OFFSET, this.y)
      .setScale(this.NEXT_SCALE)
      .setDepth(5);
    this.nextBubble.setHighlight(false);
  }

  private drawLauncherRing(): void {
    this.launcherRing.clear();
    const r = GRID.bubbleRadius + 12;
    // Ambient Outer Ring
    this.launcherRing.lineStyle(2, COLOURS.launcherRing, 0.25);
    this.launcherRing.strokeCircle(this.x, this.y, r);
    // Subtle Inner Ring
    this.launcherRing.lineStyle(1, COLOURS.launcherRing, 0.1);
    this.launcherRing.strokeCircle(this.x, this.y, r - 6);
  }

  // ── Input ─────────────────────────────────────────────────────

  private registerInput(): void {
    this.scene.input.on('pointerdown', this.handleDown, this);
    this.scene.input.on('pointermove', this.handleMove, this);
    this.scene.input.on('pointerup',   this.handleUp,   this);
  }

  private handleDown(p: Phaser.Input.Pointer): void {
    if (!this.canShoot) return;
    
    // Check if pointer is near the launcher bubble
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    if (dx * dx + dy * dy < GRID.bubbleRadius * GRID.bubbleRadius * 2.5) {
      this.isDragging = true;
      this.pointerHistory = [{ x: p.x, y: p.y, time: p.time }];
      this.accumulatedSpin = 0;
    }
  }

  private handleMove(p: Phaser.Input.Pointer): void {
    if (!this.isDragging || !this.canShoot) return;
    
    // Move the current bubble visually following finger
    this.currentBubble.setPosition(p.x, p.y);
    
    this.pointerHistory.push({ x: p.x, y: p.y, time: p.time });
    
    // Clean old history
    const cutoff = p.time - LAUNCHER.dragHistoryTime;
    this.pointerHistory = this.pointerHistory.filter(pt => pt.time >= cutoff);

    // Calculate spin (angular movement)
    this.calculateSpin();
    
    // Apply visual rotation to the bubble based on spin to show it is loaded
    this.currentBubble.angle += this.accumulatedSpin * 15;
  }
  
  private calculateSpin(): void {
    if (this.pointerHistory.length < 3) return;
    
    let totalCross = 0;
    for (let i = 0; i < this.pointerHistory.length - 2; i++) {
        const p1 = this.pointerHistory[i];
        const p2 = this.pointerHistory[i+1];
        const p3 = this.pointerHistory[i+2];
        
        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p2.x;
        const v2y = p3.y - p2.y;
        
        // Positive cross = right spin, Negative cross = left spin
        totalCross += (v1x * v2y - v1y * v2x);
    }
    
    // Accumulate spin
    const spinDelta = totalCross * 0.0003; 
    this.accumulatedSpin = Phaser.Math.Clamp(this.accumulatedSpin + spinDelta, -1, 1);
    
    // Decay spin gracefully if user stops swirling
    this.accumulatedSpin *= 0.98;
  }

  private handleUp(p: Phaser.Input.Pointer): void {
    if (!this.isDragging || !this.canShoot) return;
    this.isDragging = false;
    
    this.pointerHistory.push({ x: p.x, y: p.y, time: p.time });
    
    const cutoff = Math.max(0, p.time - LAUNCHER.dragHistoryTime);
    const recent = this.pointerHistory.filter(pt => pt.time >= cutoff);
    
    if (recent.length < 2) {
       this.resetLauncher();
       return;
    }
    
    const oldest = recent[0];
    const newest = recent[recent.length - 1];
    
    const dx = newest.x - oldest.x;
    const dy = newest.y - oldest.y;
    const dt = newest.time - oldest.time;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    // Only launch if dragged up (dy < 0) and crossed the minimum aim distance
    if (dy >= 0 || distance < PHYSICS.minAimDistance) {
       this.resetLauncher();
       return;
    }
    
    // Prevent divide by zero
    const safeDt = Math.max(16, dt); // Cap minimum time to ~1 frame equivalent to prevent infinite speed
    
    // Flick Velocity calculation: velocity = distance / time
    let speed = (distance / safeDt) * 1000 * PHYSICS.flickScalar;
    // Cap minimal and maximal bounds
    speed = Phaser.Math.Clamp(speed, PHYSICS.minLaunchSpeed, PHYSICS.maxLaunchSpeed);
    
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;
    
    this.onLaunch(vx, vy, this.accumulatedSpin);
  }

  private resetLauncher(): void {
      // Snap bubble back to start if drag was cancelled or invalid
      this.scene.tweens.add({
        targets: this.currentBubble,
        x: this.x,
        y: this.y,
        angle: 0,
        duration: 150,
        ease: 'Back.easeOut'
      });
      this.accumulatedSpin = 0;
  }

  // ── Bubble Advance ────────────────────────────────────────────

  advance(newCurrent: Bubble, newNext: Bubble): void {
    this.currentBubble = newCurrent;
    this.nextBubble = newNext;
    this.placeBubbles();
    this.accumulatedSpin = 0;

    this.currentBubble.setScale(0.7);
    this.scene.tweens.add({
      targets: this.currentBubble,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.easeOut',
    });
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.handleDown, this);
    this.scene.input.off('pointermove', this.handleMove, this);
    this.scene.input.off('pointerup',   this.handleUp,   this);
    this.launcherRing.destroy();
  }
}
