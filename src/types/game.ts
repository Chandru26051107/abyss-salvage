export interface Upgrades {
  sonar: number; // 1..5
  hull: number; // 1..5
  battery: number; // 1..5
  engine: number; // 1..5
}

export interface PlayerStats {
  oxygen: number;
  maxOxygen: number;
  battery: number;
  maxBattery: number;
  hull: number;
  maxHull: number;
  coins: number;
  carriedTreasureCount: number;
  collectedTreasures: string[];
  collectedCrownPieces: number[];
}

export interface UpgradeLevel {
  level: number;
  cost: number;
  value: number;
  label: string;
}

export interface UpgradeDefinition {
  id: keyof Upgrades;
  name: string;
  description: string;
  levels: UpgradeLevel[];
}

export interface TreasureItem {
  id: string;
  name: string;
  zoneId: number;
  x: number;
  y: number;
  value: number;
  isCrownPiece: boolean;
  difficulty: number; // 1 (easy) to 5 (expert)
  description: string;
  collected?: boolean;
}

export type HazardType = 'mine' | 'eel' | 'current' | 'squid_tentacle';

export interface HazardEntity {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  damage: number;
  forceX?: number;
  forceY?: number;
  active?: boolean;
}

export interface AirPocket {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface ZonePalette {
  surface: number;
  mid: number;
  deep: number;
  abyss: number;
  fogColor: number;
  particleTint: number;
}

export interface ZoneData {
  id: number;
  name: string;
  subtitle: string;
  depthDescription: string;
  palette: ZonePalette;
  width: number;
  height: number;
  surfaceY: number;
  dock: { x: number; y: number };
  treasures: TreasureItem[];
  airPockets: AirPocket[];
  hazards: HazardEntity[];
  creatureTypes: ('turtle' | 'jellyfish' | 'angler' | 'eel')[];
  bossEncounter?: {
    type: 'squid' | 'rival_chase';
    name: string;
    description: string;
  };
}

export interface HighScoreEntry {
  name: string;
  score: number;
  date: string;
  crownPieces: number;
}

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  highContrast: boolean;
  touchControls: boolean;
}

export interface SaveState {
  version: number;
  playerStats: PlayerStats;
  upgrades: Upgrades;
  currentZoneId: number;
  unlockedZones: number[];
  relics: string[];
  highScores: HighScoreEntry[];
  settings: GameSettings;
}
