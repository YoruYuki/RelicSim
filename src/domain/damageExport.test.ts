import { describe, expect, it } from "vitest";
import { CONTAINER_PRESETS } from "../data/gameData";
import type { Loadout, Relic } from "./types";
import { buildDamageCalculatorExport, buildLabelIndex, findEffectIdByLabel } from "./damageExport";

describe("damageExport label matching", () => {
  it("matches exact label and fallback +0 label", () => {
    const index = buildLabelIndex([
      { id: "a", label: "攻撃力上昇+0" },
      { id: "b", label: "会心率上昇" }
    ]);

    expect(findEffectIdByLabel("会心率上昇", index)).toBe("b");
    expect(findEffectIdByLabel("攻撃力上昇", index)).toBe("a");
    expect(findEffectIdByLabel("存在しない", index)).toBeNull();
  });

  it("applies weapon class keyword fallback to ○○", () => {
    const index = buildLabelIndex([{ id: "weapon", label: "○○の攻撃力上昇" }]);
    expect(findEffectIdByLabel("短剣の攻撃力上昇", index)).toBe("weapon");
    expect(findEffectIdByLabel("爪の攻撃力上昇", index)).toBe("weapon");
  });

  it("applies status keyword fallback to ○○ before +0 fallback", () => {
    const index = buildLabelIndex([
      { id: "status-plain", label: "○○状態の敵に対する攻撃を強化" },
      { id: "status-plus", label: "○○状態の敵に対する攻撃を強化+0" }
    ]);
    expect(findEffectIdByLabel("毒状態の敵に対する攻撃を強化", index)).toBe("status-plain");
    expect(findEffectIdByLabel("腐敗状態の敵に対する攻撃を強化", index)).toBe("status-plain");
    expect(findEffectIdByLabel("凍傷状態の敵に対する攻撃を強化", index)).toBe("status-plain");
  });

  it("falls back to status +0 when plain status label is missing", () => {
    const index = buildLabelIndex([{ id: "status-plus", label: "○○状態の敵に対する攻撃を強化+0" }]);
    expect(findEffectIdByLabel("毒状態の敵に対する攻撃を強化", index)).toBe("status-plus");
  });
});

describe("buildDamageCalculatorExport", () => {
  it("maps known effects to damage calculator IDs and skips unknown effects", () => {
    const preset = CONTAINER_PRESETS.find((entry) => entry.characterId === "ch-1");
    expect(preset).toBeDefined();
    if (!preset) return;

    const normalSlot = preset.slots.find((slot) => slot.tier === "normal");
    const deepSlot = preset.slots.find((slot) => slot.tier === "deep");
    expect(normalSlot).toBeDefined();
    expect(deepSlot).toBeDefined();
    if (!normalSlot || !deepSlot) return;

    const now = new Date().toISOString();
    const inventory: Relic[] = [
      {
        id: "normal-relic",
        type: "normal",
        color: "red",
        positiveEffectIds: ["物理攻撃力上昇", "unknown_effect", null],
        negativeEffectIds: [null, null, null],
        createdAt: now,
        updatedAt: now
      },
      {
        id: "deep-relic",
        type: "deep",
        color: "blue",
        positiveEffectIds: ["物理攻撃力上昇", null, null],
        negativeEffectIds: ["HP最大未満時、攻撃力低下", null, null],
        createdAt: now,
        updatedAt: now
      }
    ];

    const loadout: Loadout = {
      id: "loadout-1",
      name: "test-loadout",
      characterId: preset.characterId,
      presetId: preset.id,
      assignments: {
        ...Object.fromEntries(preset.slots.map((slot) => [slot.id, null])),
        [normalSlot.id]: "normal-relic",
        [deepSlot.id]: "deep-relic"
      },
      createdAt: now,
      updatedAt: now
    };

    const exported = buildDamageCalculatorExport({
      loadout,
      inventory,
      outputName: "test-output"
    });

    expect(exported.relics.normal[0]).toBe("relic_normal_015");
    expect(exported.relics.normal[1]).toBeNull();
    expect(exported.relics.deep[0]).toBe("relic_deep_015");
    expect(exported.relics.demerit[0]).toBe("relic_demerit_001");
  });
});
