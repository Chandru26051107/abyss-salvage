import { PlayerStats, Upgrades } from '../types/game';

export interface ResourceDelta {
  oxygen: number;
  battery: number;
  hull: number;
  coins: number;
  isBlackout: boolean;
}

export class ResourceSystem {
  public static readonly BASE_OXYGEN_DRAIN_RATE = 2.0; // units per second underwater
  public static readonly BASE_BATTERY_DRAIN_RATE = 1.2; // units per second when lamp is on
  public static readonly AIR_POCKET_REFILL_RATE = 35.0; // units per second in air bubble
  public static readonly DOCK_REPAIR_COST_PER_HP = 1; // 1 coin per 5 HP

  public static getUpgradeDerivedStats(upgrades: Upgrades): {
    maxHull: number;
    maxBattery: number;
    maxOxygen: number;
    speed: number;
    sonarRange: number;
  } {
    return {
      maxHull: 100 + (upgrades.hull - 1) * 35,
      maxBattery: 100 + (upgrades.battery - 1) * 40,
      maxOxygen: 100,
      speed: 180 + (upgrades.engine - 1) * 40,
      sonarRange: 420 + (upgrades.sonar - 1) * 130,
    };
  }

  /**
   * Updates player resources over delta seconds.
   */
  public static tick(
    stats: PlayerStats,
    dtSeconds: number,
    isSubmerged: boolean,
    inAirPocket: boolean,
    lampActive: boolean
  ): ResourceDelta {
    let oxygen = stats.oxygen;
    let battery = stats.battery;
    let hull = stats.hull;
    let coins = stats.coins;
    let isBlackout = false;

    if (inAirPocket) {
      oxygen = Math.min(stats.maxOxygen, oxygen + this.AIR_POCKET_REFILL_RATE * dtSeconds);
      battery = Math.min(stats.maxBattery, battery + 5 * dtSeconds);
    } else if (isSubmerged) {
      oxygen = Math.max(0, oxygen - this.BASE_OXYGEN_DRAIN_RATE * dtSeconds);
    } else {
      // Surface dock area: full refill
      oxygen = stats.maxOxygen;
      battery = stats.maxBattery;
    }

    if (lampActive && isSubmerged && !inAirPocket) {
      battery = Math.max(0, battery - this.BASE_BATTERY_DRAIN_RATE * dtSeconds);
    }

    // Check blackout condition
    if (oxygen <= 0) {
      isBlackout = true;
      const penalty = this.calculateBlackoutPenalty(coins);
      coins = Math.max(0, coins - penalty);
      oxygen = stats.maxOxygen;
      battery = Math.max(stats.maxBattery * 0.5, battery);
      hull = Math.max(stats.maxHull * 0.5, hull);
    }

    return {
      oxygen,
      battery,
      hull,
      coins,
      isBlackout,
    };
  }

  /**
   * Calculates coin penalty upon oxygen loss blackout.
   * Player loses 15% of coins or 15 coins minimum (whichever is greater), capped at total coins.
   */
  public static calculateBlackoutPenalty(currentCoins: number): number {
    if (currentCoins <= 0) return 0;
    const percentageLoss = Math.floor(currentCoins * 0.15);
    const minLoss = 15;
    return Math.min(currentCoins, Math.max(percentageLoss, minLoss));
  }

  /**
   * Applies damage to hull. Returns updated hull and whether player died.
   */
  public static applyDamage(stats: PlayerStats, amount: number): { hull: number; destroyed: boolean } {
    const hull = Math.max(0, stats.hull - Math.max(0, amount));
    return {
      hull,
      destroyed: hull <= 0,
    };
  }

  /**
   * Heals hull up to maxHull.
   */
  public static repairHull(stats: PlayerStats, amount: number): number {
    return Math.min(stats.maxHull, stats.hull + Math.max(0, amount));
  }
}
