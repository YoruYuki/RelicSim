import type { Character, ContainerPreset, EffectOption, RelicColor, RelicTier, Slot, SlotColor } from "../domain/types";
import { normPositiveData } from "./norm_positive_data";
import { deepPositiveData } from "./deep_positive_data";
import { deepDemeritData } from "./deep_demerit_data";

export const RELIC_TIER_LABELS: Record<RelicTier, string> = {
  normal: "通常",
  deep: "深層"
};

export const RELIC_COLOR_LABELS: Record<RelicColor, string> = {
  red: "赤",
  yellow: "黄",
  green: "緑",
  blue: "青"
};

export const SLOT_COLOR_LABELS: Record<SlotColor, string> = {
  red: "赤",
  yellow: "黄",
  green: "緑",
  blue: "青",
  white: "白"
};

export const NORMAL_POSITIVE_EFFECTS: EffectOption[] = normPositiveData

export const DEEP_POSITIVE_EFFECTS: EffectOption[] = deepPositiveData

export const DEEP_NEGATIVE_EFFECTS: EffectOption[] = deepDemeritData

const effectLabelMap = new Map<string, string>(
  [...NORMAL_POSITIVE_EFFECTS, ...DEEP_POSITIVE_EFFECTS, ...DEEP_NEGATIVE_EFFECTS].map((effect) => [
    effect.id,
    effect.label
  ])
);

export function getEffectLabel(effectId: string | null): string {
  if (!effectId) {
    return "なし";
  }
  return effectLabelMap.get(effectId) ?? effectId;
}

export const CHARACTERS: Character[] = [
  { id: "ch-1", name: "追跡者" },
  { id: "ch-2", name: "守護者" },
  { id: "ch-3", name: "鉄の目" },
  { id: "ch-4", name: "レディ" },
  { id: "ch-5", name: "無頼漢" },
  { id: "ch-6", name: "復讐者" },
  { id: "ch-7", name: "隠者" },
  { id: "ch-8", name: "執行者" },
  { id: "ch-9", name: "学者" },
  { id: "ch-10", name: "葬儀屋" }
]

type ContainerColorPattern = [SlotColor, SlotColor, SlotColor, SlotColor, SlotColor, SlotColor];

interface CharacterContainerDefinition {
  name: string;
  pattern: ContainerColorPattern;
}

const CHARACTER_CONTAINER_DEFINITIONS: Record<string, CharacterContainerDefinition[]> = {
  "ch-1": [
    { name: "追跡者の器（赤赤青赤赤青）", pattern: ["red", "red", "blue", "red", "red", "blue"] },
    { name: "追跡者の盃（黄緑緑黄緑緑）", pattern: ["yellow", "green", "green", "yellow", "green", "green"] },
    { name: "追跡者の高杯（赤黄白赤青緑）", pattern: ["red", "yellow", "white", "red", "blue", "green"] },
    { name: "煤けた追跡者の器（青青黄青青黄）", pattern: ["blue", "blue", "yellow", "blue", "blue", "yellow"] },
    { name: "封じられた追跡者の器（青赤赤緑黄黄）", pattern: ["blue", "red", "red", "green", "yellow", "yellow"] },
    { name: "朽ちた追跡者の盃（青緑黄青緑黄）", pattern: ["blue", "green", "yellow", "blue", "green", "yellow"] },
    { name: "忘れられた追跡者の盃（緑緑黄赤緑白）", pattern: ["green", "green", "yellow", "red", "green", "white"] },
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-2": [
    { name: "守護者の器（赤黄黄赤黄黄）", pattern:["red","yellow","yellow","red","yellow","yellow"]},
    { name: "守護者の盃（青青緑青青緑）", pattern:["blue","blue","green","blue","blue","green"]},
    { name: "守護者の高杯（青黄白赤青黄）", pattern:["blue","yellow","white","red","blue","yellow"]},
    { name: "煤けた守護者の器（赤緑緑赤緑緑）", pattern:["red","green","green","red","green","green"]},
    { name: "封じられた守護者の器（黄黄赤緑緑黄）", pattern:["yellow","yellow","red","green","green","yellow"]},
    { name: "朽ちた守護者の盃（黄緑緑黄緑緑）", pattern:["yellow","green","green","yellow","green","green"]},
    { name: "忘れられた守護者の盃（緑青青赤青白）", pattern:["green","blue","blue","red","blue","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-3": [
    { name: "鉄の目の器（黄緑緑黄緑緑）", pattern:["yellow","green","green","yellow","green","green"]},
    { name: "鉄の目の盃（赤青黄赤青黄）", pattern:["red","blue","yellow","red","blue","yellow"]},
    { name: "鉄の目の高杯（赤緑白赤赤緑）", pattern:["red","green","white","red","red","green"]},
    { name: "煤けた鉄の目の器（青黄黄青黄黄）", pattern:["blue","yellow","yellow","blue","yellow","yellow"]},
    { name: "封じられた鉄の目の器（緑緑黄青青赤）", pattern:["green","green","yellow","blue","blue","red"]},
    { name: "朽ちた鉄の目の盃（青青緑青青緑）", pattern:["blue","blue","green","blue","blue","green"]},
    { name: "忘れられた鉄の目の盃（黄青赤黄緑白）", pattern:["yellow","blue","red","yellow","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-4": [
    { name: "レディの器（赤青青赤青青）", pattern:["red","blue","blue","red","blue","blue"]},
    { name: "レディの盃（黄黄緑黄黄緑）", pattern:["yellow","yellow","green","yellow","yellow","green"]},
    { name: "レディの高杯（青黄白赤青黄）", pattern:["blue","yellow","white","red","blue","yellow"]},
    { name: "煤けたレディの器（赤赤緑赤赤緑）", pattern:["red","red","green","red","red","green"]},
    { name: "封じられたレディの器（青青赤緑緑黄）", pattern:["blue","blue","red","green","green","yellow"]},
    { name: "朽ちたレディの盃（青緑緑青緑緑）", pattern:["blue","green","green","blue","green","green"]},
    { name: "忘れられたレディの盃（緑黄黄赤緑白）", pattern:["green","yellow","yellow","red","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-5": [
    { name: "無頼漢の器（赤緑緑赤緑緑）", pattern:["red","green","green","red","green","green"]},
    { name: "無頼漢の盃（赤青黄赤青黄）", pattern:["red","blue","yellow","red","blue","yellow"]},
    { name: "無頼漢の高杯（赤赤白赤黄黄）", pattern:["red","red","white","red","yellow","yellow"]},
    { name: "煤けた無頼漢の器（青青緑青青緑）", pattern:["blue","blue","green","blue","blue","green"]},
    { name: "封じられた無頼漢の器（緑緑赤黄青青）", pattern:["green","green","red","yellow","blue","blue"]},
    { name: "朽ちた無頼漢の盃（黄黄緑黄黄緑）", pattern:["yellow","yellow","green","yellow","yellow","green"]},
    { name: "忘れられた無頼漢の盃（黄青赤赤緑白）", pattern:["yellow","blue","red","red","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-6": [
    { name: "復讐者の器（青青黄青青黄）", pattern:["blue","blue","yellow","blue","blue","yellow"]},
    { name: "復讐者の盃（赤赤緑赤赤緑）", pattern:["red","red","green","red","red","green"]},
    { name: "復讐者の高杯（青緑白青黄緑）", pattern:["blue","green","white","blue","yellow","green"]},
    { name: "煤けた復讐者の器（赤黄黄赤黄黄）", pattern:["red","yellow","yellow","red","yellow","yellow"]},
    { name: "封じられた復讐者の器（黄青青緑緑赤）", pattern:["yellow","blue","blue","green","green","red"]},
    { name: "朽ちた復讐者の盃（赤赤黄赤赤黄）", pattern:["red","red","yellow","red","red","yellow"]},
    { name: "忘れられた復讐者の盃（緑赤赤黄緑白）", pattern:["green","red","red","yellow","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-7": [
    { name: "隠者の器（青青緑青青緑）", pattern:["blue","blue","green","blue","blue","green"]},
    { name: "隠者の盃（赤青黄赤青黄）", pattern:["red","blue","yellow","red","blue","yellow"]},
    { name: "隠者の高杯（黄緑白青緑緑）", pattern:["yellow","green","white","blue","green","green"]},
    { name: "煤けた隠者の器（赤赤黄赤赤黄）", pattern:["red","red","yellow","red","red","yellow"]},
    { name: "封じられた隠者の器（緑青青黄黄赤）", pattern:["green","blue","blue","yellow","yellow","red"]},
    { name: "朽ちた隠者の盃（赤赤青赤赤青）", pattern:["red","red","blue","red","red","blue"]},
    { name: "忘れられた隠者の盃（黄青赤青緑白）", pattern:["yellow","blue","red","blue","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-8": [
    { name: "執行者の器（赤黄黄赤黄黄）", pattern:["red","yellow","yellow","red","yellow","yellow"]},
    { name: "執行者の盃（赤青緑赤青緑）", pattern:["red","blue","green","red","blue","green"]},
    { name: "執行者の高杯（青黄白黄黄緑）", pattern:["blue","yellow","white","yellow","yellow","green"]},
    { name: "煤けた執行者の器（赤赤青赤赤青）", pattern:["red","red","blue","red","red","blue"]},
    { name: "封じられた執行者の器（黄黄赤緑緑赤）", pattern:["yellow","yellow","red","green","green","red"]},
    { name: "朽ちた執行者の盃（赤赤黄赤赤黄）", pattern:["red","red","yellow","red","red","yellow"]},
    { name: "忘れられた執行者の盃（緑青赤黄緑白）", pattern:["green","blue","red","yellow","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-9": [
    { name: "学者の器（赤赤黄赤赤黄）", pattern:["red","red","yellow","red","red","yellow"]},
    { name: "学者の盃（青緑黄青緑黄）", pattern:["blue","green","yellow","blue","green","yellow"]},
    { name: "学者の高杯（赤青白赤黄黄）", pattern:["red","blue","white","red","yellow","yellow"]},
    { name: "煤けた学者の器（青緑緑青緑緑）", pattern:["blue","green","green","blue","green","green"]},
    { name: "封じられた学者の器（黄赤赤緑青青）", pattern:["yellow","red","red","green","blue","blue"]},
    { name: "朽ちた学者の盃（青青緑青青緑）", pattern:["blue","blue","green","blue","blue","green"]},
    { name: "忘れられた学者の盃（黄緑青赤緑白）", pattern:["yellow","green","blue","red","green","white"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ],
  "ch-10": [
    { name: "葬儀屋の器（青緑緑青緑緑）", pattern:["blue","green","green","blue","green","green"]},
    { name: "葬儀屋の盃（赤黄黄赤黄黄）", pattern:["red","yellow","yellow","red","yellow","yellow"]},
    { name: "葬儀屋の高杯（緑黄白青緑黄）", pattern:["green","yellow","white","blue","green","yellow"]},
    { name: "煤けた葬儀屋の器（赤赤青赤赤青）", pattern:["red","red","blue","red","red","blue"]},
    { name: "封じられた葬儀屋の器（緑緑青黄赤赤）", pattern:["green","green","blue","yellow","red","red"]},
    { name: "忘れられた葬儀屋の器（黄黄赤青黄白）", pattern:["yellow","yellow","red","blue","yellow","white"]},
    { name: "黄金樹の聖杯（黄黄黄黄黄黄）", pattern:["yellow","yellow","yellow","yellow","yellow","yellow"]},
    { name: "黄金樹の聖杯（黄）", pattern: ["yellow", "yellow", "yellow", "yellow", "yellow", "yellow"] },
    { name: "霊樹の聖杯（緑）", pattern: ["green", "green", "green", "green", "green", "green"] },
    { name: "巨人樹の聖杯（青）", pattern: ["blue", "blue", "blue", "blue", "blue", "blue"] },
    { name: "影樹の聖杯（赤）", pattern: ["red", "red", "red", "red", "red", "red"] }
  ]
};

function buildSlots(presetId: string, pattern: ContainerColorPattern): Slot[] {
  return pattern.map((color, index) => ({
    id: `${presetId}-slot-${index + 1}`,
    label: `S${index + 1}`,
    tier: index < 3 ? "normal" : "deep",
    color
  }));
}

function createPreset(characterId: string, suffix: string, definition: CharacterContainerDefinition): ContainerPreset {
  const presetId = `preset-${characterId}-${suffix}`;
  return {
    id: presetId,
    characterId,
    name: definition.name,
    slots: buildSlots(presetId, definition.pattern)
  };
}

export const CONTAINER_PRESETS: ContainerPreset[] = CHARACTERS.flatMap((character) => {
  const definitions = CHARACTER_CONTAINER_DEFINITIONS[character.id] ?? [];
  return definitions.map((definition, index) => {
    const suffix = index < 26 ? String.fromCharCode(97 + index) : `x${index + 1}`;
    return createPreset(character.id, suffix, definition);
  });
});

export function getPresetsForCharacter(characterId: string): ContainerPreset[] {
  return CONTAINER_PRESETS.filter((preset) => preset.characterId === characterId);
}
