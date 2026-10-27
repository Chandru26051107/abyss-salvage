export interface TreasurePingFeedback {
  id: string;
  distance: number;
  pulseIntervalMs: number;
  pitchHz: number;
  bearingRadians: number;
  inRange: boolean;
  alpha: number; // visual brightness
}

export class SonarSystem {
  public static readonly PING_COOLDOWN_MS = 3000;
  public static readonly MIN_PULSE_INTERVAL_MS = 250; // closest (rapid)
  public static readonly MAX_PULSE_INTERVAL_MS = 1800; // farthest (slow)
  public static readonly MIN_PITCH_HZ = 440;
  public static readonly MAX_PITCH_HZ = 920;
  public static readonly STUN_RADIUS = 280;
  public static readonly STUN_DURATION_MS = 4000;

  /**
   * Calculates distance between two points.
   */
  public static getDistance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculates warmer/colder feedback for a target at distance `d` within `range`.
   */
  public static calculateProximityFeedback(
    subX: number,
    subY: number,
    targetX: number,
    targetY: number,
    sonarRange: number,
    targetId: string
  ): TreasurePingFeedback {
    const distance = this.getDistance(subX, subY, targetX, targetY);
    const inRange = distance <= sonarRange;
    const normalizedCloseness = Math.max(0, Math.min(1, 1 - distance / sonarRange));

    // Non-linear curve (square) makes getting close feel dramatically more intense
    const intensity = normalizedCloseness * normalizedCloseness;

    const pulseIntervalMs = Math.round(
      this.MAX_PULSE_INTERVAL_MS - (this.MAX_PULSE_INTERVAL_MS - this.MIN_PULSE_INTERVAL_MS) * intensity
    );

    const pitchHz = Math.round(
      this.MIN_PITCH_HZ + (this.MAX_PITCH_HZ - this.MIN_PITCH_HZ) * normalizedCloseness
    );

    const bearingRadians = Math.atan2(targetY - subY, targetX - subX);
    const alpha = inRange ? Math.min(1, 0.25 + intensity * 0.75) : 0;

    return {
      id: targetId,
      distance,
      pulseIntervalMs,
      pitchHz,
      bearingRadians,
      inRange,
      alpha,
    };
  }

  /**
   * Checks whether a ping can be triggered given last ping timestamp and current time.
   */
  public static canPing(lastPingTime: number, currentTime: number): boolean {
    return currentTime - lastPingTime >= this.PING_COOLDOWN_MS;
  }

  /**
   * Returns remaining cooldown percentage [0..1] where 0 = ready, 1 = just used.
   */
  public static getCooldownProgress(lastPingTime: number, currentTime: number): number {
    const elapsed = currentTime - lastPingTime;
    if (elapsed >= this.PING_COOLDOWN_MS) return 0;
    return Math.max(0, (this.PING_COOLDOWN_MS - elapsed) / this.PING_COOLDOWN_MS);
  }

  /**
   * Checks if an entity is within stun radius during sonar burst.
   */
  public static isWithinStunBurst(subX: number, subY: number, entityX: number, entityY: number): boolean {
    return this.getDistance(subX, subY, entityX, entityY) <= this.STUN_RADIUS;
  }
}
