export type RelicTier = "normal" | "deep";
export type RelicColor = "red" | "yellow" | "green" | "blue";
export type SlotColor = RelicColor | "white";
export type EffectSelection = [string | null, string | null, string | null];

export interface Relic {
  id: string;
  type: RelicTier;
  color: RelicColor;
  positiveEffectIds: EffectSelection;
  negativeEffectIds: EffectSelection;
  createdAt: string;
  updatedAt: string;
}

export interface Slot {
  id: string;
  label: string;
  tier: RelicTier;
  color: SlotColor;
}

export interface Character {
  id: string;
  name: string;
}

export interface ContainerPreset {
  id: string;
  characterId: string;
  name: string;
  slots: Slot[];
}

export interface Loadout {
  id: string;
  name: string;
  characterId: string;
  presetId: string;
  assignments: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  version: number;
  inventory: Relic[];
  loadouts: Loadout[];
}

export type ImportMode = "replace" | "merge";

export interface ExportedData {
  metadata: {
    schemaVersion: number;
    exportedAt: string;
  };
  state: AppState;
}

export interface EffectOption {
  id: string;
  label: string;
  demerit?: boolean;
}
