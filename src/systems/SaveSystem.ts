import { HighScoreEntry, SaveState } from '../types/game';

export class SaveSystem {
  public static readonly SAVE_KEY = 'abyss_salvage_save_v1';
  public static readonly HIGHSCORE_KEY = 'abyss_salvage_highscores_v1';
  public static readonly CURRENT_VERSION = 1;

  public static getDefaultState(): SaveState {
    return {
      version: this.CURRENT_VERSION,
      playerStats: {
        oxygen: 100,
        maxOxygen: 100,
        battery: 100,
        maxBattery: 100,
        hull: 100,
        maxHull: 100,
        coins: 100, // starting coins
        carriedTreasureCount: 0,
        collectedTreasures: [],
        collectedCrownPieces: [],
      },
      upgrades: {
        sonar: 1,
        hull: 1,
        battery: 1,
        engine: 1,
      },
      currentZoneId: 1,
      unlockedZones: [1],
      relics: [],
      highScores: [
        { name: 'Mina', score: 1200, date: '2026-10-20', crownPieces: 3 },
        { name: 'Dr. Coral', score: 950, date: '2026-10-18', crownPieces: 2 },
        { name: 'Bolt', score: 600, date: '2026-10-15', crownPieces: 1 },
      ],
      settings: {
        sfxVolume: 0.8,
        musicVolume: 0.6,
        highContrast: false,
        touchControls: false,
      },
    };
  }

  public static loadSave(): SaveState {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return this.getDefaultState();
      }
      const raw = window.localStorage.getItem(this.SAVE_KEY);
      if (!raw) {
        return this.getDefaultState();
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || parsed.version !== this.CURRENT_VERSION) {
        console.warn('Invalid or outdated save version. Using default state.');
        return this.getDefaultState();
      }

      // Merge with default in case of missing fields
      const fallback = this.getDefaultState();
      return {
        version: this.CURRENT_VERSION,
        playerStats: {
          ...fallback.playerStats,
          ...(parsed.playerStats || {}),
        },
        upgrades: {
          ...fallback.upgrades,
          ...(parsed.upgrades || {}),
        },
        currentZoneId: typeof parsed.currentZoneId === 'number' ? parsed.currentZoneId : 1,
        unlockedZones: Array.isArray(parsed.unlockedZones) ? parsed.unlockedZones : [1],
        relics: Array.isArray(parsed.relics) ? parsed.relics : [],
        highScores: Array.isArray(parsed.highScores) ? parsed.highScores : fallback.highScores,
        settings: {
          ...fallback.settings,
          ...(parsed.settings || {}),
        },
      };
    } catch (err) {
      console.warn('Error reading from localStorage, loading default save state:', err);
      return this.getDefaultState();
    }
  }

  public static saveGame(state: SaveState): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const raw = JSON.stringify(state);
      window.localStorage.setItem(this.SAVE_KEY, raw);
      return true;
    } catch (err) {
      console.warn('Failed to save game to localStorage:', err);
      return false;
    }
  }

  public static resetSave(): SaveState {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.SAVE_KEY);
      }
    } catch (err) {
      console.warn('Failed to clear localStorage save:', err);
    }
    return this.getDefaultState();
  }

  public static getHighScores(): HighScoreEntry[] {
    const state = this.loadSave();
    return state.highScores.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  public static recordScore(name: string, score: number, crownPieces: number): HighScoreEntry[] {
    const state = this.loadSave();
    const newEntry: HighScoreEntry = {
      name: name.trim() || 'Captain Mina',
      score: Math.max(0, score),
      date: new Date().toISOString().split('T')[0] ?? '2026-10-27',
      crownPieces: Math.max(0, crownPieces),
    };
    state.highScores.push(newEntry);
    state.highScores.sort((a, b) => b.score - a.score);
    state.highScores = state.highScores.slice(0, 10);
    this.saveGame(state);
    return state.highScores;
  }
}
