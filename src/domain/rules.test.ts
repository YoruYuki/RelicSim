import { describe, expect, it } from "vitest";
import { canPlace } from "./rules";
import type { Relic, Slot } from "./types";

function createRelic(overrides: Partial<Relic>): Relic {
  return {
    id: "relic-test",
    type: "normal",
    color: "red",
    positiveEffectIds: [null, null, null],
    negativeEffectIds: [null, null, null],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
}

function createSlot(overrides: Partial<Slot>): Slot {
  return {
    id: "slot-test",
    label: "S1",
    tier: "normal",
    color: "red",
    ...overrides
  };
}

describe("canPlace", () => {
  it("allows normal white slot to accept any normal relic color", () => {
    const relic = createRelic({ type: "normal", color: "blue" });
    const slot = createSlot({ tier: "normal", color: "white" });
    expect(canPlace(relic, slot)).toBe(true);
  });

  it("rejects deep relic for normal white slot", () => {
    const relic = createRelic({ type: "deep", color: "blue" });
    const slot = createSlot({ tier: "normal", color: "white" });
    expect(canPlace(relic, slot)).toBe(false);
  });

  it("allows deep white slot to accept any deep relic color", () => {
    const relic = createRelic({ type: "deep", color: "green" });
    const slot = createSlot({ tier: "deep", color: "white" });
    expect(canPlace(relic, slot)).toBe(true);
  });

  it("requires exact color for non-white slots", () => {
    const relic = createRelic({ type: "normal", color: "yellow" });
    const slot = createSlot({ tier: "normal", color: "red" });
    expect(canPlace(relic, slot)).toBe(false);
  });
});
