import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { ZoneSelectScene } from './scenes/ZoneSelectScene';
import { GameScene } from './scenes/GameScene';
import { SalvageMiniGameScene } from './scenes/SalvageMiniGameScene';
import { ShopScene } from './scenes/ShopScene';
import { CollectionScene } from './scenes/CollectionScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 1024,
  height: 640,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  render: {
    pixelArt: false,
    antialias: true,
  },
  scene: [
    BootScene,
    MainMenuScene,
    ZoneSelectScene,
    GameScene,
    SalvageMiniGameScene,
    ShopScene,
    CollectionScene,
  ],
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
