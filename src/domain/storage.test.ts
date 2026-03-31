import { describe, expect, it } from "vitest";
import { INNATE_RELICS } from "../data/innateRelics";
import { importFromJson } from "./storage";
import type { AppState, ExportedData } from "./types";

const now = new Date().toISOString();

describe("importFromJson merge", () => {
  it("keeps duplicate data by remapping conflicting ids and rewrites references", () => {
    const localState: AppState = {
      version: 1,
      inventory: [
        {
          id: "relic-1",
          type: "normal",
          color: "red",
          positiveEffectIds: ["atk_up_s", null, null],
          negativeEffectIds: [null, null, null],
          createdAt: now,
          updatedAt: now
        }
      ],
      loadouts: [
        {
          id: "loadout-1",
          name: "local",
          characterId: "ch-1",
          presetId: "preset-ch-1-a",
          assignments: {
            "slot-1": "relic-1"
          },
          createdAt: now,
          updatedAt: now
        }
      ]
    };

    const importedPayload: ExportedData = {
      metadata: {
        schemaVersion: 1,
        exportedAt: now
      },
      state: {
        version: 1,
        inventory: [
          {
            id: "relic-1",
            type: "normal",
            color: "blue",
            positiveEffectIds: ["crit_up", null, null],
            negativeEffectIds: [null, null, null],
            createdAt: now,
            updatedAt: now
          }
        ],
        loadouts: [
          {
            id: "loadout-1",
            name: "imported",
            characterId: "ch-1",
            presetId: "preset-ch-1-a",
            assignments: {
              "slot-1": "relic-1"
            },
            createdAt: now,
            updatedAt: now
          }
        ]
      }
    };

    const merged = importFromJson(JSON.stringify(importedPayload), localState, "merge");

    expect(merged.inventory).toHaveLength(2);
    expect(new Set(merged.inventory.map((relic) => relic.id)).size).toBe(2);

    expect(merged.loadouts).toHaveLength(2);
    expect(new Set(merged.loadouts.map((loadout) => loadout.id)).size).toBe(2);

    const importedLoadout = merged.loadouts.find((loadout) => loadout.name === "imported");
    expect(importedLoadout).toBeDefined();

    const assignedRelicId = importedLoadout?.assignments["slot-1"] ?? null;
    expect(assignedRelicId).toBeTruthy();
    expect(assignedRelicId).not.toBe("relic-1");
    expect(merged.inventory.some((relic) => relic.id === assignedRelicId)).toBe(true);
  });

  it("keeps innate relic assignment references even if innate relics are not in imported inventory", () => {
    const innateRelicId = INNATE_RELICS[0]?.id ?? "innate-relic";
    const localState: AppState = {
      version: 1,
      inventory: [],
      loadouts: []
    };

    const importedPayload: ExportedData = {
      metadata: {
        schemaVersion: 1,
        exportedAt: now
      },
      state: {
        version: 1,
        inventory: [],
        loadouts: [
          {
            id: "loadout-innate",
            name: "innate-ref",
            characterId: "ch-1",
            presetId: "preset-ch-1-a",
            assignments: {
              "slot-1": innateRelicId
            },
            createdAt: now,
            updatedAt: now
          }
        ]
      }
    };

    const merged = importFromJson(JSON.stringify(importedPayload), localState, "merge");
    const importedLoadout = merged.loadouts.find((loadout) => loadout.id === "loadout-innate");

    expect(importedLoadout).toBeDefined();
    expect(importedLoadout?.assignments["slot-1"]).toBe(innateRelicId);
  });
});
