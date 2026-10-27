import Phaser from 'phaser';

export class TextureGenerator {
  public static generateAllTextures(scene: Phaser.Scene): void {
    const tm = scene.textures;

    if (!tm.exists('sub_body')) this.generateSubmarine(tm);
    if (!tm.exists('sub_propeller_1')) this.generatePropeller(tm);
    if (!tm.exists('bolt_fish')) this.generateBoltFish(tm);
    if (!tm.exists('mina_diver')) this.generateMinaDiver(tm);
    if (!tm.exists('baron_drone')) this.generateBaronDrone(tm);
    if (!tm.exists('chest_closed')) this.generateChest(tm);
    if (!tm.exists('crown_piece')) this.generateCrownPiece(tm);
    if (!tm.exists('mine_hazard')) this.generateMine(tm);
    if (!tm.exists('eel_hazard')) this.generateEel(tm);
    if (!tm.exists('creature_turtle')) this.generateTurtle(tm);
    if (!tm.exists('creature_jellyfish_1')) this.generateJellyfish(tm);
    if (!tm.exists('creature_angler')) this.generateAnglerFish(tm);
    if (!tm.exists('squid_tentacle')) this.generateSquidTentacle(tm);
    if (!tm.exists('air_bubble')) this.generateBubble(tm);
    if (!tm.exists('coin')) this.generateCoin(tm);
    if (!tm.exists('light_cone')) this.generateLightCone(tm);
    if (!tm.exists('sonar_blip')) this.generateSonarBlip(tm);
    if (!tm.exists('joystick_base')) this.generateJoystickUI(tm);
    if (!tm.exists('seaweed')) this.generateSeaweed(tm);
  }

  private static createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return [canvas, ctx];
  }

  private static generateSubmarine(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(84, 52);

    // Submarine Hull (Yellow-Orange Dive Sub)
    ctx.save();
    ctx.translate(42, 26);

    // Main capsule body
    ctx.fillStyle = '#f59e0b'; // Amber yellow
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(2, 2, 34, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Upper conning tower / hatch
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.roundRect(-8, -24, 16, 12, [4, 4, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Periscope / antenna
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(0, -32);
    ctx.lineTo(5, -32);
    ctx.stroke();

    // Large glass dome cockpit (Front / right)
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(22, 0, 11, -Math.PI / 2, Math.PI / 2, false);
    ctx.fill();
    ctx.stroke();

    // Cockpit glare
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(20, -4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Headlight housing (Front nose)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(33, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Keel & dive fin
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(-16, 16);
    ctx.lineTo(-24, 24);
    ctx.lineTo(-6, 18);
    ctx.closePath();
    ctx.fill();

    // Rivets
    ctx.fillStyle = '#78350f';
    [-18, -6, 6].forEach((rx) => {
      ctx.beginPath();
      ctx.arc(rx, 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
    tm.addCanvas('sub_body', canvas);
  }

  private static generatePropeller(tm: Phaser.Textures.TextureManager): void {
    // Frame 1
    const [c1, ctx1] = this.createCanvas(24, 32);
    ctx1.fillStyle = '#64748b';
    ctx1.strokeStyle = '#334155';
    ctx1.lineWidth = 2;
    ctx1.beginPath();
    ctx1.ellipse(12, 16, 4, 14, 0, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.stroke();
    tm.addCanvas('sub_propeller_1', c1);

    // Frame 2 (rotated)
    const [c2, ctx2] = this.createCanvas(24, 32);
    ctx2.fillStyle = '#64748b';
    ctx2.strokeStyle = '#334155';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.ellipse(12, 16, 14, 4, 0, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.stroke();
    tm.addCanvas('sub_propeller_2', c2);
  }

  private static generateBoltFish(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(44, 30);
    ctx.save();
    ctx.translate(22, 15);

    // Robot body (Silver cyan)
    ctx.fillStyle = '#06b6d4';
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.quadraticCurveTo(0, -10, -10, 0);
    ctx.quadraticCurveTo(0, 10, 14, 0);
    ctx.fill();
    ctx.stroke();

    // Tail fin (Mechanical)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-18, -7);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-18, 7);
    ctx.closePath();
    ctx.fill();

    // Glowing LED Eye
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(6, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pupil
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, -2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    tm.addCanvas('bolt_fish', canvas);
  }

  private static generateMinaDiver(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(40, 50);
    ctx.save();
    ctx.translate(20, 25);

    // Diving suit body (Turquoise)
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-10, -12, 20, 26, 6);
    ctx.fill();
    ctx.stroke();

    // Brass Helmet
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -14, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Visor glass
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(2, -14, 5, -Math.PI / 2, Math.PI / 2);
    ctx.fill();

    // Scuba tank on back
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-14, -8, 4, 16);

    ctx.restore();
    tm.addCanvas('mina_diver', canvas);
  }

  private static generateBaronDrone(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(56, 44);
    ctx.save();
    ctx.translate(28, 22);

    // Rust Bronze spiky casing
    ctx.fillStyle = '#9a3412';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(8, -14);
    ctx.lineTo(-14, -10);
    ctx.lineTo(-20, 0);
    ctx.lineTo(-14, 10);
    ctx.lineTo(8, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Sinister red sensor eye
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(6, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Grabber claws
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(12, 6);
    ctx.lineTo(22, 10);
    ctx.lineTo(24, 5);
    ctx.moveTo(12, -6);
    ctx.lineTo(22, -10);
    ctx.lineTo(24, -5);
    ctx.stroke();

    ctx.restore();
    tm.addCanvas('baron_drone', canvas);
  }

  private static generateChest(tm: Phaser.Textures.TextureManager): void {
    // Closed chest
    const [c1, ctx1] = this.createCanvas(48, 42);
    ctx1.save();
    ctx1.translate(24, 21);

    // Wood base
    ctx1.fillStyle = '#78350f';
    ctx1.strokeStyle = '#451a03';
    ctx1.lineWidth = 2;
    ctx1.beginPath();
    ctx1.roundRect(-18, -4, 36, 20, 3);
    ctx1.fill();
    ctx1.stroke();

    // Curved lid
    ctx1.fillStyle = '#92400e';
    ctx1.beginPath();
    ctx1.arc(0, -4, 18, Math.PI, 0, false);
    ctx1.closePath();
    ctx1.fill();
    ctx1.stroke();

    // Gold brass bands & lock
    ctx1.fillStyle = '#fbbf24';
    ctx1.strokeStyle = '#d97706';
    ctx1.lineWidth = 1.5;
    ctx1.fillRect(-14, -14, 4, 30);
    ctx1.fillRect(10, -14, 4, 30);

    // Keyhole lock
    ctx1.beginPath();
    ctx1.arc(0, 2, 4, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.fillStyle = '#000000';
    ctx1.beginPath();
    ctx1.arc(0, 1.5, 1.5, 0, Math.PI * 2);
    ctx1.fill();

    ctx1.restore();
    tm.addCanvas('chest_closed', c1);

    // Open chest
    const [c2, ctx2] = this.createCanvas(48, 44);
    ctx2.save();
    ctx2.translate(24, 22);

    // Base
    ctx2.fillStyle = '#78350f';
    ctx2.fillRect(-18, 0, 36, 18);

    // Glowing treasure inside
    ctx2.fillStyle = '#fbbf24';
    ctx2.beginPath();
    ctx2.ellipse(0, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx2.fill();

    // Open lid flipped back
    ctx2.fillStyle = '#92400e';
    ctx2.beginPath();
    ctx2.ellipse(0, -12, 18, 6, 0, 0, Math.PI * 2);
    ctx2.fill();

    ctx2.restore();
    tm.addCanvas('chest_open', c2);
  }

  private static generateCrownPiece(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(46, 46);
    ctx.save();
    ctx.translate(23, 23);

    // Golden radiant aura
    ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.fill();

    // Gilded crown crest
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-16, 10);
    ctx.lineTo(-14, -8);
    ctx.lineTo(-7, 2);
    ctx.lineTo(0, -14);
    ctx.lineTo(7, 2);
    ctx.lineTo(14, -8);
    ctx.lineTo(16, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central Sapphire jewel
    ctx.fillStyle = '#0ea5e9';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
    tm.addCanvas('crown_piece', canvas);
  }

  private static generateMine(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(48, 48);
    ctx.save();
    ctx.translate(24, 24);

    // Mine sphere
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Spikes (horns)
    ctx.fillStyle = '#475569';
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-3, -15);
      ctx.lineTo(0, -22);
      ctx.lineTo(3, -15);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Blinking trigger light
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    tm.addCanvas('mine_hazard', canvas);
  }

  private static generateEel(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(72, 34);
    ctx.save();
    ctx.translate(36, 17);

    // Serpentine electric body
    ctx.fillStyle = '#6366f1';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(15, -12, 0, 0);
    ctx.quadraticCurveTo(-15, 12, -30, 0);
    ctx.quadraticCurveTo(-15, 16, 0, 5);
    ctx.quadraticCurveTo(15, -6, 30, 0);
    ctx.fill();
    ctx.stroke();

    // Lightning spark eye
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(24, -2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    tm.addCanvas('eel_hazard', canvas);
  }

  private static generateTurtle(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(64, 48);
    ctx.save();
    ctx.translate(32, 24);

    // Shell
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Shell scutes
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(-8, -6, 16, 12);

    // Head
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(22, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // Flippers
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.ellipse(10, -14, 10, 4, -0.4, 0, Math.PI * 2);
    ctx.ellipse(10, 14, 10, 4, 0.4, 0, Math.PI * 2);
    ctx.ellipse(-14, -10, 6, 3, -0.3, 0, Math.PI * 2);
    ctx.ellipse(-14, 10, 6, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    tm.addCanvas('creature_turtle', canvas);
  }

  private static generateJellyfish(tm: Phaser.Textures.TextureManager): void {
    // Frame 1
    const [c1, ctx1] = this.createCanvas(44, 52);
    ctx1.save();
    ctx1.translate(22, 18);

    // Bell dome
    ctx1.fillStyle = 'rgba(236, 72, 153, 0.7)';
    ctx1.strokeStyle = '#f43f5e';
    ctx1.lineWidth = 2;
    ctx1.beginPath();
    ctx1.arc(0, 0, 16, Math.PI, 0, false);
    ctx1.quadraticCurveTo(0, 4, 0, 0);
    ctx1.fill();
    ctx1.stroke();

    // Tentacles
    ctx1.strokeStyle = 'rgba(244, 63, 94, 0.6)';
    ctx1.lineWidth = 1.5;
    for (let x = -10; x <= 10; x += 5) {
      ctx1.beginPath();
      ctx1.moveTo(x, 0);
      ctx1.quadraticCurveTo(x + 4, 14, x, 28);
      ctx1.stroke();
    }
    ctx1.restore();
    tm.addCanvas('creature_jellyfish_1', c1);

    // Frame 2
    const [c2, ctx2] = this.createCanvas(44, 52);
    ctx2.save();
    ctx2.translate(22, 18);

    ctx2.fillStyle = 'rgba(236, 72, 153, 0.8)';
    ctx2.strokeStyle = '#f43f5e';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.arc(0, 0, 18, Math.PI, 0, false);
    ctx2.fill();
    ctx2.stroke();

    ctx2.strokeStyle = 'rgba(244, 63, 94, 0.7)';
    ctx2.lineWidth = 1.5;
    for (let x = -10; x <= 10; x += 5) {
      ctx2.beginPath();
      ctx2.moveTo(x, 0);
      ctx2.quadraticCurveTo(x - 4, 12, x + 2, 26);
      ctx2.stroke();
    }
    ctx2.restore();
    tm.addCanvas('creature_jellyfish_2', c2);
  }

  private static generateAnglerFish(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(56, 44);
    ctx.save();
    ctx.translate(28, 22);

    // Body
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 2, 18, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Big toothy mouth
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(8, 2);
    ctx.lineTo(16, 5);
    ctx.lineTo(12, 8);
    ctx.lineTo(16, 11);
    ctx.lineTo(8, 10);
    ctx.fill();

    // Stalk and glowing esca (light)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-4, -12);
    ctx.quadraticCurveTo(4, -22, 16, -14);
    ctx.stroke();

    // Glowing bulb
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(16, -14, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    tm.addCanvas('creature_angler', canvas);
  }

  private static generateSquidTentacle(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(50, 160);
    ctx.save();
    ctx.translate(25, 80);

    // Tentacle gradient
    const grad = ctx.createLinearGradient(0, -80, 0, 80);
    grad.addColorStop(0, '#991b1b');
    grad.addColorStop(0.6, '#dc2626');
    grad.addColorStop(1, '#f87171');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-16, -80);
    ctx.quadraticCurveTo(24, 0, 0, 80);
    ctx.quadraticCurveTo(-14, 0, -16, -80);
    ctx.fill();

    // Suction cups
    ctx.fillStyle = '#fecaca';
    for (let y = -60; y <= 60; y += 22) {
      ctx.beginPath();
      ctx.arc(5, y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    tm.addCanvas('squid_tentacle', canvas);
  }

  private static generateBubble(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(24, 24);
    ctx.save();
    ctx.translate(12, 12);

    ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glint
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
    tm.addCanvas('air_bubble', canvas);
  }

  private static generateCoin(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(28, 28);
    ctx.save();
    ctx.translate(14, 14);

    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner rim
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Anchor emblem
    ctx.fillStyle = '#92400e';
    ctx.fillRect(-1.5, -5, 3, 9);
    ctx.fillRect(-4, -3, 8, 2);

    ctx.restore();
    tm.addCanvas('coin', canvas);
  }

  private static generateLightCone(tm: Phaser.Textures.TextureManager): void {
    // 640x360 cone mask for sub headlight
    const [canvas, ctx] = this.createCanvas(560, 320);

    const grad = ctx.createRadialGradient(20, 160, 10, 280, 160, 260);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
    grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.3)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(10, 160);
    ctx.lineTo(550, 20);
    ctx.lineTo(550, 300);
    ctx.closePath();
    ctx.fill();

    // Ambient circle around sub body
    const ambientGrad = ctx.createRadialGradient(80, 160, 10, 80, 160, 120);
    ambientGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    ambientGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.5)');
    ambientGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.beginPath();
    ctx.arc(80, 160, 120, 0, Math.PI * 2);
    ctx.fill();

    tm.addCanvas('light_cone', canvas);
  }

  private static generateSonarBlip(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(48, 48);
    ctx.save();
    ctx.translate(24, 24);

    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    tm.addCanvas('sonar_blip', canvas);
  }

  private static generateJoystickUI(tm: Phaser.Textures.TextureManager): void {
    // Joystick base
    const [c1, ctx1] = this.createCanvas(120, 120);
    ctx1.save();
    ctx1.translate(60, 60);
    ctx1.fillStyle = 'rgba(15, 23, 42, 0.5)';
    ctx1.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    ctx1.lineWidth = 3;
    ctx1.beginPath();
    ctx1.arc(0, 0, 52, 0, Math.PI * 2);
    ctx1.fill();
    ctx1.stroke();
    ctx1.restore();
    tm.addCanvas('joystick_base', c1);

    // Joystick thumb
    const [c2, ctx2] = this.createCanvas(64, 64);
    ctx2.save();
    ctx2.translate(32, 32);
    ctx2.fillStyle = 'rgba(56, 189, 248, 0.7)';
    ctx2.strokeStyle = '#38bdf8';
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.arc(0, 0, 24, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.stroke();
    ctx2.restore();
    tm.addCanvas('joystick_thumb', c2);

    // Action button
    const [c3, ctx3] = this.createCanvas(80, 80);
    ctx3.save();
    ctx3.translate(40, 40);
    ctx3.fillStyle = 'rgba(14, 165, 233, 0.75)';
    ctx3.strokeStyle = '#38bdf8';
    ctx3.lineWidth = 3;
    ctx3.beginPath();
    ctx3.arc(0, 0, 34, 0, Math.PI * 2);
    ctx3.fill();
    ctx3.stroke();
    ctx3.restore();
    tm.addCanvas('action_btn', c3);
  }

  private static generateSeaweed(tm: Phaser.Textures.TextureManager): void {
    const [canvas, ctx] = this.createCanvas(36, 140);
    ctx.save();
    ctx.translate(18, 140);

    ctx.strokeStyle = '#059669';
    ctx.fillStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-14, -40, 16, -80, 0, -130);
    ctx.stroke();

    ctx.restore();
    tm.addCanvas('seaweed', canvas);
  }
}
