// ================================================================
//  MenuScene.ts – Home screen
// ================================================================

import Phaser from 'phaser';

const W = 480;
const H = 760;

// Letters of "POPPY WORDY" placed manually across the screen
// Each entry: [letter, x%, y%, fontSize, alpha, tweenDuration, tweenDelay]
const LETTERS: [string, number, number, number, number, number, number][] = [
  ['P',  0.10, 0.12, 72, 0.13, 5200,    0],
  ['O',  0.82, 0.09, 56, 0.10, 6100,  800],
  ['P',  0.22, 0.28, 48, 0.09, 7300, 1600],
  ['P',  0.75, 0.32, 64, 0.12, 5800, 2400],
  ['Y',  0.08, 0.52, 60, 0.11, 6700,  400],
  ['W',  0.88, 0.55, 52, 0.10, 5500, 3200],
  ['O',  0.30, 0.68, 68, 0.13, 6900, 1200],
  ['R',  0.72, 0.72, 48, 0.09, 7100, 2000],
  ['D',  0.15, 0.82, 56, 0.10, 6400,  600],
  ['Y',  0.85, 0.86, 60, 0.12, 5700, 2800],
  // Extra repetitions for density
  ['P',  0.50, 0.14, 44, 0.08, 7800, 3600],
  ['W',  0.42, 0.44, 52, 0.09, 6200, 1800],
  ['O',  0.60, 0.60, 48, 0.08, 6800, 4000],
];

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // ── Background ───────────────────────────────────────────────
    this.add.rectangle(0, 0, W, H, 0xf0f5f2).setOrigin(0).setDepth(0);

    // ── Floating ghost letters ───────────────────────────────────
    for (const [letter, xPct, yPct, size, alpha, dur, delay] of LETTERS) {
      this.createFloatingLetter(letter, W * xPct, H * yPct, size, alpha, dur, delay);
    }

    // ── Header ───────────────────────────────────────────────────
    const headerH = 64;
    const hdr = this.add.graphics().setDepth(5);
    hdr.fillStyle(0x8ee4af, 0.10);
    hdr.fillRect(0, 0, W, headerH);
    hdr.lineStyle(2, 0x86e8b8, 0.30);
    hdr.lineBetween(0, headerH, W, headerH);

    this.add.text(W / 2, headerH / 2, 'Poppy Wordy', {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '24px',
      fontStyle: 'italic',
      color: '#086c42',
      resolution: 2,
    }).setOrigin(0.5).setDepth(6);

    // ── Subtitle ─────────────────────────────────────────────────
    this.add.text(W / 2, 148,
      'Lancia le bolle, forma le parole,\nconquista la griglia!', {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '19px',
      fontStyle: '500',
      color: '#3f4941',
      align: 'center',
      lineSpacing: 6,
      resolution: 2,
    }).setOrigin(0.5).setDepth(6);

    // ── Play Button ───────────────────────────────────────────────
    const playY = 370;
    const playR = 82;
    this.createPlayButton(W / 2, playY, playR);

    // ── Daily Challenge Card ──────────────────────────────────────
    this.createDailyCard(32, 558, W - 64);

    // ── Bottom Navigation ─────────────────────────────────────────
    this.createBottomNav();
  }

  // ── Floating Letters ──────────────────────────────────────────

  private createFloatingLetter(
    letter: string,
    x: number, y: number,
    size: number,
    alpha: number,
    duration: number,
    delay: number,
  ): void {
    const text = this.add.text(x, y, letter, {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: `${size}px`,
      fontStyle: '800',
      color: '#086c42',
      resolution: 2,
    }).setOrigin(0.5).setAlpha(alpha).setDepth(2);

    // Gentle vertical float + very slight rotation
    this.tweens.add({
      targets: text,
      y: y - 18,
      angle: 4,
      duration,
      delay,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Occasional "burst + fade-in" cycle
    this.time.delayedCall(delay + Phaser.Math.Between(4000, 12000), () => {
      this.scheduleBurst(text, x, y, alpha, duration, delay);
    });
  }

  private scheduleBurst(
    text: Phaser.GameObjects.Text,
    x: number, y: number,
    alpha: number,
    duration: number,
    delay: number,
  ): void {
    if (!text.active) return;

    // Pop out
    this.tweens.add({
      targets: text,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0,
      duration: 280,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (!text.active) return;
        text.setScale(1);
        text.setAlpha(0);
        text.setPosition(x, y);

        // Fade back in after a pause
        this.time.delayedCall(300, () => {
          if (!text.active) return;
          this.tweens.add({
            targets: text,
            alpha,
            duration: 600,
            ease: 'Sine.easeIn',
            onComplete: () => {
              // Schedule the next burst
              this.time.delayedCall(
                Phaser.Math.Between(5000, 15000),
                () => this.scheduleBurst(text, x, y, alpha, duration, delay),
              );
            },
          });
        });
      },
    });
  }

  // ── Play Button ──────────────────────────────────────────────

  private createPlayButton(cx: number, cy: number, r: number): void {
    const btn = this.add.container(cx, cy).setDepth(10);

    // Outer glow
    const glow = this.add.graphics();
    glow.fillStyle(0x086c42, 0.10);
    glow.fillCircle(0, 0, r + 20);
    glow.fillStyle(0x086c42, 0.05);
    glow.fillCircle(0, 0, r + 34);
    btn.add(glow);

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.15);
    shadow.fillCircle(2, 7, r - 2);
    btn.add(shadow);

    // Main body
    const body = this.add.graphics();
    body.fillStyle(0x086c42, 1);
    body.fillCircle(0, 0, r);
    btn.add(body);

    // Glass specular
    const spec = this.add.graphics();
    spec.fillStyle(0xffffff, 0.20);
    spec.fillEllipse(-r * 0.25, -r * 0.38, r * 0.62, r * 0.30);
    spec.fillStyle(0xffffff, 0.75);
    spec.fillCircle(-r * 0.18, -r * 0.52, r * 0.055);
    btn.add(spec);

    // Play triangle (pure geometry)
    const tri = this.add.graphics();
    const ts = r * 0.40;
    tri.fillStyle(0xffffff, 1);
    tri.fillTriangle(-ts * 0.55, -ts, -ts * 0.55, ts, ts * 1.05, 0);
    btn.add(tri);

    // Rim
    const ring = this.add.graphics();
    ring.lineStyle(1.5, 0xffffff, 0.18);
    ring.strokeCircle(0, 0, r - 1);
    btn.add(ring);

    // Pulse
    this.tweens.add({
      targets: btn,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btn.setSize(r * 2, r * 2);
    btn.setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.tweens.add({
        targets: btn, scaleX: 0.93, scaleY: 0.93, duration: 70,
        onComplete: () => {
          this.tweens.add({
            targets: btn, scaleX: 1, scaleY: 1, duration: 70,
            onComplete: () => this.scene.start('GameScene'),
          });
        },
      });
    });

    btn.on('pointerover', () =>
      this.tweens.add({ targets: btn, scaleX: 1.08, scaleY: 1.08, duration: 140, ease: 'Sine.easeOut' }));
    btn.on('pointerout', () =>
      this.tweens.add({ targets: btn, scaleX: 1.0, scaleY: 1.0, duration: 140, ease: 'Sine.easeOut' }));
  }

  // ── Daily Challenge Card ──────────────────────────────────────

  private createDailyCard(x: number, y: number, w: number): void {
    const h = 96;
    const c = this.add.container(x, y).setDepth(10);

    const bg = this.add.graphics();
    bg.fillStyle(0xffffff, 0.92);
    bg.fillRoundedRect(0, 0, w, h, 16);
    bg.lineStyle(1, 0xbec9bf, 0.5);
    bg.strokeRoundedRect(0, 0, w, h, 16);
    c.add(bg);

    const iconBg = this.add.graphics();
    iconBg.fillStyle(0xf7ce48, 1);
    iconBg.fillRoundedRect(14, (h - 60) / 2, 60, 60, 10);
    c.add(iconBg);
    c.add(this.add.text(44, h / 2, 'emoji_events', {
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '30px',
      color: '#735c00',
    }).setOrigin(0.5));

    c.add(this.add.text(88, 16, 'SFIDA DEL GIORNO', {
      fontFamily: "'Lexend', sans-serif",
      fontSize: '11px',
      fontStyle: '600',
      color: '#735c00',
      letterSpacing: 1,
    }));
    c.add(this.add.text(88, 36, 'Ocean Explorer', {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '18px',
      fontStyle: '700',
      color: '#1a1c1b',
    }));
    c.add(this.add.text(88, 62, 'Trova 12 parole sul mare', {
      fontFamily: "'Lexend', sans-serif",
      fontSize: '11px',
      color: '#3f4941',
    }));

    const arrowGfx = this.add.graphics();
    arrowGfx.fillStyle(0x086c42, 1);
    arrowGfx.fillCircle(w - 26, h / 2, 20);
    c.add(arrowGfx);
    c.add(this.add.text(w - 26, h / 2, 'arrow_forward', {
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '22px',
      color: '#ffffff',
    }).setOrigin(0.5));
  }

  // ── Bottom Navigation ─────────────────────────────────────────

  private createBottomNav(): void {
    const navY = H - 80;
    const nav = this.add.graphics().setDepth(10);
    nav.fillStyle(0xffffff, 1);
    nav.fillRoundedRect(0, navY, W, 80 + 20, { tl: 28, tr: 28, bl: 0, br: 0 });
    nav.lineStyle(1, 0xf1f5f9, 1);
    nav.strokeRoundedRect(0, navY, W, 80 + 20, { tl: 28, tr: 28, bl: 0, br: 0 });

    const icon = { fontFamily: "'Material Symbols Outlined'", fontSize: '24px' };
    const label = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '11px', fontStyle: '600' };
    const midY = navY + 40;

    // Active tab: Gioca
    const playTab = this.add.container(W * 0.18, midY).setDepth(11);
    const tabBg = this.add.graphics();
    tabBg.fillStyle(0xecfdf5, 1);
    tabBg.fillRoundedRect(-36, -20, 72, 40, 12);
    playTab.add(tabBg);
    playTab.add(this.add.text(0, -9, 'videogame_asset', { ...icon, color: '#059669' }).setOrigin(0.5));
    playTab.add(this.add.text(0, 14, 'Gioca', { ...label, color: '#059669' }).setOrigin(0.5));

    // Stats
    const statsTab = this.add.container(W * 0.50, midY).setDepth(11);
    statsTab.add(this.add.text(0, -9, 'equalizer', { ...icon, color: '#94a3b8' }).setOrigin(0.5));
    statsTab.add(this.add.text(0, 14, 'Statistiche', { ...label, color: '#94a3b8' }).setOrigin(0.5));

    // Settings
    const setTab = this.add.container(W * 0.82, midY).setDepth(11);
    setTab.add(this.add.text(0, -9, 'settings', { ...icon, color: '#94a3b8' }).setOrigin(0.5));
    setTab.add(this.add.text(0, 14, 'Impostazioni', { ...label, color: '#94a3b8' }).setOrigin(0.5));
  }
}
