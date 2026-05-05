import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOURS } from '../config/gameConfig';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // 1. Sfondo base
    this.add.rectangle(0, 0, CANVAS_WIDTH, this.scale.height, 0xf9f9f7).setOrigin(0);

    // 2. Elementi Decorativi di Sfondo (Floating Letters)
    // P: top-24 left-[10%]
    this.createFloatingLetter(CANVAS_WIDTH * 0.1, this.scale.height * 0.1, 'P', 0x8ee4af);
    // O: top-40 right-[15%]
    this.createFloatingLetter(CANVAS_WIDTH * 0.85, this.scale.height * 0.18, 'O', 0xf7ce48);
    // P: bottom-48 left-[20%]
    this.createFloatingLetter(CANVAS_WIDTH * 0.2, this.scale.height * 0.8, 'P', 0xfc8992);
    // Y: top-[60%] right-[10%]
    this.createFloatingLetter(CANVAS_WIDTH * 0.9, this.scale.height * 0.6, 'Y', 0x8ee4af);
    // W: bottom-24 right-[25%]
    this.createFloatingLetter(CANVAS_WIDTH * 0.75, this.scale.height * 0.9, 'W', 0xf7ce48);

    // 3. Header
    const header = this.add.container(0, 0);
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x8ee4af, 0.1);
    headerBg.fillRect(0, 0, CANVAS_WIDTH, 64);
    headerBg.lineStyle(2, 0x10b981, 0.1); // emerald-100 approximate
    headerBg.lineBetween(0, 64, CANVAS_WIDTH, 64);
    header.add(headerBg);
    
    header.add(this.add.text(CANVAS_WIDTH / 2, 32, 'Poppy Wordy', {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '24px',
      fontStyle: '900 italic',
      color: '#10b981', // emerald-500
    }).setOrigin(0.5));

    // 4. Main Content
    // Subtitle
    this.add.text(CANVAS_WIDTH / 2, 160, "Pop the bubbles, build the words,\nand conquer the board.", {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '20px',
      fontStyle: '500',
      color: '#3f4941',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);

    // Play Now Button (3D Effect)
    const playBtnY = this.scale.height * 0.45;
    const playBtn = this.add.container(CANVAS_WIDTH / 2, playBtnY);
    
    const btnWidth = CANVAS_WIDTH - 64;
    const btnHeight = 160;
    
    // Shadow for 3D effect
    const shadow = this.add.graphics();
    shadow.fillStyle(0x00683e, 0.12);
    shadow.fillRoundedRect(-btnWidth / 2, -btnHeight / 2 + 12, btnWidth, btnHeight, 80);
    playBtn.add(shadow);
    
    // Main Button Body
    const pill = this.add.graphics();
    pill.fillStyle(0x8ee4af, 1);
    pill.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 80);
    playBtn.add(pill);

    // Icon (Material Symbol)
    playBtn.add(this.add.text(0, -20, 'play_circle', { 
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '64px', 
      color: '#00683e' 
    }).setOrigin(0.5));
    
    // Text
    playBtn.add(this.add.text(0, 40, 'PLAY NOW', {
      fontFamily: "'Lexend', sans-serif",
      fontSize: '24px',
      fontStyle: '600',
      color: '#00683e',
      letterSpacing: 2
    }).setOrigin(0.5));

    playBtn.setSize(btnWidth, btnHeight);
    playBtn.setInteractive({ useHandCursor: true });
    
    playBtn.on('pointerdown', () => {
      this.tweens.add({ targets: playBtn, y: playBtnY + 12, duration: 50, onComplete: () => {
        this.scene.start('GameScene');
      }});
    });
    
    playBtn.on('pointerover', () => {
      this.tweens.add({ targets: playBtn, y: playBtnY + 6, duration: 100 });
    });
    
    playBtn.on('pointerout', () => {
      this.tweens.add({ targets: playBtn, y: playBtnY, duration: 100 });
    });

    // 5. Daily Challenge Card
    const cardY = this.scale.height * 0.75;
    const cardContainer = this.add.container(32, cardY);
    const cardWidth = CANVAS_WIDTH - 64;
    
    const cardBg = this.add.graphics();
    cardBg.fillStyle(0xffffff, 1);
    cardBg.fillRoundedRect(0, 0, cardWidth, 120, 16);
    cardBg.lineStyle(1, 0xbec9bf, 0.5);
    cardBg.strokeRoundedRect(0, 0, cardWidth, 120, 16);
    cardContainer.add(cardBg);

    // Icon Container
    const iconBg = this.add.graphics();
    iconBg.fillStyle(0xf7ce48, 1);
    iconBg.fillRoundedRect(16, 28, 64, 64, 8);
    cardContainer.add(iconBg);
    cardContainer.add(this.add.text(48, 60, 'emoji_events', { 
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '32px',
      color: '#735c00'
    }).setOrigin(0.5));

    // Texts
    cardContainer.add(this.add.text(96, 24, 'DAILY CHALLENGE', {
      fontFamily: "'Lexend', sans-serif",
      fontSize: '12px',
      fontStyle: '600',
      color: '#735c00',
      letterSpacing: 1
    }));
    cardContainer.add(this.add.text(96, 44, 'Ocean Explorer', {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '20px',
      fontStyle: '700',
      color: '#1a1c1b'
    }));
    cardContainer.add(this.add.text(96, 74, 'Find 12 words about the sea', {
      fontFamily: "'Lexend', sans-serif",
      fontSize: '12px',
      color: '#3f4941'
    }));

    // Arrow Button
    const arrowBtn = this.add.graphics();
    arrowBtn.fillStyle(0x086c42, 1);
    arrowBtn.fillCircle(cardWidth - 32, 60, 20);
    cardContainer.add(arrowBtn);
    cardContainer.add(this.add.text(cardWidth - 32, 60, 'arrow_forward', { 
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '24px', 
      color: '#ffffff' 
    }).setOrigin(0.5));

    // 6. Bottom Navigation
    this.createBottomNav();
  }

  private createFloatingLetter(x: number, y: number, letter: string, color: number) {
    const text = this.add.text(x, y, letter, {
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: '64px',
      fontStyle: '800',
      color: `#${color.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5).setAlpha(0.4);

    this.tweens.add({
      targets: text,
      y: y - 20,
      angle: 5,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createBottomNav() {
    const navY = this.scale.height - 80;
    const navBar = this.add.graphics();
    
    // Background with shadow and rounded top
    navBar.fillStyle(0xffffff, 1);
    navBar.fillRoundedRect(0, navY, CANVAS_WIDTH, 80, { tl: 32, tr: 32, bl: 0, br: 0 });
    navBar.lineStyle(1, 0xf1f5f9, 1); // slate-100
    navBar.strokeRoundedRect(0, navY, CANVAS_WIDTH, 80, { tl: 32, tr: 32, bl: 0, br: 0 });

    const navTextStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '12px', fontStyle: '600' };
    
    // Play (Active)
    const playBtn = this.add.container(80, navY + 40);
    const playBg = this.add.graphics();
    playBg.fillStyle(0xecfdf5, 1); // emerald-50
    playBg.fillRoundedRect(-40, -20, 80, 40, 12);
    playBtn.add(playBg);
    playBtn.add(this.add.text(0, -10, 'videogame_asset', { 
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '24px',
      color: '#059669' 
    }).setOrigin(0.5));
    playBtn.add(this.add.text(0, 12, 'Play', { ...navTextStyle, color: '#059669' }).setOrigin(0.5));

    // Stats
    const statsBtn = this.add.container(CANVAS_WIDTH / 2, navY + 40);
    statsBtn.add(this.add.text(0, -10, 'equalizer', { 
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '24px',
      color: '#94a3b8' 
    }).setOrigin(0.5));
    statsBtn.add(this.add.text(0, 12, 'Stats', { ...navTextStyle, color: '#94a3b8' }).setOrigin(0.5));

    // Settings
    const settingsBtn = this.add.container(CANVAS_WIDTH - 80, navY + 40);
    settingsBtn.add(this.add.text(0, -10, 'settings', { 
      fontFamily: "'Material Symbols Outlined'",
      fontSize: '24px',
      color: '#94a3b8' 
    }).setOrigin(0.5));
    settingsBtn.add(this.add.text(0, 12, 'Settings', { ...navTextStyle, color: '#94a3b8' }).setOrigin(0.5));
  }
}

