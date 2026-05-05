// ================================================================
//  main.ts – Phaser entry point
// ================================================================

import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const GAME_WIDTH  = 480;
const GAME_HEIGHT = 760;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#f0f5f2',
  parent: 'game-wrapper',
  scene: [MenuScene, GameScene],
  input: {
    touch: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false,
  },
};

(document as any).fonts.ready.then(() => {
  new Phaser.Game(config);
});
