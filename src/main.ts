// ================================================================
//  main.ts – Phaser entry point
// ================================================================

import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOURS } from './config/gameConfig';

const width = 480;
// Calculate height to match screen aspect ratio
const screenAspectRatio = window.innerHeight / window.innerWidth;
const height = Math.max(760, width * screenAspectRatio);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,           // WebGL if available, Canvas fallback
  width: width,
  height: height,
  backgroundColor: '#f9f9f7', // surface
  parent: 'game-wrapper',
  scene: [MenuScene, GameScene],
  input: {
    touch: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: width,
    height: height,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};

// Ensure fonts are loaded before starting the game
(document as any).fonts.ready.then(() => {
  new Phaser.Game(config);
});
