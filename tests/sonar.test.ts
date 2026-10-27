import { describe, it, expect } from 'vitest';
import { SonarSystem } from '../src/systems/SonarSystem';

describe('SonarSystem', () => {
  it('calculates Euclidean distance accurately', () => {
    expect(SonarSystem.getDistance(0, 0, 300, 400)).toBe(500);
    expect(SonarSystem.getDistance(100, 100, 100, 100)).toBe(0);
  });

  it('determines ping availability based on cooldown', () => {
    expect(SonarSystem.canPing(1000, 2000)).toBe(false);
    expect(SonarSystem.canPing(1000, 3999)).toBe(false);
    expect(SonarSystem.canPing(1000, 4000)).toBe(true);
    expect(SonarSystem.canPing(1000, 5000)).toBe(true);
  });

  it('calculates cooldown progress ratio', () => {
    expect(SonarSystem.getCooldownProgress(1000, 1000)).toBe(1);
    expect(SonarSystem.getCooldownProgress(1000, 2500)).toBe(0.5);
    expect(SonarSystem.getCooldownProgress(1000, 4500)).toBe(0);
  });

  it('calculates warmer/colder proximity feedback accurately', () => {
    const range = 500;
    // Target right at sub (distance 0)
    const pointBlankFeedback = SonarSystem.calculateProximityFeedback(0, 0, 0, 0, range, 'test1');
    expect(pointBlankFeedback.inRange).toBe(true);
    expect(pointBlankFeedback.pulseIntervalMs).toBe(SonarSystem.MIN_PULSE_INTERVAL_MS);
    expect(pointBlankFeedback.pitchHz).toBe(SonarSystem.MAX_PITCH_HZ);
    expect(pointBlankFeedback.alpha).toBe(1);

    // Target far from sub but within range
    const farFeedback = SonarSystem.calculateProximityFeedback(0, 0, 480, 0, range, 'test2');
    expect(farFeedback.inRange).toBe(true);
    expect(farFeedback.pulseIntervalMs).toBeGreaterThan(1500);
    expect(farFeedback.pitchHz).toBeLessThan(500);

    // Target out of range
    const outFeedback = SonarSystem.calculateProximityFeedback(0, 0, 600, 0, range, 'test3');
    expect(outFeedback.inRange).toBe(false);
    expect(outFeedback.alpha).toBe(0);
  });

  it('verifies sonar burst stun area', () => {
    expect(SonarSystem.isWithinStunBurst(100, 100, 250, 100)).toBe(true); // distance 150 < 280
    expect(SonarSystem.isWithinStunBurst(100, 100, 500, 500)).toBe(false); // distance > 280
  });
});
