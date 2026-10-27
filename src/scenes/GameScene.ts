import Phaser from 'phaser';
import { ZONES } from '../config/zones';
import { SaveSystem } from '../systems/SaveSystem';
import { ResourceSystem } from '../systems/ResourceSystem';
import { SonarSystem, TreasurePingFeedback } from '../systems/SonarSystem';
import { SoundSystem } from '../systems/SoundSystem';
import { SaveState, TreasureItem, ZoneData } from '../types/game';

export class GameScene extends Phaser.Scene {
  private zoneId = 1;
  private zone!: ZoneData;
  private saveState!: SaveState;

  // Submarine & Player
  private sub!: Phaser.Physics.Arcade.Sprite;
  private propeller!: Phaser.GameObjects.Sprite;
  private subLightCone!: Phaser.GameObjects.Image;
  private boltFish!: Phaser.GameObjects.Sprite;
  private boltBubbleContainer!: Phaser.GameObjects.Container;
  private boltSpeechText!: Phaser.GameObjects.Text;
  private boltBubbleBg!: Phaser.GameObjects.Rectangle;
  private bubbleEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keyF3!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;

  // Touch Virtual Controls
  private touchJoystickBase?: Phaser.GameObjects.Image;
  private touchJoystickThumb?: Phaser.GameObjects.Image;
  private touchVector = { x: 0, y: 0 };
  private touchActive = false;

  // Sonar
  private lastPingTime = -10000;
  private sonarRings: { circle: Phaser.GameObjects.Arc; maxRadius: number; currentRadius: number; speed: number }[] = [];
  private activeTreasurePings: Map<string, { pulseTimer: number; feedback: TreasurePingFeedback }> = new Map();

  // World Entities
  private treasureSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private treasureBeacons: Map<string, Phaser.GameObjects.Arc> = new Map();
  private hazardSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private rivalDrone?: Phaser.Physics.Arcade.Sprite;
  private rivalDroneStunnedUntil = 0;

  // Ambient Sea Creatures
  private creatures: Phaser.GameObjects.Sprite[] = [];

  // Lighting & Darkness
  private darknessOverlay!: Phaser.GameObjects.RenderTexture;

  // HUD Elements
  private hudContainer!: Phaser.GameObjects.Container;
  private oxygenBar!: Phaser.GameObjects.Rectangle;
  private batteryBar!: Phaser.GameObjects.Rectangle;
  private hullBar!: Phaser.GameObjects.Rectangle;
  private coinHudText!: Phaser.GameObjects.Text;
  private depthHudText!: Phaser.GameObjects.Text;
  private pingCooldownArc!: Phaser.GameObjects.Arc;
  private promptText!: Phaser.GameObjects.Text;

  // Debug Overlay
  private debugVisible = false;
  private debugText!: Phaser.GameObjects.Text;

  // State flags
  private isMiniGameActive = false;
  private isRespawning = false;
  private activeNearbyTreasure: TreasureItem | null = null;
  private proximityBeepCooldown = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { zoneId?: number }): void {
    this.zoneId = data?.zoneId || 1;
    const foundZone = ZONES.find((z) => z.id === this.zoneId);
    this.zone = foundZone ?? ZONES[0]!;
    this.saveState = SaveSystem.loadSave();
    this.isMiniGameActive = false;
    this.isRespawning = false;
    this.activeTreasurePings.clear();
  }

  create(): void {
    // Apply derived stats from upgrades
    const derived = ResourceSystem.getUpgradeDerivedStats(this.saveState.upgrades);
    this.saveState.playerStats.maxHull = derived.maxHull;
    this.saveState.playerStats.maxBattery = derived.maxBattery;
    this.saveState.playerStats.hull = Math.min(this.saveState.playerStats.hull, derived.maxHull);
    this.saveState.playerStats.battery = Math.min(this.saveState.playerStats.battery, derived.maxBattery);

    // Setup Physics World Bounds
    this.physics.world.setBounds(0, 0, this.zone.width, this.zone.height);

    // Create Oceanic Parallax Backgrounds & Layers
    this.createOceanEnvironment();

    // Create World Treasures
    this.createTreasures();

    // Create Air Pockets
    this.createAirPockets();

    // Create Hazards
    this.createHazards();

    // Create Ambient Sea Creatures
    this.createCreatures();

    // Create Submarine & Propeller
    this.createSubmarine(derived.speed);

    // Create Bolt the Robot Fish companion
    this.createBoltCompanion();

    // Create Rival Drone
    this.createRivalDrone();

    // Setup Darkness & Flashlight Cone Overlay
    this.setupDarknessLighting();

    // Setup Camera
    this.cameras.main.setBounds(0, 0, this.zone.width, this.zone.height);
    this.cameras.main.startFollow(this.sub, true, 0.08, 0.08);

    // Setup HUD
    this.createHUD();

    // Setup Touch Controls
    this.setupTouchControls();

    // Setup Keyboard Controls
    this.setupKeyboardControls();

    // Setup Debug Overlay
    this.createDebugOverlay();

    // Sound Ambience
    SoundSystem.getInstance().startUnderwaterAmbience();

    // Welcome dialogue from Bolt
    this.time.delayedCall(1000, () => {
      this.showBoltMessage('Ready for dive, Mina! Press SPACE to ping Sonar & search for sunken relics!');
    });

    // Cleanup on scene shutdown
    this.events.on('shutdown', this.handleShutdown, this);
    this.events.on('destroy', this.handleShutdown, this);
  }

  private handleShutdown(): void {
    SoundSystem.getInstance().stopUnderwaterAmbience();
    this.sonarRings = [];
    this.activeTreasurePings.clear();
    this.creatures = [];
    this.hazardSprites.clear();
    this.treasureSprites.clear();
    this.treasureBeacons.clear();
  }

  private createOceanEnvironment(): void {
    // Gradient Background
    const bg = this.add.graphics();
    const p = this.zone.palette;

    // Sky/surface above water
    bg.fillStyle(0x0a192f, 1);
    bg.fillRect(0, 0, this.zone.width, this.zone.surfaceY);

    // Surface water line
    bg.fillStyle(p.surface, 0.7);
    bg.fillRect(0, this.zone.surfaceY, this.zone.width, 10);

    // Ocean depth gradient
    bg.fillGradientStyle(p.mid, p.mid, p.abyss, p.abyss, 1);
    bg.fillRect(0, this.zone.surfaceY + 10, this.zone.width, this.zone.height - this.zone.surfaceY);

    // Surface Dock / Research Boat
    const dockX = this.zone.dock.x;
    const dockY = this.zone.dock.y;

    // Dock platform
    const dockG = this.add.graphics();
    dockG.fillStyle(0x78350f, 1);
    dockG.fillRect(dockX - 120, dockY - 20, 240, 24);
    dockG.fillStyle(0x92400e, 1);
    dockG.fillRect(dockX - 110, dockY - 30, 80, 12);
    dockG.lineStyle(2, 0xf59e0b, 1);
    dockG.strokeRect(dockX - 120, dockY - 20, 240, 24);

    // Dock sign
    this.add
      .text(dockX, dockY - 45, "SURFACE DOCK & DR. CORAL'S WORKSHOP", {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fbbf24',
        backgroundColor: '#0f172a',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5);

    // Sea floor terrain with jagged rocks
    const floorG = this.add.graphics();
    floorG.fillStyle(p.abyss, 1);
    floorG.beginPath();
    floorG.moveTo(0, this.zone.height);
    for (let x = 0; x <= this.zone.width; x += 120) {
      const rockH = Math.sin(x * 0.005) * 60 + Math.cos(x * 0.015) * 30 + 70;
      floorG.lineTo(x, this.zone.height - rockH);
    }
    floorG.lineTo(this.zone.width, this.zone.height);
    floorG.closePath();
    floorG.fill();

    // Swaying Seaweed along floor
    for (let x = 100; x < this.zone.width; x += 220) {
      const weed = this.add.image(x, this.zone.height - 40, 'seaweed').setOrigin(0.5, 1).setAlpha(0.7);
      this.tweens.add({
        targets: weed,
        angle: { from: -8, to: 8 },
        duration: 2500 + (x % 500) * 4,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Drifting background ambient particles
    this.add.particles(0, 0, 'air_bubble', {
      x: { min: 0, max: this.zone.width },
      y: { min: this.zone.surfaceY, max: this.zone.height },
      scale: { start: 0.2, end: 0.5 },
      alpha: { start: 0.4, end: 0 },
      speedY: { min: -15, max: -45 },
      speedX: { min: -5, max: 5 },
      lifespan: 8000,
      frequency: 250,
      tint: p.particleTint,
    });
  }

  private createSubmarine(speed: number): void {
    const startX = this.zone.dock.x;
    const startY = this.zone.dock.y + 40;

    // Submarine Sprite
    this.sub = this.physics.add.sprite(startX, startY, 'sub_body');
    this.sub.setCollideWorldBounds(true);
    this.sub.setDamping(true);
    this.sub.setDrag(0.92);
    this.sub.setMaxVelocity(speed);
    this.sub.setDepth(10);
    this.sub.setSize(64, 32);

    // Propeller attachment
    this.propeller = this.add.sprite(startX - 36, startY, 'sub_propeller_1');
    this.propeller.setDepth(9);

    // Propeller bubble trail
    this.bubbleEmitter = this.add.particles(0, 0, 'air_bubble', {
      scale: { start: 0.4, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      speedY: { min: -10, max: 10 },
      speedX: { min: -40, max: -80 },
      lifespan: 600,
      frequency: 60,
      emitting: false,
    });
    this.bubbleEmitter.setDepth(8);

    // Flashlight cone attached to submarine front
    this.subLightCone = this.add.image(startX + 40, startY, 'light_cone');
    this.subLightCone.setOrigin(0.05, 0.5);
    this.subLightCone.setDepth(5);
    this.subLightCone.setAlpha(0.65);
  }

  private createBoltCompanion(): void {
    this.boltFish = this.add.sprite(this.sub.x - 40, this.sub.y - 30, 'bolt_fish');
    this.boltFish.setDepth(12);

    // Bolt's speech bubble UI
    this.boltBubbleContainer = this.add.container(this.boltFish.x, this.boltFish.y - 45);
    this.boltBubbleBg = this.add.rectangle(0, 0, 240, 48, 0x0f172a, 0.9);
    this.boltBubbleBg.setStrokeStyle(1.5, 0x06b6d4);

    this.boltSpeechText = this.add
      .text(0, 0, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        color: '#e0f2fe',
        wordWrap: { width: 220 },
        align: 'center',
      })
      .setOrigin(0.5);

    this.boltBubbleContainer.add([this.boltBubbleBg, this.boltSpeechText]);
    this.boltBubbleContainer.setDepth(15);
    this.boltBubbleContainer.setVisible(false);
  }

  private showBoltMessage(msg: string, durationMs = 5000): void {
    this.boltSpeechText.setText(msg);
    const bounds = this.boltSpeechText.getBounds();
    this.boltBubbleBg.setSize(Math.max(160, bounds.width + 24), Math.max(40, bounds.height + 16));
    this.boltBubbleContainer.setVisible(true);

    this.time.delayedCall(durationMs, () => {
      this.boltBubbleContainer.setVisible(false);
    });
  }

  private createTreasures(): void {
    this.zone.treasures.forEach((t) => {
      const isCollected = this.saveState.playerStats.collectedTreasures.includes(t.id);
      if (isCollected) return;

      const textureKey = t.isCrownPiece ? 'crown_piece' : 'chest_closed';
      const sprite = this.add.sprite(t.x, t.y, textureKey);
      sprite.setDepth(6);
      sprite.setAlpha(0.2); // hidden/dim until pinged or approached!

      // Glowing pulsing radar beacon (invisible until pinged)
      const beacon = this.add.circle(t.x, t.y, 22, t.isCrownPiece ? 0xfbbf24 : 0x22d3ee, 0);
      beacon.setStrokeStyle(2, t.isCrownPiece ? 0xf59e0b : 0x00f5ff, 0);
      beacon.setDepth(7);

      this.treasureSprites.set(t.id, sprite);
      this.treasureBeacons.set(t.id, beacon);
    });
  }

  private createAirPockets(): void {
    this.zone.airPockets.forEach((ap) => {
      // Bubbling air vent on floor
      const ventG = this.add.graphics();
      ventG.fillStyle(0x0284c7, 0.4);
      ventG.fillCircle(ap.x, ap.y, ap.radius);
      ventG.lineStyle(2, 0x38bdf8, 0.7);
      ventG.strokeCircle(ap.x, ap.y, ap.radius);
      ventG.setDepth(4);

      // Bubble stream rising from vent
      this.add.particles(ap.x, ap.y, 'air_bubble', {
        scale: { start: 0.3, end: 0.6 },
        alpha: { start: 0.7, end: 0 },
        speedY: { min: -50, max: -90 },
        speedX: { min: -15, max: 15 },
        lifespan: 3000,
        frequency: 180,
      });

      this.add
        .text(ap.x, ap.y, 'O₂ VENT', {
          fontFamily: 'Segoe UI, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#38bdf8',
        })
        .setOrigin(0.5);
    });
  }

  private createHazards(): void {
    this.zone.hazards.forEach((h) => {
      if (h.type === 'mine') {
        const mine = this.add.sprite(h.x, h.y, 'mine_hazard');
        mine.setDepth(6);
        this.hazardSprites.set(h.id, mine);

        // Slow bobbing tween
        this.tweens.add({
          targets: mine,
          y: h.y + 15,
          duration: 2000 + (h.x % 400) * 3,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else if (h.type === 'eel') {
        const eel = this.add.sprite(h.x, h.y, 'eel_hazard');
        eel.setDepth(6);
        this.hazardSprites.set(h.id, eel);

        this.tweens.add({
          targets: eel,
          x: h.x + 120,
          duration: 3500,
          yoyo: true,
          repeat: -1,
          flipX: true,
          ease: 'Sine.easeInOut',
        });
      } else if (h.type === 'squid_tentacle') {
        const tentacle = this.add.sprite(h.x, h.y, 'squid_tentacle');
        tentacle.setDepth(7);
        this.hazardSprites.set(h.id, tentacle);

        this.tweens.add({
          targets: tentacle,
          angle: { from: -20, to: 20 },
          scaleY: { from: 1, to: 1.15 },
          duration: 1800,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      }
    });
  }

  private createCreatures(): void {
    const types = this.zone.creatureTypes;
    for (let i = 0; i < 6; i++) {
      const type = types[i % types.length];
      const rx = Phaser.Math.Between(200, this.zone.width - 200);
      const ry = Phaser.Math.Between(this.zone.surfaceY + 80, this.zone.height - 250);

      let key = 'creature_turtle';
      if (type === 'jellyfish') key = 'creature_jellyfish_1';
      else if (type === 'angler') key = 'creature_angler';

      const creature = this.add.sprite(rx, ry, key);
      creature.setDepth(5);
      creature.setAlpha(0.85);
      this.creatures.push(creature);

      // Swimming behavior tween
      this.tweens.add({
        targets: creature,
        x: rx + (i % 2 === 0 ? 300 : -300),
        y: ry + Phaser.Math.Between(-60, 60),
        duration: 6000 + i * 800,
        yoyo: true,
        repeat: -1,
        flipX: true,
        ease: 'Quad.easeInOut',
      });
    }
  }

  private createRivalDrone(): void {
    // Spawns deep in the zone
    const spawnX = this.zone.width - 400;
    const spawnY = this.zone.height - 600;

    this.rivalDrone = this.physics.add.sprite(spawnX, spawnY, 'baron_drone');
    this.rivalDrone.setCollideWorldBounds(true);
    this.rivalDrone.setDepth(8);
    this.rivalDrone.setSize(44, 32);
    this.rivalDrone.setActive(true);
    this.rivalDrone.setVisible(true);
  }

  private setupDarknessLighting(): void {
    const { width, height } = this.scale;
    // Darkness overlay canvas rendered over camera
    this.darknessOverlay = this.add.renderTexture(0, 0, width, height);
    this.darknessOverlay.setScrollFactor(0);
    this.darknessOverlay.setDepth(20);
    this.darknessOverlay.setAlpha(0.88);
  }

  private createHUD(): void {
    const { width, height } = this.scale;
    this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(30);

    // Top HUD Bar Background
    const topBar = this.add.rectangle(width / 2, 28, width - 24, 44, 0x030712, 0.85);
    topBar.setStrokeStyle(1.5, 0x1e293b);
    this.hudContainer.add(topBar);

    // 1. Oxygen HUD
    const oxyLabel = this.add.text(24, 14, 'OXYGEN', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#38bdf8',
    });
    const oxyBg = this.add.rectangle(24 + 55, 30, 110, 12, 0x1e293b).setStrokeStyle(1, 0x475569);
    this.oxygenBar = this.add.rectangle(24 + 55, 30, 108, 10, 0x0284c7);
    this.hudContainer.add([oxyLabel, oxyBg, this.oxygenBar]);

    // 2. Battery HUD
    const batLabel = this.add.text(170, 14, 'BATTERY', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#facc15',
    });
    const batBg = this.add.rectangle(170 + 55, 30, 110, 12, 0x1e293b).setStrokeStyle(1, 0x475569);
    this.batteryBar = this.add.rectangle(170 + 55, 30, 108, 10, 0xeab308);
    this.hudContainer.add([batLabel, batBg, this.batteryBar]);

    // 3. Hull HUD
    const hullLabel = this.add.text(315, 14, 'HULL', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#4ade80',
    });
    const hullBg = this.add.rectangle(315 + 55, 30, 110, 12, 0x1e293b).setStrokeStyle(1, 0x475569);
    this.hullBar = this.add.rectangle(315 + 55, 30, 108, 10, 0x22c55e);
    this.hudContainer.add([hullLabel, hullBg, this.hullBar]);

    // 4. Coins Display
    this.coinHudText = this.add.text(465, 18, `🪙 ${this.saveState.playerStats.coins}g`, {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#fbbf24',
    });
    this.hudContainer.add(this.coinHudText);

    // 5. Depth Display
    this.depthHudText = this.add.text(width - 240, 18, 'DEPTH: 0m', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });
    this.hudContainer.add(this.depthHudText);

    // 6. Sonar Cooldown Indicator (top right)
    const sonarCircleBg = this.add.circle(width - 60, 28, 18, 0x0f172a).setStrokeStyle(1.5, 0x0284c7);
    this.pingCooldownArc = this.add.circle(width - 60, 28, 15, 0x38bdf8);
    const pingIconText = this.add
      .text(width - 60, 28, '📡', { fontSize: '13px' })
      .setOrigin(0.5);
    this.hudContainer.add([sonarCircleBg, this.pingCooldownArc, pingIconText]);

    // Prompt banner (e.g. "Surface Dock: Press E to Shop", "Chest: Press E to Salvage")
    this.promptText = this.add
      .text(width / 2, height - 70, '', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#fbbf24',
        backgroundColor: '#030712',
        padding: { x: 14, y: 7 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.hudContainer.add(this.promptText);

    // Pause / Menu button
    const menuBtn = this.add.rectangle(width - 110, 28, 60, 28, 0x1e293b).setStrokeStyle(1, 0x475569);
    menuBtn.setInteractive({ useHandCursor: true });
    const menuLabel = this.add.text(width - 110, 28, 'MENU', {
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#e2e8f0',
    }).setOrigin(0.5);
    menuBtn.on('pointerdown', () => this.scene.start('MainMenuScene'));
    this.hudContainer.add([menuBtn, menuLabel]);
  }

  private setupTouchControls(): void {
    const { width, height } = this.scale;

    // Left Virtual Joystick
    const joyX = 90;
    const joyY = height - 90;

    this.touchJoystickBase = this.add.image(joyX, joyY, 'joystick_base').setScrollFactor(0).setDepth(35).setAlpha(0.6);
    this.touchJoystickThumb = this.add.image(joyX, joyY, 'joystick_thumb').setScrollFactor(0).setDepth(36).setAlpha(0.85);

    this.touchJoystickBase.setInteractive();

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < width / 3 && pointer.y > height / 2) {
        this.touchActive = true;
        this.updateTouchVector(pointer.x, pointer.y, joyX, joyY);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.touchActive) {
        this.updateTouchVector(pointer.x, pointer.y, joyX, joyY);
      }
    });

    this.input.on('pointerup', () => {
      this.touchActive = false;
      this.touchVector = { x: 0, y: 0 };
      if (this.touchJoystickThumb) {
        this.touchJoystickThumb.setPosition(joyX, joyY);
      }
    });

    // Right Action Buttons
    // 1. Sonar Button
    const sonarBtnX = width - 80;
    const sonarBtnY = height - 80;
    const sonarBtn = this.add.image(sonarBtnX, sonarBtnY, 'action_btn').setScrollFactor(0).setDepth(35).setScale(0.9);
    sonarBtn.setInteractive();
    this.add
      .text(sonarBtnX, sonarBtnY, 'SONAR\n(SPACE)', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
      })
      .setScrollFactor(0)
      .setDepth(36)
      .setOrigin(0.5);

    sonarBtn.on('pointerdown', () => this.triggerSonarPing());

    // 2. Salvage / Action Button
    const salvageBtnX = width - 165;
    const salvageBtnY = height - 80;
    const salvageBtn = this.add.image(salvageBtnX, salvageBtnY, 'action_btn').setScrollFactor(0).setDepth(35).setScale(0.9);
    salvageBtn.setInteractive();
    this.add
      .text(salvageBtnX, salvageBtnY, 'SALVAGE\n(E)', {
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#fbbf24',
        align: 'center',
      })
      .setScrollFactor(0)
      .setDepth(36)
      .setOrigin(0.5);

    salvageBtn.on('pointerdown', () => this.handleActionInteract());
  }

  private updateTouchVector(px: number, py: number, cx: number, cy: number): void {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 45;

    if (dist <= maxDist) {
      this.touchVector = { x: dx / maxDist, y: dy / maxDist };
      this.touchJoystickThumb?.setPosition(px, py);
    } else {
      const angle = Math.atan2(dy, dx);
      this.touchVector = { x: Math.cos(angle), y: Math.sin(angle) };
      this.touchJoystickThumb?.setPosition(cx + Math.cos(angle) * maxDist, cy + Math.sin(angle) * maxDist);
    }
  }

  private setupKeyboardControls(): void {
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyF3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F3);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.keySpace.on('down', () => this.triggerSonarPing());
    this.keyE.on('down', () => this.handleActionInteract());
    this.keyF3.on('down', () => {
      this.debugVisible = !this.debugVisible;
      this.debugText.setVisible(this.debugVisible);
    });
    this.keyEsc.on('down', () => this.scene.start('MainMenuScene'));
  }

  private createDebugOverlay(): void {
    this.debugText = this.add
      .text(16, 65, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#4ade80',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: { x: 8, y: 6 },
      })
      .setScrollFactor(0)
      .setDepth(50)
      .setVisible(false);
  }

  update(time: number, delta: number): void {
    if (this.isMiniGameActive || this.isRespawning) return;

    const dt = delta / 1000;

    // 1. Process Movement & Water Physics
    this.handleSubmarineMovement();

    // 2. Resource Tick & Depletion
    this.handleResources(dt);

    // 3. Sonar Ring Expansion & Warmer/Colder Proximity Check
    this.updateSonarRings(time, dt);

    // 4. Update Hazards & Drone
    this.updateHazardsAndDrone(time, dt);

    // 5. Update Bolt Companion Swimming AI
    this.updateBoltCompanion(dt);

    // 6. Update Dynamic Darkness & Flashlight Cone Mask
    this.updateDarknessLighting();

    // 7. Update HUD & Prompts
    this.updateHUD(time);

    // 8. Update Debug Overlay
    if (this.debugVisible) {
      this.updateDebugOverlay();
    }
  }

  private handleSubmarineMovement(): void {
    const accel = 420 + (this.saveState.upgrades.engine - 1) * 80;

    let moveX = 0;
    let moveY = 0;

    // Keyboard inputs
    if (this.cursors.left.isDown || this.keyA.isDown) moveX -= 1;
    if (this.cursors.right.isDown || this.keyD.isDown) moveX += 1;
    if (this.cursors.up.isDown || this.keyW.isDown) moveY -= 1;
    if (this.cursors.down.isDown || this.keyS.isDown) moveY += 1;

    // Touch vector inputs
    if (this.touchActive) {
      moveX += this.touchVector.x;
      moveY += this.touchVector.y;
    }

    // Water currents hazard check
    this.zone.hazards
      .filter((h) => h.type === 'current')
      .forEach((curr) => {
        if (
          curr.width &&
          curr.height &&
          this.sub.x >= curr.x &&
          this.sub.x <= curr.x + curr.width &&
          this.sub.y >= curr.y &&
          this.sub.y <= curr.y + curr.height
        ) {
          moveX += (curr.forceX ?? 0) / 100;
          moveY += (curr.forceY ?? 0) / 100;
        }
      });

    // Apply acceleration
    if (moveX !== 0 || moveY !== 0) {
      this.sub.setAcceleration(moveX * accel, moveY * accel);
      this.bubbleEmitter.setPosition(this.propeller.x, this.propeller.y);
      this.bubbleEmitter.start();

      // Alternate propeller frame
      const propFrame = Math.floor(this.time.now / 90) % 2 === 0 ? 'sub_propeller_1' : 'sub_propeller_2';
      this.propeller.setTexture(propFrame);
    } else {
      this.sub.setAcceleration(0, 0);
      this.bubbleEmitter.stop();
    }

    // Sprite facing & angle tilt
    if (moveX > 0.1) {
      this.sub.setFlipX(false);
      this.propeller.setPosition(this.sub.x - 34, this.sub.y + 2);
      this.subLightCone.setPosition(this.sub.x + 36, this.sub.y + 2);
      this.subLightCone.setFlipX(false);
    } else if (moveX < -0.1) {
      this.sub.setFlipX(true);
      this.propeller.setPosition(this.sub.x + 34, this.sub.y + 2);
      this.subLightCone.setPosition(this.sub.x - 36, this.sub.y + 2);
      this.subLightCone.setFlipX(true);
    } else {
      this.propeller.setPosition(this.sub.flipX ? this.sub.x + 34 : this.sub.x - 34, this.sub.y + 2);
      this.subLightCone.setPosition(this.sub.flipX ? this.sub.x - 36 : this.sub.x + 36, this.sub.y + 2);
    }

    // Subtle pitch tilt based on vertical movement
    const vy = this.sub.body ? this.sub.body.velocity.y : 0;
    const targetAngle = Phaser.Math.Clamp(vy * 0.05, -14, 14);
    this.sub.setAngle(targetAngle);
    this.subLightCone.setAngle(targetAngle + (this.sub.flipX ? 180 : 0));
  }

  private handleResources(dt: number): void {
    const isSubmerged = this.sub.y > this.zone.surfaceY;
    const inAirPocket = this.zone.airPockets.some(
      (ap) => SonarSystem.getDistance(this.sub.x, this.sub.y, ap.x, ap.y) <= ap.radius
    );
    const lampActive = this.saveState.playerStats.battery > 0;

    const result = ResourceSystem.tick(
      this.saveState.playerStats,
      dt,
      isSubmerged,
      inAirPocket,
      lampActive
    );

    this.saveState.playerStats.oxygen = result.oxygen;
    this.saveState.playerStats.battery = result.battery;
    this.saveState.playerStats.hull = result.hull;
    this.saveState.playerStats.coins = result.coins;

    // Siren alarm when oxygen is low (< 20%)
    if (isSubmerged && result.oxygen < 20 && Math.floor(this.time.now / 1200) % 2 === 0) {
      SoundSystem.getInstance().playSiren();
    }

    // Oxygen Blackout Check
    if (result.isBlackout) {
      this.triggerBlackoutRespawn();
    }
  }

  private triggerBlackoutRespawn(): void {
    this.isRespawning = true;
    SoundSystem.getInstance().playHit();
    this.showBoltMessage('CAPTAIN! OXYGEN DEPLETED! Emergency rescue sub deployed!');

    this.cameras.main.fade(1000, 3, 10, 22);

    this.time.delayedCall(1200, () => {
      // Reposition at surface dock
      this.sub.setPosition(this.zone.dock.x, this.zone.dock.y + 40);
      this.sub.setVelocity(0, 0);
      this.sub.setAcceleration(0, 0);
      SaveSystem.saveGame(this.saveState);

      this.cameras.main.resetFX();
      this.isRespawning = false;
      this.showBoltMessage('Safely back at Dr. Coral’s dock. Dive again when ready!');
    });
  }

  private triggerSonarPing(): void {
    if (!SonarSystem.canPing(this.lastPingTime, this.time.now)) return;

    this.lastPingTime = this.time.now;
    SoundSystem.getInstance().playSonarPing();

    const derived = ResourceSystem.getUpgradeDerivedStats(this.saveState.upgrades);
    const maxRadius = derived.sonarRange;

    // Expanding visual sonar ring
    const ring = this.add.circle(this.sub.x, this.sub.y, 10, 0x00f5ff, 0.05);
    ring.setStrokeStyle(3, 0x38bdf8, 0.85);
    ring.setDepth(14);

    this.sonarRings.push({
      circle: ring,
      maxRadius,
      currentRadius: 10,
      speed: 460, // ring expansion speed px/sec
    });

    // Check Rival Drone Stun
    if (this.rivalDrone && SonarSystem.isWithinStunBurst(this.sub.x, this.sub.y, this.rivalDrone.x, this.rivalDrone.y)) {
      this.rivalDroneStunnedUntil = this.time.now + SonarSystem.STUN_DURATION_MS;
      SoundSystem.getInstance().playDroneStun();
      this.showBoltMessage('Rival drone STUNNED by sonar pulse! Grab the treasure now!');

      // Drone electricity flicker tween
      this.tweens.add({
        targets: this.rivalDrone,
        alpha: { from: 0.2, to: 1 },
        duration: 100,
        repeat: 8,
      });
    }

    // Ping treasures within range
    this.zone.treasures.forEach((t) => {
      if (this.saveState.playerStats.collectedTreasures.includes(t.id)) return;

      const feedback = SonarSystem.calculateProximityFeedback(
        this.sub.x,
        this.sub.y,
        t.x,
        t.y,
        maxRadius,
        t.id
      );

      if (feedback.inRange) {
        this.activeTreasurePings.set(t.id, {
          pulseTimer: 0,
          feedback,
        });

        const sprite = this.treasureSprites.get(t.id);
        const beacon = this.treasureBeacons.get(t.id);

        if (sprite) {
          sprite.setAlpha(feedback.alpha);
        }
        if (beacon) {
          beacon.setAlpha(1);
          beacon.setScale(1);
          this.tweens.add({
            targets: beacon,
            scale: 2.2,
            alpha: 0,
            duration: 1200,
            ease: 'Cubic.easeOut',
          });
        }
      }
    });
  }

  private updateSonarRings(time: number, dt: number): void {
    // Expand active visual sonar rings
    for (let i = this.sonarRings.length - 1; i >= 0; i--) {
      const ring = this.sonarRings[i]!;
      ring.currentRadius += ring.speed * dt;
      ring.circle.setRadius(ring.currentRadius);
      const alpha = Math.max(0, 0.85 * (1 - ring.currentRadius / ring.maxRadius));
      ring.circle.setStrokeStyle(2.5, 0x38bdf8, alpha);

      if (ring.currentRadius >= ring.maxRadius) {
        ring.circle.destroy();
        this.sonarRings.splice(i, 1);
      }
    }

    // Check closest nearby treasure for warmer/colder feedback
    const derived = ResourceSystem.getUpgradeDerivedStats(this.saveState.upgrades);
    let closestDist = Infinity;
    let closestFeedback: TreasurePingFeedback | null = null;
    let closestTreasure: TreasureItem | null = null;

    this.zone.treasures.forEach((t) => {
      if (this.saveState.playerStats.collectedTreasures.includes(t.id)) return;

      const feedback = SonarSystem.calculateProximityFeedback(
        this.sub.x,
        this.sub.y,
        t.x,
        t.y,
        derived.sonarRange,
        t.id
      );

      if (feedback.inRange && feedback.distance < closestDist) {
        closestDist = feedback.distance;
        closestFeedback = feedback;
        closestTreasure = t;
      }
    });

    this.activeNearbyTreasure = closestDist < 75 ? closestTreasure : null;

    // Warmer/Colder pulsing audio blip
    if (closestFeedback && (closestFeedback as TreasurePingFeedback).inRange) {
      const fb = closestFeedback as TreasurePingFeedback;
      if (time >= this.proximityBeepCooldown) {
        SoundSystem.getInstance().playProximityBlip(fb.pitchHz);
        this.proximityBeepCooldown = time + fb.pulseIntervalMs;

        // Visual flash on treasure sprite
        const sp = this.treasureSprites.get(fb.id);
        if (sp) {
          sp.setAlpha(1);
          this.tweens.add({
            targets: sp,
            alpha: 0.45,
            duration: fb.pulseIntervalMs * 0.7,
          });
        }
      }
    }
  }

  private updateHazardsAndDrone(time: number, dt: number): void {
    // Check mine collisions
    this.zone.hazards
      .filter((h) => h.type === 'mine')
      .forEach((mine) => {
        const dist = SonarSystem.getDistance(this.sub.x, this.sub.y, mine.x, mine.y);
        if (dist <= 40) {
          SoundSystem.getInstance().playHit();
          this.cameras.main.shake(300, 0.02);
          const dmgResult = ResourceSystem.applyDamage(this.saveState.playerStats, mine.damage);
          this.saveState.playerStats.hull = dmgResult.hull;

          // Reposition mine away
          mine.y += 1000;
          const sp = this.hazardSprites.get(mine.id);
          if (sp) sp.setVisible(false);

          if (dmgResult.destroyed) {
            this.triggerBlackoutRespawn();
          }
        }
      });

    // Check electric eel shock
    this.zone.hazards
      .filter((h) => h.type === 'eel')
      .forEach((eel) => {
        const sp = this.hazardSprites.get(eel.id);
        if (sp && sp.visible) {
          const dist = SonarSystem.getDistance(this.sub.x, this.sub.y, sp.x, sp.y);
          if (dist <= 48) {
            SoundSystem.getInstance().playHit();
            const dmgResult = ResourceSystem.applyDamage(this.saveState.playerStats, eel.damage * dt * 2);
            this.saveState.playerStats.hull = dmgResult.hull;
            if (dmgResult.destroyed) this.triggerBlackoutRespawn();
          }
        }
      });

    // Check giant squid tentacle hazard
    this.zone.hazards
      .filter((h) => h.type === 'squid_tentacle')
      .forEach((tent) => {
        const dist = SonarSystem.getDistance(this.sub.x, this.sub.y, tent.x, tent.y);
        if (dist <= 65) {
          SoundSystem.getInstance().playHit();
          this.cameras.main.shake(200, 0.015);
          const dmgResult = ResourceSystem.applyDamage(this.saveState.playerStats, tent.damage);
          this.saveState.playerStats.hull = dmgResult.hull;
          if (dmgResult.destroyed) this.triggerBlackoutRespawn();
        }
      });

    // Update Rival Drone AI
    if (this.rivalDrone && this.rivalDrone.active) {
      if (time < this.rivalDroneStunnedUntil) {
        // Drone is stunned
        this.rivalDrone.setVelocity(0, 0);
        return;
      }

      // Pursue submarine if player carries coins or is deep
      const droneDist = SonarSystem.getDistance(this.sub.x, this.sub.y, this.rivalDrone.x, this.rivalDrone.y);
      if (droneDist < 600) {
        const angle = Math.atan2(this.sub.y - this.rivalDrone.y, this.sub.x - this.rivalDrone.x);
        const droneSpeed = 135;
        this.rivalDrone.setVelocity(Math.cos(angle) * droneSpeed, Math.sin(angle) * droneSpeed);
        this.rivalDrone.setFlipX(this.sub.x < this.rivalDrone.x);

        // Drone attack / collision
        if (droneDist < 42) {
          SoundSystem.getInstance().playHit();
          this.cameras.main.shake(250, 0.018);
          // Steal coins
          const stolen = Math.min(25, this.saveState.playerStats.coins);
          this.saveState.playerStats.coins -= stolen;
          this.showBoltMessage(`Baron Rust's drone pilfered ${stolen} gold! Ping Sonar to stun it!`);

          // Knock drone back
          this.rivalDrone.setPosition(this.rivalDrone.x - Math.cos(angle) * 120, this.rivalDrone.y - Math.sin(angle) * 120);
        }
      }
    }
  }

  private updateBoltCompanion(dt: number): void {
    // Bolt follows submarine smoothly with a small offset
    const targetX = this.sub.flipX ? this.sub.x + 55 : this.sub.x - 55;
    const targetY = this.sub.y - 25;

    this.boltFish.x += (targetX - this.boltFish.x) * 4 * dt;
    this.boltFish.y += (targetY - this.boltFish.y) * 4 * dt;
    this.boltFish.setFlipX(this.sub.flipX);

    // Keep speech bubble attached above Bolt
    this.boltBubbleContainer.setPosition(this.boltFish.x, this.boltFish.y - 40);
  }

  private updateDarknessLighting(): void {
    this.darknessOverlay.clear();

    // Dark ambient depending on sub depth
    const depthRatio = Math.max(0, Math.min(1, (this.sub.y - this.zone.surfaceY) / (this.zone.height - this.zone.surfaceY)));
    const darknessAlpha = 0.35 + depthRatio * 0.58;

    this.darknessOverlay.fill(0x020617, darknessAlpha);

    // Erase flashlight cutout where lamp shines
    if (this.saveState.playerStats.battery > 0) {
      // Sub position in camera viewport space
      const screenX = this.sub.x - this.cameras.main.scrollX;
      const screenY = this.sub.y - this.cameras.main.scrollY;

      this.darknessOverlay.erase('light_cone', screenX + (this.sub.flipX ? -28 : 28), screenY);
    }
  }

  private updateHUD(time: number): void {
    const stats = this.saveState.playerStats;

    // Oxygen
    const oxyRatio = Math.max(0, stats.oxygen / stats.maxOxygen);
    this.oxygenBar.setScale(oxyRatio, 1);
    this.oxygenBar.setFillStyle(oxyRatio < 0.25 ? 0xef4444 : 0x0284c7);

    // Battery
    const batRatio = Math.max(0, stats.battery / stats.maxBattery);
    this.batteryBar.setScale(batRatio, 1);

    // Hull
    const hullRatio = Math.max(0, stats.hull / stats.maxHull);
    this.hullBar.setScale(hullRatio, 1);

    // Coins
    this.coinHudText.setText(`🪙 ${stats.coins}g`);

    // Depth in meters (10px = 1 meter approx)
    const depthMeters = Math.max(0, Math.round((this.sub.y - this.zone.surfaceY) / 10));
    this.depthHudText.setText(`DEPTH: ${depthMeters}m`);

    // Sonar Cooldown Arc
    const cdProgress = SonarSystem.getCooldownProgress(this.lastPingTime, time);
    this.pingCooldownArc.setScale(1 - cdProgress);
    this.pingCooldownArc.setFillStyle(cdProgress === 0 ? 0x38bdf8 : 0x64748b);

    // Context Prompts (Surface Dock or Chest Salvage)
    const isAtDock =
      this.sub.y <= this.zone.surfaceY + 30 &&
      Math.abs(this.sub.x - this.zone.dock.x) < 140;

    if (isAtDock) {
      this.promptText.setText('Surface Dock: Press E or Tap SALVAGE to Enter Workshop').setVisible(true);
    } else if (this.activeNearbyTreasure) {
      const isCrown = this.activeNearbyTreasure.isCrownPiece;
      this.promptText
        .setText(`${isCrown ? '👑 TIDE CROWN PIECE' : 'SUNKEN CHEST'}: Press E or Tap SALVAGE to Grapple!`)
        .setVisible(true);
    } else {
      this.promptText.setVisible(false);
    }
  }

  private handleActionInteract(): void {
    const isAtDock =
      this.sub.y <= this.zone.surfaceY + 30 &&
      Math.abs(this.sub.x - this.zone.dock.x) < 140;

    if (isAtDock) {
      // Enter Shop Scene
      SaveSystem.saveGame(this.saveState);
      this.scene.start('ShopScene', { returnTo: 'GameScene' });
      return;
    }

    if (this.activeNearbyTreasure) {
      this.launchSalvageMiniGame(this.activeNearbyTreasure);
    }
  }

  private launchSalvageMiniGame(treasure: TreasureItem): void {
    this.isMiniGameActive = true;
    this.sub.setVelocity(0, 0);
    this.sub.setAcceleration(0, 0);

    this.scene.launch('SalvageMiniGameScene', {
      treasure,
      onComplete: (success: boolean) => {
        this.isMiniGameActive = false;
        if (success) {
          this.onTreasureSalvaged(treasure);
        }
      },
    });
  }

  private onTreasureSalvaged(treasure: TreasureItem): void {
    // Record treasure
    this.saveState.playerStats.collectedTreasures.push(treasure.id);
    this.saveState.playerStats.coins += treasure.value;

    // Hide treasure sprite & beacon
    const sp = this.treasureSprites.get(treasure.id);
    if (sp) {
      sp.setTexture('chest_open');
      this.tweens.add({
        targets: sp,
        alpha: 0,
        y: sp.y - 30,
        duration: 1000,
        onComplete: () => sp.destroy(),
      });
    }

    if (treasure.isCrownPiece) {
      if (!this.saveState.playerStats.collectedCrownPieces.includes(this.zone.id)) {
        this.saveState.playerStats.collectedCrownPieces.push(this.zone.id);
      }
      // Unlock next zone
      if (this.zone.id < 5 && !this.saveState.unlockedZones.includes(this.zone.id + 1)) {
        this.saveState.unlockedZones.push(this.zone.id + 1);
      }
      this.showBoltMessage('VICTORY! Tide Crown fragment retrieved! The next zone depth is unlocked!');
    } else {
      this.showBoltMessage(`Splendid recovery, Mina! +${treasure.value} Gold added to ship vault!`);
    }

    SaveSystem.saveGame(this.saveState);
  }

  private updateDebugOverlay(): void {
    const fps = Math.round(this.game.loop.actualFps);
    const subX = Math.round(this.sub.x);
    const subY = Math.round(this.sub.y);
    const vx = this.sub.body ? Math.round(this.sub.body.velocity.x) : 0;
    const vy = this.sub.body ? Math.round(this.sub.body.velocity.y) : 0;
    const activeEntities = this.children.length;

    this.debugText.setText(
      `[DEBUG OVERLAY (F3)]\n` +
      `FPS: ${fps}\n` +
      `Pos: (${subX}, ${subY})\n` +
      `Vel: (${vx}, ${vy})\n` +
      `O₂: ${Math.round(this.saveState.playerStats.oxygen)} | Bat: ${Math.round(this.saveState.playerStats.battery)} | HP: ${Math.round(this.saveState.playerStats.hull)}\n` +
      `Entities: ${activeEntities} | Active Rings: ${this.sonarRings.length}`
    );
  }
}
