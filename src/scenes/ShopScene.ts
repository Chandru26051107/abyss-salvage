import Phaser from 'phaser';
import { SaveSystem } from '../systems/SaveSystem';
import { UPGRADE_CATALOG } from '../config/upgrades';
import { SaveState, Upgrades } from '../types/game';
import { SoundSystem } from '../systems/SoundSystem';

export class ShopScene extends Phaser.Scene {
  private saveState!: SaveState;
  private returnScene = 'MainMenuScene';

  constructor() {
    super({ key: 'ShopScene' });
  }

  init(data?: { returnTo?: string }): void {
    this.returnScene = data?.returnTo || 'MainMenuScene';
    this.saveState = SaveSystem.loadSave();
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;

    // Dark dock background
    this.add.rectangle(cx, height / 2, width, height, 0x050e1d);

    // Subtle water gradient on bottom
    const waterGlow = this.add.graphics();
    waterGlow.fillGradientStyle(0x0284c7, 0x0284c7, 0x030712, 0x030712, 0.4);
    waterGlow.fillRect(0, height - 140, width, 140);

    // Surface Dock Header
    this.add
      .text(cx, 40, "DR. CORAL'S SURFACE DOCK WORKSHOP", {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#38bdf8',
      })
      .setOrigin(0.5);

    // Dr. Coral Dialogue
    this.add
      .text(cx, 75, '"Ah, Captain Mina! Recovered any relics from the abyss? Let\'s tune up the Nautilus!"', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        fontStyle: 'italic',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    // Coin display top-right
    const coinBg = this.add.rectangle(width - 120, 40, 160, 36, 0x1e293b).setStrokeStyle(1.5, 0xf59e0b);
    this.add.image(width - 175, 40, 'coin').setScale(0.9);
    this.add
      .text(width - 150, 40, `${this.saveState.playerStats.coins} Gold`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#fbbf24',
      })
      .setOrigin(0, 0.5);
    coinBg.setDepth(1);

    // Render Upgrade Cards
    this.renderUpgradeCards();

    // Back / Launch button
    const backBtn = this.add.rectangle(cx, height - 45, 200, 44, 0x0284c7);
    backBtn.setStrokeStyle(2, 0x38bdf8);
    backBtn.setInteractive({ useHandCursor: true });
    this.add
      .text(cx, height - 45, 'Return to Ocean', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '16px',
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

  private renderUpgradeCards(): void {
    const { width } = this.scale;
    const cardYStart = 120;
    const cardHeight = 85;
    const cardGap = 15;

    UPGRADE_CATALOG.forEach((def, index) => {
      const y = cardYStart + index * (cardHeight + cardGap);
      const currentLevel = this.saveState.upgrades[def.id];
      const nextLevelData = def.levels.find((l) => l.level === currentLevel + 1);
      const isMaxed = !nextLevelData;

      // Card Background
      const card = this.add.rectangle(width / 2, y + cardHeight / 2, Math.min(680, width - 40), cardHeight, 0x0f172a);
      card.setStrokeStyle(1.5, 0x334155);

      // Title & Current Stat
      const title = this.add.text(width / 2 - 310, y + 14, `${def.name} (Mk ${currentLevel})`, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        color: '#e0f2fe',
      });

      this.add.text(width / 2 - 310, y + 42, def.description, {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        color: '#64748b',
        wordWrap: { width: 440 },
      });

      // Buy / Maxed Button
      const btnX = width / 2 + 230;
      const btnY = y + cardHeight / 2;

      if (isMaxed) {
        const maxBox = this.add.rectangle(btnX, btnY, 130, 36, 0x1e293b);
        maxBox.setStrokeStyle(1, 0x475569);
        this.add
          .text(btnX, btnY, 'MAX TIER', {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#10b981',
          })
          .setOrigin(0.5);
      } else {
        const canAfford = this.saveState.playerStats.coins >= nextLevelData.cost;
        const buyBtn = this.add.rectangle(btnX, btnY, 130, 36, canAfford ? 0x15803d : 0x374151);
        buyBtn.setStrokeStyle(1.5, canAfford ? 0x22c55e : 0x4b5563);

        if (canAfford) {
          buyBtn.setInteractive({ useHandCursor: true });
        }

        this.add
          .text(btnX, btnY, `Upgrade: ${nextLevelData.cost}g`, {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            color: canAfford ? '#ffffff' : '#9ca3af',
          })
          .setOrigin(0.5);

        buyBtn.on('pointerdown', () => {
          this.purchaseUpgrade(def.id, nextLevelData.cost);
        });

        // Hover scale
        buyBtn.on('pointerover', () => buyBtn.setScale(1.04));
        buyBtn.on('pointerout', () => buyBtn.setScale(1.0));
      }

      // Progress pip markers (1 to 5)
      for (let i = 1; i <= 5; i++) {
        const pipX = width / 2 - 310 + title.width + 15 + (i - 1) * 16;
        const pipY = y + 23;
        this.add.circle(pipX, pipY, 4, i <= currentLevel ? 0x38bdf8 : 0x334155);
      }
    });
  }

  private purchaseUpgrade(track: keyof Upgrades, cost: number): void {
    if (this.saveState.playerStats.coins < cost) return;

    this.saveState.playerStats.coins -= cost;
    this.saveState.upgrades[track] += 1;
    SaveSystem.saveGame(this.saveState);

    SoundSystem.getInstance().playCoin();
    SoundSystem.getInstance().playAirRefill();

    // Re-render scene to refresh balances & pips
    this.scene.restart({ returnTo: this.returnScene });
  }
}
