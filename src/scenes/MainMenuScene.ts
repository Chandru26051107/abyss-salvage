import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { SaveState } from '../types/game';

export class MainMenuScene extends Phaser.Scene {
  private saveState!: SaveState;

  constructor() {
    super({ key: 'MainMenuScene' });
  }

  init(): void {
    this.saveState = SaveSystem.loadSave();
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Atmospheric Ocean Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0284c7, 0x0369a1, 0x050e1d, 0x020617, 1);
    bg.fillRect(0, 0, width, height);

    // Drifting bubbles
    this.add.particles(0, 0, 'air_bubble', {
      x: { min: 0, max: width },
      y: { min: height, max: height + 50 },
      scale: { start: 0.3, end: 0.6 },
      alpha: { start: 0.6, end: 0 },
      speedY: { min: -40, max: -90 },
      speedX: { min: -10, max: 10 },
      lifespan: 7000,
      frequency: 200,
    });

    // Bobbing Submarine on menu
    const sub = this.add.sprite(cx, 160, 'sub_body').setScale(1.2);
    this.tweens.add({
      targets: sub,
      y: 172,
      angle: { from: -3, to: 3 },
      duration: 2600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Bolt companion swimming around sub
    const bolt = this.add.sprite(cx + 80, 140, 'bolt_fish').setScale(1.1);
    this.tweens.add({
      targets: bolt,
      x: cx - 90,
      y: 180,
      duration: 3200,
      yoyo: true,
      repeat: -1,
      flipX: true,
      ease: 'Quad.easeInOut',
    });

    // Title Texts
    this.add
      .text(cx, 60, 'ABYSS SALVAGE', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#38bdf8',
        shadow: { color: '#0284c7', blur: 12, fill: true },
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 102, 'SONAR TREASURE HUNT', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fbbf24',
        letterSpacing: 3,
      })
      .setOrigin(0.5);

    // Menu Buttons Container
    const btnStartY = 240;
    const btnGap = 48;
    const btnWidth = 260;
    const btnHeight = 40;

    const buttons = [
      {
        label: 'DIVE INTO ZONE 1',
        action: () => {
          SoundSystem.getInstance().playProximityBlip(600);
          this.scene.start('GameScene', { zoneId: this.saveState.currentZoneId });
        },
      },
      {
        label: 'EXPEDITION MAP (ZONES)',
        action: () => {
          SoundSystem.getInstance().playProximityBlip(520);
          this.scene.start('ZoneSelectScene');
        },
      },
      {
        label: 'DR. CORAL’S DOCK WORKSHOP',
        action: () => {
          SoundSystem.getInstance().playProximityBlip(520);
          this.scene.start('ShopScene', { returnTo: 'MainMenuScene' });
        },
      },
      {
        label: 'TIDE CROWN & RELICS',
        action: () => {
          SoundSystem.getInstance().playProximityBlip(520);
          this.scene.start('CollectionScene', { returnTo: 'MainMenuScene' });
        },
      },
      {
        label: 'SETTINGS & CONTROLS',
        action: () => {
          SoundSystem.getInstance().playProximityBlip(520);
          this.showSettingsModal();
        },
      },
    ];

    buttons.forEach((btn, idx) => {
      const y = btnStartY + idx * btnGap;
      const rect = this.add.rectangle(cx, y, btnWidth, btnHeight, 0x0f172a, 0.9);
      rect.setStrokeStyle(1.5, idx === 0 ? 0x38bdf8 : 0x334155);
      rect.setInteractive({ useHandCursor: true });

      this.add
        .text(cx, y, btn.label, {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          color: idx === 0 ? '#ffffff' : '#cbd5e1',
        })
        .setOrigin(0.5);

      rect.on('pointerdown', btn.action);
      rect.on('pointerover', () => {
        rect.setScale(1.04);
        rect.setStrokeStyle(1.5, 0x38bdf8);
      });
      rect.on('pointerout', () => {
        rect.setScale(1.0);
        rect.setStrokeStyle(1.5, idx === 0 ? 0x38bdf8 : 0x334155);
      });
    });

    // Footer with controls legend
    const footerStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '12px',
      color: '#64748b',
      align: 'center',
    };
    this.add
      .text(
        cx,
        height - 30,
        'CONTROLS: [WASD / Arrows / Joystick] Steer • [SPACE / Sonar Btn] Ping Sonar • [E / Salvage Btn] Salvage Chest • [F3] Debug',
        footerStyle
      )
      .setOrigin(0.5);
  }

  private showSettingsModal(): void {
    const { width, height } = this.scale;
    const modal = this.add.container(width / 2, height / 2).setDepth(40);

    const bg = this.add.rectangle(0, 0, 440, 320, 0x030712, 0.95);
    bg.setStrokeStyle(2, 0x38bdf8);
    bg.setInteractive();

    const title = this.add
      .text(0, -120, 'GAME SETTINGS', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    // Audio Mute Toggle
    const soundSys = SoundSystem.getInstance();
    const isMuted = soundSys.getIsMuted();
    const muteBtn = this.add.rectangle(0, -55, 260, 36, isMuted ? 0x334155 : 0x0284c7);
    muteBtn.setStrokeStyle(1, 0x38bdf8);
    muteBtn.setInteractive({ useHandCursor: true });
    const muteLabel = this.add
      .text(0, -55, isMuted ? 'Audio: MUTED (Click to Unmute)' : 'Audio: ACTIVE (Click to Mute)', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    muteBtn.on('pointerdown', () => {
      const muted = soundSys.toggleMute();
      muteLabel.setText(muted ? 'Audio: MUTED (Click to Unmute)' : 'Audio: ACTIVE (Click to Mute)');
      muteBtn.setFillStyle(muted ? 0x334155 : 0x0284c7);
    });

    // Reset Progress Button
    const resetBtn = this.add.rectangle(0, 10, 260, 36, 0x7f1d1d);
    resetBtn.setStrokeStyle(1, 0xef4444);
    resetBtn.setInteractive({ useHandCursor: true });
    this.add
      .text(0, 10, 'Reset Save Data & Vault', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#fecaca',
      })
      .setOrigin(0.5);

    resetBtn.on('pointerdown', () => {
      this.saveState = SaveSystem.resetSave();
      SoundSystem.getInstance().playHit();
      modal.destroy();
      this.scene.restart();
    });

    // Close button
    const closeBtn = this.add.rectangle(0, 85, 140, 36, 0x1e293b);
    closeBtn.setStrokeStyle(1, 0x64748b);
    closeBtn.setInteractive({ useHandCursor: true });
    this.add
      .text(0, 85, 'Done', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    closeBtn.on('pointerdown', () => {
      modal.destroy();
    });

    modal.add([bg, title, muteBtn, muteLabel, resetBtn, closeBtn]);
  }
}
