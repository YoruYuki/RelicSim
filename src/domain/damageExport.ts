import templateJson from "../data/hakumen/temp.json";
import normalCatalogJson from "../data/hakumen/relics_normal.json";
import deepCatalogJson from "../data/hakumen/relics_deep.json";
import demeritCatalogJson from "../data/hakumen/relics_demerit.json";
import { CONTAINER_PRESETS, getEffectLabel } from "../data/gameData";
import type { Loadout, Relic } from "./types";

interface CatalogEntry {
  id: string;
  label: string;
}

interface CatalogFile {
  schema_version?: string;
  relics?: CatalogEntry[];
}

interface DamageCalcTemplate {
  schema_version?: string;
  meta?: {
    name?: string;
    character_id?: string;
    level?: number;
    created_at?: string;
    updated_at?: string;
  };
  relics?: {
    normal?: Array<string | null>;
    deep?: Array<string | null>;
    demerit?: Array<string | null>;
  };
  buffs?: {
    attached?: Array<string | null>;
    talisman?: Array<string | null>;
    passive?: string[];
  };
  boss_id?: string | null;
  skill_cat?: string;
  skill_entry?: string;
  snapshot?: {
    char?: string;
    boss?: string | null;
    cat?: string;
    entry?: string;
    variant?: string | null;
    catalyst?: string | null;
    rarity?: string;
    rel_n?: string[];
    rel_d?: string[];
    rel_dm?: string[];
    att?: Array<string | null>;
    tal?: Array<string | null>;
    pas?: string[];
  };
}

export interface DamageExportPayload {
  schema_version: string;
  meta: {
    name: string;
    character_id: string;
    level: number;
    created_at: string;
    updated_at: string;
  };
  relics: {
    normal: Array<string | null>;
    deep: Array<string | null>;
    demerit: Array<string | null>;
  };
  buffs: {
    attached: Array<string | null>;
    talisman: Array<string | null>;
    passive: string[];
  };
  boss_id: string | null;
  skill_cat: string;
  skill_entry: string;
  snapshot: {
    char: string;
    boss: string | null;
    cat: string;
    entry: string;
    variant: string | null;
    catalyst: string | null;
    rarity: string;
    rel_n: string[];
    rel_d: string[];
    rel_dm: string[];
    att: Array<string | null>;
    tal: Array<string | null>;
    pas: string[];
  };
}

function normalizeLabel(label: string): string {
  return label.replace(/\s+/g, "").trim();
}

const WEAPON_CLASS_KEYWORDS = [
  "短剣",
  "直剣",
  "大剣",
  "特大剣",
  "刺剣",
  "重刺剣",
  "曲剣",
  "大曲剣",
  "刀",
  "両刃剣",
  "斧",
  "大斧",
  "槌",
  "フレイル",
  "大槌",
  "特大武器",
  "槍",
  "大槍",
  "斧槍",
  "鎌",
  "鞭",
  "拳",
  "爪"
] as const;

const STATUS_KEYWORDS = ["毒", "腐敗", "凍傷"] as const;

function replaceAllKeywords(label: string, keywords: readonly string[]): string {
  return keywords.reduce((current, keyword) => current.split(keyword).join("○○"), label);
}

function containsAnyKeyword(label: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => label.includes(keyword));
}

function ensurePlusZeroSuffix(label: string): string {
  const trimmed = label.trim();
  return trimmed.endsWith("+0") ? trimmed : `${trimmed}+0`;
}

function buildLookupCandidates(label: string): string[] {
  const candidates: string[] = [label, ensurePlusZeroSuffix(label)];
  let transformed = label;
  let transformedByKeyword = false;

  if (containsAnyKeyword(transformed, WEAPON_CLASS_KEYWORDS)) {
    transformed = replaceAllKeywords(transformed, WEAPON_CLASS_KEYWORDS);
    transformedByKeyword = true;
  }

  if (containsAnyKeyword(transformed, STATUS_KEYWORDS)) {
    transformed = replaceAllKeywords(transformed, STATUS_KEYWORDS);
    candidates.push(transformed);
    candidates.push(ensurePlusZeroSuffix(transformed));
    transformedByKeyword = true;
  } else if (transformedByKeyword) {
    candidates.push(transformed);
  }

  return [...new Set(candidates.map((candidate) => normalizeLabel(candidate)))];
}

export function buildLabelIndex(entries: CatalogEntry[]): Map<string, string> {
  const index = new Map<string, string>();
  entries.forEach((entry) => {
    index.set(normalizeLabel(entry.label), entry.id);
  });
  return index;
}

export function findEffectIdByLabel(label: string, labelIndex: Map<string, string>): string | null {
  const candidates = buildLookupCandidates(label);
  for (const candidate of candidates) {
    const matched = labelIndex.get(candidate);
    if (matched) {
      return matched;
    }
  }

  return null;
}

const normalCatalog = normalCatalogJson as CatalogFile;
const deepCatalog = deepCatalogJson as CatalogFile;
const demeritCatalog = demeritCatalogJson as CatalogFile;
const template = templateJson as DamageCalcTemplate;

const normalLabelIndex = buildLabelIndex(normalCatalog.relics ?? []);
const deepLabelIndex = buildLabelIndex(deepCatalog.relics ?? []);
const demeritLabelIndex = buildLabelIndex(demeritCatalog.relics ?? []);

function toFixedSizeArray(values: string[], size: number): Array<string | null> {
  const result: Array<string | null> = [...values.slice(0, size)];
  while (result.length < size) {
    result.push(null);
  }
  return result;
}

function getSlotOrder(slotId: string): number {
  const match = slotId.match(/slot-(\d+)$/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }
  return Number.parseInt(match[1], 10);
}

function mapEffectSelectionToIds(
  effectIds: ReadonlyArray<string | null>,
  labelIndex: Map<string, string>
): string[] {
  const result: string[] = [];
  effectIds.forEach((effectId) => {
    if (!effectId) {
      return;
    }
    const label = getEffectLabel(effectId);
    const matchedId = findEffectIdByLabel(label, labelIndex);
    if (matchedId) {
      result.push(matchedId);
    }
  });
  return result;
}

interface BuildDamageExportOptions {
  loadout: Loadout;
  inventory: Relic[];
  outputName?: string;
}

export function buildDamageCalculatorExport({
  loadout,
  inventory,
  outputName
}: BuildDamageExportOptions): DamageExportPayload {
  const preset = CONTAINER_PRESETS.find((entry) => entry.id === loadout.presetId);
  if (!preset) {
    throw new Error("選択したビルドの容器データが見つかりません。");
  }

  const inventoryById = new Map(inventory.map((relic) => [relic.id, relic]));
  const orderedSlots = [...preset.slots].sort((left, right) => getSlotOrder(left.id) - getSlotOrder(right.id));

  const normalRelicIds: string[] = [];
  const deepRelicIds: string[] = [];
  const demeritRelicIds: string[] = [];

  orderedSlots.forEach((slot) => {
    const assignedRelicId = loadout.assignments[slot.id];
    if (!assignedRelicId) {
      return;
    }

    const assignedRelic = inventoryById.get(assignedRelicId);
    if (!assignedRelic) {
      return;
    }

    if (slot.tier === "normal") {
      normalRelicIds.push(...mapEffectSelectionToIds(assignedRelic.positiveEffectIds, normalLabelIndex));
      return;
    }

    deepRelicIds.push(...mapEffectSelectionToIds(assignedRelic.positiveEffectIds, deepLabelIndex));
    demeritRelicIds.push(...mapEffectSelectionToIds(assignedRelic.negativeEffectIds, demeritLabelIndex));
  });

  const normalArray = toFixedSizeArray(normalRelicIds, 9);
  const deepArray = toFixedSizeArray(deepRelicIds, 9);
  const demeritArray = toFixedSizeArray(demeritRelicIds, 9);

  const now = new Date().toISOString();
  const exportName = outputName?.trim() ? outputName.trim() : loadout.name;

  return {
    schema_version: template.schema_version ?? "1.0.0",
    meta: {
      name: exportName,
      character_id: loadout.characterId,
      level: template.meta?.level ?? 1,
      created_at: now,
      updated_at: now
    },
    relics: {
      normal: normalArray,
      deep: deepArray,
      demerit: demeritArray
    },
    buffs: {
      attached: template.buffs?.attached ?? [null, null, null, null, null, null],
      talisman: template.buffs?.talisman ?? [null, null],
      passive: template.buffs?.passive ?? []
    },
    boss_id: template.boss_id ?? null,
    skill_cat: template.skill_cat ?? "sorcery",
    skill_entry: template.skill_entry ?? "",
    snapshot: {
      char: loadout.characterId,
      boss: template.snapshot?.boss ?? null,
      cat: template.snapshot?.cat ?? (template.skill_cat ?? "sorcery"),
      entry: template.snapshot?.entry ?? (template.skill_entry ?? ""),
      variant: template.snapshot?.variant ?? null,
      catalyst: template.snapshot?.catalyst ?? null,
      rarity: template.snapshot?.rarity ?? "common",
      rel_n: normalArray.filter((item): item is string => item !== null),
      rel_d: deepArray.filter((item): item is string => item !== null),
      rel_dm: demeritArray.filter((item): item is string => item !== null),
      att: template.snapshot?.att ?? [],
      tal: template.snapshot?.tal ?? [],
      pas: template.snapshot?.pas ?? []
    }
  };
}
