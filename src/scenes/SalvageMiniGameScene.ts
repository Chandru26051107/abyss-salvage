import Phaser from 'phaser';
import { TreasureItem } from '../types/game';
import { SoundSystem } from '../systems/SoundSystem';

export interface SalvageInitData {
  treasure: TreasureItem;
}

export class SalvageMiniGameScene extends Phaser.Scene {
  private treasure!: TreasureItem;
  private needleX = 0;
  private needleSpeed = 260; // pixels per second
  private needleDirection = 1; // 1 = right, -1 = left
  private barWidth = 360;
  private barHeight = 28;
  private targetZoneStart = 0;
  private targetZoneWidth = 80;
  private needleGraphics!: Phaser.GameObjects.Graphics;
  private isAttempting = false;
  private statusText!: Phaser.GameObjects.Text;
  private successCallback?: (success: boolean) => void;

  constructor() {
    super({ key: 'SalvageMiniGameScene' });
  }

  init(data: { treasure: TreasureItem; onComplete?: (success: boolean) => void }): void {
    this.treasure = data.treasure;
    this.successCallback = data.onComplete;
    this.isAttempting = false;

    // Determine target zone size and needle speed from difficulty
    const diff = Phaser.Math.Clamp(this.treasure.difficulty, 1, 5);
    this.targetZoneWidth = Math.max(38, 90 - (diff - 1) * 12);
    this.needleSpeed = 220 + (diff - 1) * 65;

    // Place target zone randomly within bar bounds
    const minStart = 20;
    const maxStart = this.barWidth - this.targetZoneWidth - 20;
    this.targetZoneStart = Phaser.Math.Between(minStart, maxStart);
    this.needleX = 0;
    this.needleDirection = 1;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Dark semi-transparent backdrop
    const backdrop = this.add.rectangle(cx, cy, width, height, 0x030712, 0.78);
    backdrop.setInteractive();

    // Modal Panel
    const panel = this.add.rectangle(cx, cy, 480, 360, 0x0f172a, 0.95);
    panel.setStrokeStyle(3, this.treasure.isCrownPiece ? 0xf59e0b : 0x38bdf8);

    // Title & Icon
    const iconKey = this.treasure.isCrownPiece ? 'crown_piece' : 'chest_closed';
    this.add.image(cx, cy - 110, iconKey).setScale(1.4);

    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: this.treasure.isCrownPiece ? '#fbbf24' : '#e0f2fe',
    };
    this.add.text(cx, cy - 65, this.treasure.name, titleStyle).setOrigin(0.5);

    const descStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
      wordWrap: { width: 420 },
      align: 'center',
    };
    this.add.text(cx, cy - 35, this.treasure.description, descStyle).setOrigin(0.5);

    // Salvage bar container
    const barX = cx - this.barWidth / 2;
    const barY = cy + 20;

    const barBg = this.add.rectangle(cx, barY, this.barWidth, this.barHeight, 0x1e293b);
    barBg.setStrokeStyle(2, 0x475569);

    // Target Sweet Spot
    const targetX = barX + this.targetZoneStart + this.targetZoneWidth / 2;
    const sweetSpot = this.add.rectangle(
      targetX,
      barY,
      this.targetZoneWidth,
      this.barHeight - 4,
      this.treasure.isCrownPiece ? 0xf59e0b : 0x10b981,
      0.85
    );
    sweetSpot.setStrokeStyle(1.5, 0xffffff);

    // Needle graphics
    this.needleGraphics = this.add.graphics();

    // Status text
    this.statusText = this.add
      .text(cx, cy + 68, 'Press SPACE / ENTER / TAP to Lock Claw!', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#38bdf8',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    // Close / Cancel Button
    const cancelBtn = this.add.rectangle(cx, cy + 125, 120, 36, 0x334155);
    cancelBtn.setStrokeStyle(1, 0x64748b);
    cancelBtn.setInteractive({ useHandCursor: true });
    this.add
      .text(cx, cy + 125, 'Abandon', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        color: '#f1f5f9',
      })
      .setOrigin(0.5);

    cancelBtn.on('pointerdown', () => this.finish(false));

    // Input handlers
    this.input.keyboard?.on('keydown-SPACE', this.attemptLock, this);
    this.input.keyboard?.on('keydown-ENTER', this.attemptLock, this);
    this.input.keyboard?.on('keydown-ESC', () => this.finish(false));
    backdrop.on('pointerdown', this.attemptLock, this);
  }

  update(_time: number, delta: number): void {
    if (this.isAttempting) return;

    const dt = delta / 1000;
    this.needleX += this.needleSpeed * this.needleDirection * dt;

    if (this.needleX >= this.barWidth) {
      this.needleX = this.barWidth;
      this.needleDirection = -1;
    } else if (this.needleX <= 0) {
      this.needleX = 0;
      this.needleDirection = 1;
    }

    this.drawNeedle();
  }

  private drawNeedle(): void {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const barX = cx - this.barWidth / 2;
    const barY = cy + 20;

    this.needleGraphics.clear();
    const currentX = barX + this.needleX;

    // Draw vertical needle
    this.needleGraphics.fillStyle(0xffffff, 1);
    this.needleGraphics.fillRect(currentX - 2, barY - this.barHeight / 2 - 5, 4, this.barHeight + 10);

    // Indicator triangles
    this.needleGraphics.fillTriangle(
      currentX,
      barY - this.barHeight / 2 - 2,
      currentX - 5,
      barY - this.barHeight / 2 - 10,
      currentX + 5,
      barY - this.barHeight / 2 - 10
    );
  }

  private attemptLock(): void {
    if (this.isAttempting) return;
    this.isAttempting = true;

    const targetMin = this.targetZoneStart;
    const targetMax = this.targetZoneStart + this.targetZoneWidth;
    const isSuccess = this.needleX >= targetMin && this.needleX <= targetMax;

    if (isSuccess) {
      SoundSystem.getInstance().playChestOpen();
      this.time.delayedCall(150, () => SoundSystem.getInstance().playCoin());

      this.statusText.setText('SUCCESS! Salvage Claw Latched!').setColor('#10b981');

      // Sparkle burst effect
      this.cameras.main.flash(250, 20, 184, 166);

      this.time.delayedCall(800, () => {
        this.finish(true);
      });
    } else {
      SoundSystem.getInstance().playHit();
      this.statusText.setText('Claw slipped! Retrying tumbler alignment...').setColor('#f43f5e');

      this.time.delayedCall(600, () => {
        this.isAttempting = false;
        this.statusText.setText('Press SPACE / ENTER / TAP to Lock Claw!').setColor('#38bdf8');
      });
    }
  }

  private finish(success: boolean): void {
    this.input.keyboard?.off('keydown-SPACE', this.attemptLock, this);
    this.input.keyboard?.off('keydown-ENTER', this.attemptLock, this);

    if (this.successCallback) {
      this.successCallback(success);
    }
    this.scene.stop();
  }
}
