import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CONTAINER_PRESETS, SLOT_COLOR_LABELS } from "../../data/gameData";
import type { Loadout, Relic } from "../../domain/types";
import LoadoutTab from "./LoadoutTab";

const now = new Date().toISOString();

function createInventory(): Relic[] {
  return [
    {
      id: "normal-red",
      type: "normal",
      color: "red",
      positiveEffectIds: ["atk_up_s", null, null],
      negativeEffectIds: [null, null, null],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "normal-blue",
      type: "normal",
      color: "blue",
      positiveEffectIds: ["crit_up", null, null],
      negativeEffectIds: [null, null, null],
      createdAt: now,
      updatedAt: now
    },
    {
      id: "deep-green",
      type: "deep",
      color: "green",
      positiveEffectIds: ["atk_up_l", null, null],
      negativeEffectIds: [null, null, null],
      createdAt: now,
      updatedAt: now
    }
  ];
}

describe("LoadoutTab filtering", () => {
  it("filters by tier for white slots", async () => {
    const user = userEvent.setup();
    const characterPresets = CONTAINER_PRESETS.filter((entry) => entry.characterId === "ch-1");
    const presetWithNormalWhite = characterPresets.find((preset) =>
      preset.slots.some((slot) => slot.tier === "normal" && slot.color === "white")
    );
    const presetWithDeepWhite = characterPresets.find((preset) =>
      preset.slots.some((slot) => slot.tier === "deep" && slot.color === "white")
    );

    expect(presetWithNormalWhite).toBeDefined();
    expect(presetWithDeepWhite).toBeDefined();
    if (!presetWithNormalWhite || !presetWithDeepWhite) return;

    const normalWhiteLoadout: Loadout = {
      id: "loadout-normal-white",
      name: "normal white",
      characterId: "ch-1",
      presetId: presetWithNormalWhite.id,
      assignments: Object.fromEntries(presetWithNormalWhite.slots.map((slot) => [slot.id, null])),
      createdAt: now,
      updatedAt: now
    };

    const deepWhiteLoadout: Loadout = {
      id: "loadout-deep-white",
      name: "deep white",
      characterId: "ch-1",
      presetId: presetWithDeepWhite.id,
      assignments: Object.fromEntries(presetWithDeepWhite.slots.map((slot) => [slot.id, null])),
      createdAt: now,
      updatedAt: now
    };

    render(
      <LoadoutTab
        inventory={createInventory()}
        loadouts={[normalWhiteLoadout, deepWhiteLoadout]}
        onLoadoutsChange={vi.fn()}
      />
    );

    await user.selectOptions(screen.getByTestId("preset-select"), presetWithNormalWhite.id);
    await user.selectOptions(screen.getByTestId("loadout-select"), normalWhiteLoadout.id);

    const normalWhiteSlot = presetWithNormalWhite.slots.find((slot) => slot.tier === "normal" && slot.color === "white");
    expect(normalWhiteSlot).toBeDefined();
    if (!normalWhiteSlot) return;

    await user.click(screen.getByTestId(`slot-${normalWhiteSlot.id}`));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("candidate-normal-red")).toBeInTheDocument();
    expect(screen.getByTestId("candidate-normal-blue")).toBeInTheDocument();
    expect(screen.queryByTestId("candidate-deep-green")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByTestId("preset-select"), presetWithDeepWhite.id);
    await user.selectOptions(screen.getByTestId("loadout-select"), deepWhiteLoadout.id);
    const deepWhiteSlot = presetWithDeepWhite.slots.find((slot) => slot.tier === "deep" && slot.color === "white");
    expect(deepWhiteSlot).toBeDefined();
    if (!deepWhiteSlot) return;

    await user.click(screen.getByTestId(`slot-${deepWhiteSlot.id}`));
    expect(screen.getByTestId("candidate-deep-green")).toBeInTheDocument();
    expect(screen.queryByTestId("candidate-normal-red")).not.toBeInTheDocument();
  });

  it("prevents reusing the same relic in another slot", async () => {
    const user = userEvent.setup();
    const preset = CONTAINER_PRESETS.find(
      (entry) =>
        entry.characterId === "ch-1" &&
        entry.slots.some((slot) => slot.tier === "normal" && slot.color === "red") &&
        entry.slots.some((slot) => slot.tier === "normal" && slot.color === "white")
    );
    expect(preset).toBeDefined();
    if (!preset) return;

    const normalRedSlot = preset.slots.find((slot) => slot.tier === "normal" && slot.color === "red");
    const normalWhiteSlot = preset.slots.find((slot) => slot.tier === "normal" && slot.color === "white");
    expect(normalRedSlot).toBeDefined();
    expect(normalWhiteSlot).toBeDefined();
    if (!normalRedSlot || !normalWhiteSlot) return;

    const loadout: Loadout = {
      id: "loadout-a",
      name: "test",
      characterId: "ch-1",
      presetId: preset.id,
      assignments: {
        ...Object.fromEntries(preset.slots.map((slot) => [slot.id, null])),
        [normalRedSlot.id]: "normal-red"
      },
      createdAt: now,
      updatedAt: now
    };

    render(<LoadoutTab inventory={createInventory()} loadouts={[loadout]} onLoadoutsChange={vi.fn()} />);

    await user.selectOptions(screen.getByTestId("loadout-select"), loadout.id);
    await user.click(screen.getByTestId(`slot-${normalWhiteSlot.id}`));
    expect(screen.queryByTestId("candidate-normal-red")).not.toBeInTheDocument();
    expect(screen.getByTestId("candidate-normal-blue")).toBeInTheDocument();
  });

  it("opens modal and closes by close button", async () => {
    const user = userEvent.setup();
    const preset = CONTAINER_PRESETS.find((entry) => entry.characterId === "ch-1");
    expect(preset).toBeDefined();
    if (!preset) return;

    const loadout: Loadout = {
      id: "loadout-modal",
      name: "modal test",
      characterId: "ch-1",
      presetId: preset.id,
      assignments: Object.fromEntries(preset.slots.map((slot) => [slot.id, null])),
      createdAt: now,
      updatedAt: now
    };

    render(<LoadoutTab inventory={createInventory()} loadouts={[loadout]} onLoadoutsChange={vi.fn()} />);

    await user.selectOptions(screen.getByTestId("preset-select"), preset.id);
    await user.selectOptions(screen.getByTestId("loadout-select"), loadout.id);

    const targetSlot = preset.slots[0];
    await user.click(screen.getByTestId(`slot-${targetSlot.id}`));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(`${SLOT_COLOR_LABELS[targetSlot.color]} の遺物選択`)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "閉じる" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports realtime search, keyword filter and sort", async () => {
    const user = userEvent.setup();
    const preset = CONTAINER_PRESETS.find(
      (entry) => entry.characterId === "ch-1" && entry.slots.some((slot) => slot.tier === "normal" && slot.color === "white")
    );
    expect(preset).toBeDefined();
    if (!preset) return;

    const inventory: Relic[] = [
      {
        id: "normal-many",
        type: "normal",
        color: "red",
        positiveEffectIds: ["攻撃テスト", "会心テスト", "体力テスト"],
        negativeEffectIds: [null, null, null],
        createdAt: now,
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      {
        id: "normal-crit",
        type: "normal",
        color: "blue",
        positiveEffectIds: ["会心テスト", null, null],
        negativeEffectIds: [null, null, null],
        createdAt: now,
        updatedAt: "2026-01-02T00:00:00.000Z"
      }
    ];

    const loadout: Loadout = {
      id: "loadout-search",
      name: "search test",
      characterId: "ch-1",
      presetId: preset.id,
      assignments: Object.fromEntries(preset.slots.map((slot) => [slot.id, null])),
      createdAt: now,
      updatedAt: now
    };

    render(<LoadoutTab inventory={inventory} loadouts={[loadout]} onLoadoutsChange={vi.fn()} />);

    await user.selectOptions(screen.getByTestId("preset-select"), preset.id);
    await user.selectOptions(screen.getByTestId("loadout-select"), loadout.id);
    const normalWhiteSlot = preset.slots.find((slot) => slot.tier === "normal" && slot.color === "white");
    expect(normalWhiteSlot).toBeDefined();
    if (!normalWhiteSlot) return;

    await user.click(screen.getByTestId(`slot-${normalWhiteSlot.id}`));

    const dialog = screen.getByRole("dialog");
    const searchInput = within(dialog).getByTestId("relic-search-input");
    await user.type(searchInput, "会心");
    expect(within(dialog).getByTestId("candidate-normal-many")).toBeInTheDocument();
    expect(within(dialog).getByTestId("candidate-normal-crit")).toBeInTheDocument();

    await user.clear(searchInput);
    await user.click(within(dialog).getByTestId("keyword-attack"));
    expect(within(dialog).getByTestId("candidate-normal-many")).toBeInTheDocument();
    expect(within(dialog).queryByTestId("candidate-normal-crit")).not.toBeInTheDocument();

    await user.click(within(dialog).getByText("条件クリア"));
    await user.selectOptions(within(dialog).getByTestId("relic-sort-select"), "positive_count");

    const listItems = within(dialog).getAllByRole("listitem");
    expect(within(listItems[0]).getByTestId("candidate-normal-many")).toBeInTheDocument();
  });

  it("updates preset and right layout immediately when selecting saved loadout", async () => {
    const user = userEvent.setup();
    const presets = CONTAINER_PRESETS.filter((entry) => entry.characterId === "ch-1");
    const presetA = presets[0];
    const presetB = presets[1];
    expect(presetA).toBeDefined();
    expect(presetB).toBeDefined();
    if (!presetA || !presetB) return;

    const loadoutA: Loadout = {
      id: "loadout-sync-a",
      name: "sync-a",
      characterId: "ch-1",
      presetId: presetA.id,
      assignments: {
        ...Object.fromEntries(presetA.slots.map((slot) => [slot.id, null])),
        [presetA.slots[0].id]: "normal-red"
      },
      createdAt: now,
      updatedAt: now
    };

    const loadoutB: Loadout = {
      id: "loadout-sync-b",
      name: "sync-b",
      characterId: "ch-1",
      presetId: presetB.id,
      assignments: {
        ...Object.fromEntries(presetB.slots.map((slot) => [slot.id, null])),
        [presetB.slots[0].id]: "normal-blue"
      },
      createdAt: now,
      updatedAt: now
    };

    render(<LoadoutTab inventory={createInventory()} loadouts={[loadoutA, loadoutB]} onLoadoutsChange={vi.fn()} />);

    await user.selectOptions(screen.getByTestId("loadout-select"), loadoutB.id);

    const presetSelect = screen.getByTestId("preset-select") as HTMLSelectElement;
    expect(presetSelect.value).toBe(presetB.id);
    expect(screen.queryByTestId(`slot-${presetA.slots[0].id}`)).not.toBeInTheDocument();
    expect(screen.getByTestId(`slot-${presetB.slots[0].id}`)).toBeInTheDocument();
    expect(within(screen.getByTestId(`slot-${presetB.slots[0].id}`)).queryByText("未配置")).not.toBeInTheDocument();
  });
});
