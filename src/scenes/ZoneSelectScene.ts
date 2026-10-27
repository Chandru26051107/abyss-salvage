import Phaser from 'phaser';
import { ZONES } from '../config/zones';
import { SaveSystem } from '../systems/SaveSystem';
import { SaveState } from '../types/game';
import { SoundSystem } from '../systems/SoundSystem';

export class ZoneSelectScene extends Phaser.Scene {
  private saveState!: SaveState;

  constructor() {
    super({ key: 'ZoneSelectScene' });
  }

  init(): void {
    this.saveState = SaveSystem.loadSave();
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x030a16);

    // Title
    this.add
      .text(cx, 38, 'OCEAN EXPEDITION MAP', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 68, 'Select a depth zone to deploy Captain Mina’s salvage submarine', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    // List 5 Zones
    const cardYStart = 110;
    const cardHeight = 78;
    const cardGap = 12;

    ZONES.forEach((zone, index) => {
      const y = cardYStart + index * (cardHeight + cardGap);
      const isUnlocked = this.saveState.unlockedZones.includes(zone.id);
      const hasCrown = this.saveState.playerStats.collectedCrownPieces.includes(zone.id);

      const zoneCollected = zone.treasures.filter((t) =>
        this.saveState.playerStats.collectedTreasures.includes(t.id)
      ).length;

      // Card
      const card = this.add.rectangle(cx, y + cardHeight / 2, Math.min(680, width - 40), cardHeight, isUnlocked ? 0x0f172a : 0x050811);
      card.setStrokeStyle(1.5, isUnlocked ? 0x0284c7 : 0x1e293b);

      // Zone Indicator & Depth
      this.add.text(cx - 310, y + 14, `Zone ${zone.id}: ${zone.name}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: isUnlocked ? '#e0f2fe' : '#475569',
      });

      this.add.text(cx - 310, y + 42, `${zone.depthDescription} • ${zone.subtitle}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: isUnlocked ? '#38bdf8' : '#334155',
      });

      // Stats
      this.add.text(cx + 80, y + 16, `Relics: ${zoneCollected}/${zone.treasures.length}`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#94a3b8',
      });

      this.add.text(
        cx + 80,
        y + 42,
        hasCrown ? '👑 Crown Recovered' : '👑 Crown Missing',
        {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '12px',
          color: hasCrown ? '#fbbf24' : '#64748b',
          fontStyle: hasCrown ? 'bold' : 'normal',
        }
      );

      // Dive Button
      const btnX = cx + 250;
      const btnY = y + cardHeight / 2;

      if (isUnlocked) {
        const diveBtn = this.add.rectangle(btnX, btnY, 110, 36, 0x0284c7);
        diveBtn.setStrokeStyle(1.5, 0x38bdf8);
        diveBtn.setInteractive({ useHandCursor: true });

        this.add
          .text(btnX, btnY, 'DIVE IN', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#ffffff',
          })
          .setOrigin(0.5);

        diveBtn.on('pointerdown', () => {
          SoundSystem.getInstance().playProximityBlip(600);
          this.scene.start('GameScene', { zoneId: zone.id });
        });

        diveBtn.on('pointerover', () => diveBtn.setScale(1.05));
        diveBtn.on('pointerout', () => diveBtn.setScale(1.0));
      } else {
        const lockedBox = this.add.rectangle(btnX, btnY, 110, 36, 0x1e293b);
        lockedBox.setStrokeStyle(1, 0x334155);

        this.add
          .text(btnX, btnY, 'LOCKED', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '12px',
            color: '#64748b',
          })
          .setOrigin(0.5);
      }
    });

    // Back button
    const backBtn = this.add.rectangle(cx, height - 35, 180, 40, 0x1e293b);
    backBtn.setStrokeStyle(1.5, 0x475569);
    backBtn.setInteractive({ useHandCursor: true });
    this.add
      .text(cx, height - 35, 'Return to Menu', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        color: '#e2e8f0',
      })
      .setOrigin(0.5);

    backBtn.on('pointerdown', () => {
      SoundSystem.getInstance().playProximityBlip(520);
      this.scene.start('MainMenuScene');
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }
}
