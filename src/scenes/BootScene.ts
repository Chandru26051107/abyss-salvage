import Phaser from 'phaser';
import { TextureGenerator } from '../graphics/TextureGenerator';
import { SoundSystem } from '../systems/SoundSystem';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Generate procedural canvas textures into cache
    TextureGenerator.generateAllTextures(this);

    // Warm up sound system instance
    SoundSystem.getInstance();
  }

  create(): void {
    // Enable audio context on any user pointer down
    this.input.once('pointerdown', () => {
      SoundSystem.getInstance().resumeContext();
    });

    this.scene.start('MainMenuScene');
  }
}
