import { describe, it, expect } from 'vitest';
import { ResourceSystem } from '../src/systems/ResourceSystem';
import { PlayerStats, Upgrades } from '../src/types/game';

describe('ResourceSystem', () => {
  const mockStats: PlayerStats = {
    oxygen: 100,
    maxOxygen: 100,
    battery: 100,
    maxBattery: 100,
    hull: 100,
    maxHull: 100,
    coins: 100,
    carriedTreasureCount: 0,
    collectedTreasures: [],
    collectedCrownPieces: [],
  };

  it('correctly calculates upgrade derived stats', () => {
    const upgrades: Upgrades = { sonar: 2, hull: 3, battery: 1, engine: 4 };
    const stats = ResourceSystem.getUpgradeDerivedStats(upgrades);

    expect(stats.sonarRange).toBe(420 + 130);
    expect(stats.maxHull).toBe(100 + 2 * 35);
    expect(stats.maxBattery).toBe(100);
    expect(stats.speed).toBe(180 + 3 * 40);
  });

  it('drains oxygen and battery when submerged with lamp on', () => {
    const result = ResourceSystem.tick(mockStats, 10, true, false, true);
    expect(result.oxygen).toBeLessThan(100);
    expect(result.battery).toBeLessThan(100);
    expect(result.isBlackout).toBe(false);
  });

  it('refills oxygen when in an air pocket', () => {
    const lowStats: PlayerStats = { ...mockStats, oxygen: 20 };
    const result = ResourceSystem.tick(lowStats, 2, true, true, false);
    expect(result.oxygen).toBeGreaterThan(20);
    expect(result.isBlackout).toBe(false);
  });

  it('triggers blackout, rescues player, and deducts penalty when oxygen hits 0', () => {
    const emptyStats: PlayerStats = { ...mockStats, oxygen: 0, coins: 200 };
    const result = ResourceSystem.tick(emptyStats, 1, true, false, false);
    expect(result.isBlackout).toBe(true);
    expect(result.oxygen).toBe(100);
    // 15% of 200 is 30 coins penalty
    expect(result.coins).toBe(170);
  });

  it('calculates blackout penalty with minimum threshold and zero coin safeguard', () => {
    expect(ResourceSystem.calculateBlackoutPenalty(0)).toBe(0);
    expect(ResourceSystem.calculateBlackoutPenalty(10)).toBe(10); // capped at total coins
    expect(ResourceSystem.calculateBlackoutPenalty(50)).toBe(15); // min loss of 15
    expect(ResourceSystem.calculateBlackoutPenalty(500)).toBe(75); // 15% of 500
  });

  it('applies damage and detects destruction', () => {
    const damageResult1 = ResourceSystem.applyDamage(mockStats, 30);
    expect(damageResult1.hull).toBe(70);
    expect(damageResult1.destroyed).toBe(false);

    const damageResult2 = ResourceSystem.applyDamage(mockStats, 120);
    expect(damageResult2.hull).toBe(0);
    expect(damageResult2.destroyed).toBe(true);
  });

  it('repairs hull up to maxHull', () => {
    const damaged: PlayerStats = { ...mockStats, hull: 40 };
    const repaired = ResourceSystem.repairHull(damaged, 50);
    expect(repaired).toBe(90);

    const overRepaired = ResourceSystem.repairHull(damaged, 100);
    expect(overRepaired).toBe(100);
  });
});
