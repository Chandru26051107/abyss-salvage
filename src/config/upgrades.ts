import { UpgradeDefinition } from '../types/game';

export const UPGRADE_CATALOG: UpgradeDefinition[] = [
  {
    id: 'sonar',
    name: 'Sonar Pulse Emitter',
    description: 'Expands radar scanning radius to detect treasures and hazards deeper in murky waters.',
    levels: [
      { level: 1, cost: 0, value: 420, label: 'Mk I Standard (420m)' },
      { level: 2, cost: 120, value: 550, label: 'Mk II Widebeam (550m)' },
      { level: 3, cost: 260, value: 680, label: 'Mk III Echo-Max (680m)' },
      { level: 4, cost: 450, value: 810, label: 'Mk IV Sub-Seismic (810m)' },
      { level: 5, cost: 750, value: 940, label: 'Mk V Deep-Resonance (940m)' },
    ],
  },
  {
    id: 'hull',
    name: 'Reinforced Hull Armor',
    description: 'Titanium plating to withstand impacts from sea mines, jagged reefs, and creature charges.',
    levels: [
      { level: 1, cost: 0, value: 100, label: 'Standard Alloy (100 HP)' },
      { level: 2, cost: 100, value: 135, label: 'Hardened Steel (135 HP)' },
      { level: 3, cost: 240, value: 170, label: 'Titanium Shell (170 HP)' },
      { level: 4, cost: 420, value: 205, label: 'Abyssal Composite (205 HP)' },
      { level: 5, cost: 700, value: 240, label: 'Dreadnought Plating (240 HP)' },
    ],
  },
  {
    id: 'battery',
    name: 'Lithium Deep-Cell Battery',
    description: 'Powers the high-intensity search lamp to pierce the thick oceanic gloom.',
    levels: [
      { level: 1, cost: 0, value: 100, label: 'Standard Cell (100 cap)' },
      { level: 2, cost: 90, value: 140, label: 'High-Density Cell (140 cap)' },
      { level: 3, cost: 220, value: 180, label: 'Hydro-Capacitor (180 cap)' },
      { level: 4, cost: 380, value: 220, label: 'Tritium Core (220 cap)' },
      { level: 5, cost: 650, value: 260, label: 'Zero-Point Cell (260 cap)' },
    ],
  },
  {
    id: 'engine',
    name: 'Hydro-Jet Thruster',
    description: 'Boosts acceleration and top speed to evade rival thief drones and combat rip currents.',
    levels: [
      { level: 1, cost: 0, value: 180, label: 'Standard Propeller (180 kts)' },
      { level: 2, cost: 110, value: 220, label: 'Twin Impeller (220 kts)' },
      { level: 3, cost: 250, value: 260, label: 'Turbo Hydro-Jet (260 kts)' },
      { level: 4, cost: 440, value: 300, label: 'Vortex Induction (300 kts)' },
      { level: 5, cost: 720, value: 340, label: 'Supercavitating Drive (340 kts)' },
    ],
  },
];
