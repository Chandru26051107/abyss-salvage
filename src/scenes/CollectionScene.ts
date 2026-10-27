import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { ZONES } from '../config/zones';
import { SaveState } from '../types/game';
import { SoundSystem } from '../systems/SoundSystem';

export class CollectionScene extends Phaser.Scene {
  private saveState!: SaveState;
  private returnScene = 'MainMenuScene';

  constructor() {
    super({ key: 'CollectionScene' });
  }

  init(data?: { returnTo?: string }): void {
    this.returnScene = data?.returnTo || 'MainMenuScene';
    this.saveState = SaveSystem.loadSave();
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x050f1d);

    // Title
    this.add
      .text(cx, 38, 'TIDE CROWN & SALVAGED RELICS', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    // Tide Crown Pieces Banner
    const crownCount = this.saveState.playerStats.collectedCrownPieces.length;
    this.add
      .text(cx, 68, `Tide Crown Fragments Assembled: ${crownCount} / 5`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    // 5 Crown Sockets
    const socketStartX = cx - 140;
    for (let i = 1; i <= 5; i++) {
      const sockX = socketStartX + (i - 1) * 70;
      const hasCrown = this.saveState.playerStats.collectedCrownPieces.includes(i);

      const circle = this.add.circle(sockX, 115, 24, hasCrown ? 0xf59e0b : 0x1e293b);
      circle.setStrokeStyle(2, hasCrown ? 0xfde047 : 0x475569);

      if (hasCrown) {
        this.add.image(sockX, 115, 'crown_piece').setScale(0.8);
      } else {
        this.add
          .text(sockX, 115, `#${i}`, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '12px',
            color: '#64748b',
          })
          .setOrigin(0.5);
      }
    }

    // Relic Grid Display
    const gridY = 170;
    const allTreasures = ZONES.flatMap((z) => z.treasures);
    const collectedCount = this.saveState.playerStats.collectedTreasures.length;

    this.add
      .text(cx, gridY, `Recovered Oceanic Relics (${collectedCount} / ${allTreasures.length})`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#e0f2fe',
      })
      .setOrigin(0.5);

    // Scrollable or paginated display of relics
    const cols = 4;
    const startX = cx - 280;
    const rowStartY = gridY + 30;

    allTreasures.slice(0, 16).forEach((treasure, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = startX + col * 190;
      const y = rowStartY + row * 60;

      const isCollected = this.saveState.playerStats.collectedTreasures.includes(treasure.id);

      const slot = this.add.rectangle(x, y, 175, 48, isCollected ? 0x0f172a : 0x0b1120);
      slot.setStrokeStyle(1, isCollected ? 0x38bdf8 : 0x1e293b);

      this.add
        .image(x - 65, y, treasure.isCrownPiece ? 'crown_piece' : 'chest_closed')
        .setScale(0.7)
        .setAlpha(isCollected ? 1 : 0.25);

      const label = isCollected ? treasure.name : 'Unknown Relic ???';
      this.add.text(x - 42, y - 8, label, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: isCollected ? (treasure.isCrownPiece ? '#fbbf24' : '#e0f2fe') : '#475569',
        fontStyle: isCollected ? 'bold' : 'normal',
        wordWrap: { width: 120 },
      });

      if (isCollected) {
        slot.setInteractive({ useHandCursor: true });
        slot.on('pointerdown', () => {
          SoundSystem.getInstance().playProximityBlip(680);
          this.showRelicDetails(treasure.name, treasure.description, treasure.value);
        });
      }
    });

    // Return button
    const backBtn = this.add.rectangle(cx, height - 35, 180, 40, 0x0284c7);
    backBtn.setStrokeStyle(2, 0x38bdf8);
    backBtn.setInteractive({ useHandCursor: true });
    this.add
      .text(cx, height - 35, 'Back to Menu', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    backBtn.on('pointerdown', () => {
      SoundSystem.getInstance().playProximityBlip(520);
      this.scene.start(this.returnScene);
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start(this.returnScene);
    });
  }

  private showRelicDetails(name: string, desc: string, value: number): void {
    const { width, height } = this.scale;
    const toast = this.add.container(width / 2, height / 2);

    const bg = this.add.rectangle(0, 0, 420, 160, 0x020617, 0.95);
    bg.setStrokeStyle(2, 0x38bdf8);
    bg.setInteractive();

    const title = this.add
      .text(0, -45, name, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fbbf24',
      })
      .setOrigin(0.5);

    const text = this.add
      .text(0, -5, desc, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '13px',
        color: '#cbd5e1',
        wordWrap: { width: 380 },
        align: 'center',
      })
      .setOrigin(0.5);

    const val = this.add
      .text(0, 40, `Appraised Value: ${value} Gold`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#34d399',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    toast.add([bg, title, text, val]);

    bg.on('pointerdown', () => {
      toast.destroy();
    });
  }
}
