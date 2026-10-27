import { describe, it, expect, beforeEach } from 'vitest';
import { SaveSystem } from '../src/systems/SaveSystem';

describe('SaveSystem', () => {
  // In-memory localStorage mock for node environment
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);

    // Setup global window and localStorage mock if not in browser
    if (typeof window === 'undefined' || !window.localStorage) {
      const storageMock = {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => {
          mockStorage[key] = value;
        },
        removeItem: (key: string) => {
          delete mockStorage[key];
        },
        clear: () => {
          Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = { localStorage: storageMock };
    } else {
      window.localStorage.clear();
    }
  });

  it('loads valid default state when no save exists', () => {
    const state = SaveSystem.loadSave();
    expect(state.version).toBe(SaveSystem.CURRENT_VERSION);
    expect(state.playerStats.oxygen).toBe(100);
    expect(state.upgrades.sonar).toBe(1);
    expect(state.unlockedZones).toContain(1);
    expect(state.highScores.length).toBeGreaterThan(0);
  });

  it('saves and reloads state intact', () => {
    const state = SaveSystem.getDefaultState();
    state.playerStats.coins = 999;
    state.upgrades.sonar = 3;
    state.unlockedZones = [1, 2];

    const saved = SaveSystem.saveGame(state);
    expect(saved).toBe(true);

    const reloaded = SaveSystem.loadSave();
    expect(reloaded.playerStats.coins).toBe(999);
    expect(reloaded.upgrades.sonar).toBe(3);
    expect(reloaded.unlockedZones).toEqual([1, 2]);
  });

  it('safely recovers from corrupted or malformed save data', () => {
    window.localStorage.setItem(SaveSystem.SAVE_KEY, '{"invalid_json": true');
    const recovered = SaveSystem.loadSave();
    expect(recovered.version).toBe(SaveSystem.CURRENT_VERSION);
    expect(recovered.playerStats.oxygen).toBe(100);
  });

  it('safely handles outdated version save data', () => {
    window.localStorage.setItem(SaveSystem.SAVE_KEY, JSON.stringify({ version: 999 }));
    const recovered = SaveSystem.loadSave();
    expect(recovered.version).toBe(SaveSystem.CURRENT_VERSION);
  });

  it('adds and sorts high score entries', () => {
    const updated = SaveSystem.recordScore('Diver Ace', 1500, 4);
    expect(updated[0]?.score).toBe(1500);
    expect(updated[0]?.name).toBe('Diver Ace');
  });
});
