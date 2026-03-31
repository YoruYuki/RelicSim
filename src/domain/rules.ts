import type { Relic, Slot } from "./types";

interface SelectableRelicParams {
  slot: Slot;
  inventory: Relic[];
  assignments: Record<string, string | null>;
  currentSlotId: string;
}

export function canPlace(relic: Relic, slot: Slot): boolean {
  if (relic.type !== slot.tier) {
    return false;
  }

  return slot.color === "white" || relic.color === slot.color;
}

export function getSelectableRelics({
  slot,
  inventory,
  assignments,
  currentSlotId
}: SelectableRelicParams): Relic[] {
  const usedRelicIds = new Set<string>();

  Object.entries(assignments).forEach(([slotId, relicId]) => {
    if (!relicId || slotId === currentSlotId) {
      return;
    }
    usedRelicIds.add(relicId);
  });

  return inventory.filter((relic) => !usedRelicIds.has(relic.id) && canPlace(relic, slot));
}
