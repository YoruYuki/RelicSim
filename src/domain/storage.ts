import { createId } from "./ids";
import { isInnateRelicId } from "../data/innateRelics";
import type { AppState, ExportedData, ImportMode, Loadout, Relic } from "./types";

export const APP_STATE_VERSION = 1;
export const STORAGE_KEY = "nightreign-relic-sim-state-v1";

type PartialState = Partial<AppState> | null | undefined;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeEffectArray(value: unknown): [string | null, string | null, string | null] {
  const source = Array.isArray(value) ? value : [];
  const normalized = source
    .slice(0, 3)
    .map((item) => (isNonEmptyString(item) ? item : null)) as (string | null)[];

  while (normalized.length < 3) {
    normalized.push(null);
  }

  return normalized as [string | null, string | null, string | null];
}

function normalizeRelic(value: unknown): Relic | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Relic>;
  if (
    !isNonEmptyString(candidate.id) ||
    (candidate.type !== "normal" && candidate.type !== "deep") ||
    !["red", "yellow", "green", "blue"].includes(String(candidate.color))
  ) {
    return null;
  }

  const now = new Date().toISOString();
  return {
    id: candidate.id,
    type: candidate.type,
    color: candidate.color as Relic["color"],
    positiveEffectIds: normalizeEffectArray(candidate.positiveEffectIds),
    negativeEffectIds: normalizeEffectArray(candidate.negativeEffectIds),
    createdAt: isNonEmptyString(candidate.createdAt) ? candidate.createdAt : now,
    updatedAt: isNonEmptyString(candidate.updatedAt) ? candidate.updatedAt : now
  };
}

function normalizeLoadout(value: unknown): Loadout | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<Loadout>;
  if (
    !isNonEmptyString(candidate.id) ||
    !isNonEmptyString(candidate.name) ||
    !isNonEmptyString(candidate.characterId) ||
    !isNonEmptyString(candidate.presetId)
  ) {
    return null;
  }

  const assignments = candidate.assignments && typeof candidate.assignments === "object" ? candidate.assignments : {};
  const normalizedAssignments: Record<string, string | null> = {};
  Object.entries(assignments).forEach(([slotId, relicId]) => {
    if (!isNonEmptyString(slotId)) {
      return;
    }
    normalizedAssignments[slotId] = isNonEmptyString(relicId) ? relicId : null;
  });

  const now = new Date().toISOString();
  return {
    id: candidate.id,
    name: candidate.name,
    characterId: candidate.characterId,
    presetId: candidate.presetId,
    assignments: normalizedAssignments,
    createdAt: isNonEmptyString(candidate.createdAt) ? candidate.createdAt : now,
    updatedAt: isNonEmptyString(candidate.updatedAt) ? candidate.updatedAt : now
  };
}

export function createDefaultState(): AppState {
  return {
    version: APP_STATE_VERSION,
    inventory: [],
    loadouts: []
  };
}

export function normalizeState(state: PartialState): AppState {
  if (!state || typeof state !== "object") {
    return createDefaultState();
  }

  const inventory = Array.isArray(state.inventory)
    ? state.inventory
        .map((item) => normalizeRelic(item))
        .filter((item): item is Relic => item !== null && !isInnateRelicId(item.id))
    : [];

  const loadouts = Array.isArray(state.loadouts)
    ? state.loadouts.map((item) => normalizeLoadout(item)).filter((item): item is Loadout => item !== null)
    : [];

  return {
    version: APP_STATE_VERSION,
    inventory,
    loadouts
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed = JSON.parse(raw) as PartialState;
    return normalizeState(parsed);
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: AppState): void {
  const normalized = normalizeState(state);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function exportStateToJson(state: AppState): string {
  const payload: ExportedData = {
    metadata: {
      schemaVersion: APP_STATE_VERSION,
      exportedAt: new Date().toISOString()
    },
    state: normalizeState(state)
  };

  return JSON.stringify(payload, null, 2);
}

function extractStateFromImportObject(value: unknown): AppState {
  if (!value || typeof value !== "object") {
    throw new Error("JSON形式が不正です。");
  }

  const candidate = value as Partial<ExportedData> & Partial<AppState>;
  const maybeState = candidate.state ?? candidate;
  const normalized = normalizeState(maybeState);
  return normalized;
}

function mergeStates(localState: AppState, importedState: AppState): AppState {
  const mergedInventory = [...localState.inventory];
  const existingRelicIds = new Set(localState.inventory.map((relic) => relic.id));
  const relicIdRemap = new Map<string, string>();

  importedState.inventory.forEach((relic) => {
    if (!existingRelicIds.has(relic.id)) {
      mergedInventory.push(relic);
      existingRelicIds.add(relic.id);
      relicIdRemap.set(relic.id, relic.id);
      return;
    }

    const remappedId = createId("relic");
    relicIdRemap.set(relic.id, remappedId);
    mergedInventory.push({
      ...relic,
      id: remappedId
    });
    existingRelicIds.add(remappedId);
  });

  const mergedLoadouts = [...localState.loadouts];
  const existingLoadoutIds = new Set(localState.loadouts.map((loadout) => loadout.id));
  const validRelicIds = new Set(mergedInventory.map((relic) => relic.id));

  importedState.loadouts.forEach((loadout) => {
    const remappedAssignments: Record<string, string | null> = {};
    Object.entries(loadout.assignments).forEach(([slotId, relicId]) => {
      if (!relicId) {
        remappedAssignments[slotId] = null;
        return;
      }

      const mappedRelicId = relicIdRemap.get(relicId) ?? relicId;
      remappedAssignments[slotId] =
        validRelicIds.has(mappedRelicId) || isInnateRelicId(mappedRelicId) ? mappedRelicId : null;
    });

    const loadoutId = existingLoadoutIds.has(loadout.id) ? createId("loadout") : loadout.id;
    existingLoadoutIds.add(loadoutId);

    mergedLoadouts.push({
      ...loadout,
      id: loadoutId,
      assignments: remappedAssignments
    });
  });

  return {
    version: APP_STATE_VERSION,
    inventory: mergedInventory,
    loadouts: mergedLoadouts
  };
}

export function importFromJson(jsonText: string, currentState: AppState, mode: ImportMode): AppState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("JSONの読み込みに失敗しました。");
  }

  const imported = extractStateFromImportObject(parsed);
  if (mode === "replace") {
    return imported;
  }

  return mergeStates(normalizeState(currentState), imported);
}
