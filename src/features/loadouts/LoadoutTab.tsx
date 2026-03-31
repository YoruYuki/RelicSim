import { useEffect, useMemo, useState } from "react";
import { CHARACTERS, SLOT_COLOR_LABELS, getEffectLabel, getPresetsForCharacter } from "../../data/gameData";
import { createId } from "../../domain/ids";
import { getSelectableRelics } from "../../domain/rules";
import type { ContainerPreset, Loadout, Relic, Slot } from "../../domain/types";

interface LoadoutTabProps {
  inventory: Relic[];
  loadouts: Loadout[];
  onLoadoutsChange: (nextLoadouts: Loadout[]) => void;
}

type PickerSortMode = "recent" | "positive_count" | "negative_count";

const COMMON_KEYWORDS: Array<{ key: string; label: string }> = [
  { key: "attack", label: "攻撃" },
  { key: "chara", label: "【" },
  { key: "sorcery", label: "魔術" },
  { key: "incantation", label: "祈祷" },
  { key: "weapon_find", label: "見つけ" }
];

function createAssignmentsFromPreset(preset: ContainerPreset): Record<string, string | null> {
  return Object.fromEntries(preset.slots.map((slot) => [slot.id, null]));
}

function formatEffects(effectIds: ReadonlyArray<string | null>): string {
  const labels = effectIds.filter((effectId): effectId is string => effectId !== null).map((effectId) => getEffectLabel(effectId));
  return labels.length > 0 ? labels.join(" \n ") : "なし";
}

function getSlotHeader(slot: Slot): string {
  return SLOT_COLOR_LABELS[slot.color];
}

function getSlotDisplayOrder(slots: Slot[]): Slot[] {
  if (slots.length !== 6) {
    return slots;
  }

  const order = [0, 3, 1, 4, 2, 5];
  return order.map((index) => slots[index]).filter((slot): slot is Slot => Boolean(slot));
}

function countEffects(effectIds: ReadonlyArray<string | null>): number {
  return effectIds.filter((effectId) => effectId !== null).length;
}

function getSearchableText(relic: Relic): string {
  const positive = relic.positiveEffectIds.filter((effectId): effectId is string => effectId !== null).map((effectId) => getEffectLabel(effectId));
  const negative = relic.negativeEffectIds.filter((effectId): effectId is string => effectId !== null).map((effectId) => getEffectLabel(effectId));
  return [...positive, ...negative].join(" ").toLowerCase();
}

export default function LoadoutTab({ inventory, loadouts, onLoadoutsChange }: LoadoutTabProps): JSX.Element {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(CHARACTERS[0]?.id ?? "");
  const characterPresets = useMemo(() => getPresetsForCharacter(selectedCharacterId), [selectedCharacterId]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(characterPresets[0]?.id ?? "");
  const [selectedLoadoutId, setSelectedLoadoutId] = useState<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [newLoadoutName, setNewLoadoutName] = useState<string>("");
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeKeywordKeys, setActiveKeywordKeys] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<PickerSortMode>("recent");

  useEffect(() => {
    if (!characterPresets.some((preset) => preset.id === selectedPresetId)) {
      setSelectedPresetId(characterPresets[0]?.id ?? "");
      setActiveSlotId(null);
      setIsPickerOpen(false);
    }
  }, [characterPresets, selectedPresetId]);

  const selectedPreset = useMemo(
    () => characterPresets.find((preset) => preset.id === selectedPresetId) ?? null,
    [characterPresets, selectedPresetId]
  );

  const visibleLoadouts = useMemo(
    () => loadouts.filter((loadout) => loadout.characterId === selectedCharacterId),
    [loadouts, selectedCharacterId]
  );

  useEffect(() => {
    if (selectedLoadoutId === null) {
      return;
    }

    if (!visibleLoadouts.some((loadout) => loadout.id === selectedLoadoutId)) {
      setSelectedLoadoutId(visibleLoadouts[0]?.id ?? null);
      setActiveSlotId(null);
      setIsPickerOpen(false);
    }
  }, [visibleLoadouts, selectedLoadoutId]);

  const selectedLoadout = useMemo(
    () => visibleLoadouts.find((loadout) => loadout.id === selectedLoadoutId) ?? null,
    [visibleLoadouts, selectedLoadoutId]
  );

  useEffect(() => {
    if (!selectedLoadout) {
      return;
    }
    if (selectedLoadout.presetId !== selectedPresetId) {
      setSelectedPresetId(selectedLoadout.presetId);
      setActiveSlotId(null);
      setIsPickerOpen(false);
    }
  }, [selectedLoadout, selectedPresetId]);

  const selectedSlot = useMemo(
    () => selectedPreset?.slots.find((slot) => slot.id === activeSlotId) ?? null,
    [selectedPreset, activeSlotId]
  );

  const displaySlots = useMemo(
    () => (selectedPreset ? getSlotDisplayOrder(selectedPreset.slots) : []),
    [selectedPreset]
  );

  const selectableRelics = useMemo(() => {
    if (!selectedLoadout || !selectedSlot) {
      return [];
    }

    return getSelectableRelics({
      slot: selectedSlot,
      inventory,
      assignments: selectedLoadout.assignments,
      currentSlotId: selectedSlot.id
    });
  }, [inventory, selectedLoadout, selectedSlot]);

  const activeKeywordLabels = useMemo(
    () =>
      COMMON_KEYWORDS.filter((keyword) => activeKeywordKeys.includes(keyword.key)).map((keyword) =>
        keyword.label.toLowerCase()
      ),
    [activeKeywordKeys]
  );

  const filteredAndSortedRelics = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = selectableRelics.filter((relic) => {
      const searchableText = getSearchableText(relic);
      if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
        return false;
      }
      return activeKeywordLabels.every((keyword) => searchableText.includes(keyword));
    });

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortMode === "positive_count") {
        const diff = countEffects(right.positiveEffectIds) - countEffects(left.positiveEffectIds);
        if (diff !== 0) {
          return diff;
        }
      }

      if (sortMode === "negative_count") {
        const diff = countEffects(left.negativeEffectIds) - countEffects(right.negativeEffectIds);
        if (diff !== 0) {
          return diff;
        }
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });

    return sorted;
  }, [activeKeywordLabels, searchQuery, selectableRelics, sortMode]);

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPickerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPickerOpen]);

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }
    setSearchQuery("");
    setActiveKeywordKeys([]);
    setSortMode("recent");
  }, [isPickerOpen, activeSlotId]);

  const updateLoadout = (updater: (loadout: Loadout) => Loadout) => {
    if (!selectedLoadout) {
      return;
    }

    const nextLoadouts = loadouts.map((loadout) => {
      if (loadout.id !== selectedLoadout.id) {
        return loadout;
      }
      return updater(loadout);
    });

    onLoadoutsChange(nextLoadouts);
  };

  const handleCreateLoadout = () => {
    if (!selectedPreset) {
      return;
    }

    const character = CHARACTERS.find((entry) => entry.id === selectedCharacterId);
    const now = new Date().toISOString();
    const loadoutName =
      newLoadoutName.trim().length > 0
        ? newLoadoutName.trim()
        : `${character?.name ?? "キャラクター"}-${selectedPreset.name}-ビルド${visibleLoadouts.length + 1}`;

    const nextLoadout: Loadout = {
      id: createId("loadout"),
      name: loadoutName,
      characterId: selectedCharacterId,
      presetId: selectedPreset.id,
      assignments: createAssignmentsFromPreset(selectedPreset),
      createdAt: now,
      updatedAt: now
    };

    onLoadoutsChange([...loadouts, nextLoadout]);
    setSelectedLoadoutId(nextLoadout.id);
    setActiveSlotId(null);
    setNewLoadoutName("");
    setIsPickerOpen(false);
  };

  const handleDeleteLoadout = () => {
    if (!selectedLoadout) {
      return;
    }
    if (!window.confirm("このビルドを削除しますか？")) {
      return;
    }

    onLoadoutsChange(loadouts.filter((loadout) => loadout.id !== selectedLoadout.id));
    setSelectedLoadoutId(null);
    setActiveSlotId(null);
    setIsPickerOpen(false);
  };

  const handleAssignRelic = (relicId: string | null) => {
    if (!selectedLoadout || !selectedSlot) {
      return;
    }

    updateLoadout((loadout) => ({
      ...loadout,
      assignments: {
        ...loadout.assignments,
        [selectedSlot.id]: relicId
      },
      updatedAt: new Date().toISOString()
    }));
    setIsPickerOpen(false);
  };

  const handleRename = (name: string) => {
    if (!selectedLoadout) {
      return;
    }

    updateLoadout((loadout) => ({
      ...loadout,
      name,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleSlotClick = (slotId: string) => {
    setActiveSlotId(slotId);
    if (selectedLoadout) {
      setIsPickerOpen(true);
    }
  };

  const toggleKeyword = (keywordKey: string) => {
    setActiveKeywordKeys((previous) => {
      if (previous.includes(keywordKey)) {
        return previous.filter((item) => item !== keywordKey);
      }
      return [...previous, keywordKey];
    });
  };

  return (
    <section className="panel-grid">
      <div className="panel">
        <h2>ビルド設定</h2>

        <div className="field">
          <label htmlFor="character-select">
            <span>キャラクター</span>
          </label>
          <select
            id="character-select"
            data-testid="character-select"
            value={selectedCharacterId}
            onChange={(event) => setSelectedCharacterId(event.target.value)}
          >
            {CHARACTERS.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="preset-select">
            <span>献器</span>
          </label>
          <select
            id="preset-select"
            data-testid="preset-select"
            value={selectedPresetId}
            onChange={(event) => {
              setSelectedPresetId(event.target.value);
              setSelectedLoadoutId(null);
              setActiveSlotId(null);
              setIsPickerOpen(false);
            }}
          >
            {characterPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        </div>

        <label className="field">
          <span>新規ビルド名</span>
          <div className="input-row">
            <input
              type="text"
              value={newLoadoutName}
              onChange={(event) => setNewLoadoutName(event.target.value)}
              placeholder="例: 対ボス火力"
            />
            <button type="button" className="primary" onClick={handleCreateLoadout} disabled={!selectedPreset}>
              作成
            </button>
          </div>
        </label>

        <div className="field">
          <label htmlFor="loadout-select">
            <span>ビルド</span>
          </label>
          <select
            id="loadout-select"
            data-testid="loadout-select"
            value={selectedLoadoutId ?? ""}
            onChange={(event) => setSelectedLoadoutId(event.target.value || null)}
          >
            <option value="">選択してください</option>
            {visibleLoadouts.map((loadout) => (
              <option key={loadout.id} value={loadout.id}>
                {loadout.name}
              </option>
            ))}
          </select>
        </div>

        {selectedLoadout && (
          <div className="field">
            <span>ビルド名編集</span>
            <div className="input-row">
              <input type="text" value={selectedLoadout.name} onChange={(event) => handleRename(event.target.value)} />
              <button type="button" onClick={handleDeleteLoadout}>
                削除
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="panel panel-layout">
        <h2>配置</h2>
        {!selectedPreset && <p className="muted">プリセットを選択してください。</p>}
        {selectedPreset && (
          <>
            <div className="slot-grid">
              {displaySlots.map((slot) => {
                const assignedRelicId = selectedLoadout?.assignments[slot.id] ?? null;
                const assignedRelic = inventory.find((relic) => relic.id === assignedRelicId) ?? null;
                const isActive = selectedSlot?.id === slot.id && isPickerOpen;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    data-testid={`slot-${slot.id}`}
                    className={`slot-button slot-tier-${slot.tier} slot-color-${slot.color} ${isActive ? "active" : ""}`}
                    onClick={() => handleSlotClick(slot.id)}
                  >
                    <strong>{getSlotHeader(slot)}</strong>
                    {!assignedRelic && <span>未配置</span>}
                    {assignedRelic && (
                      <>
                        <span className="effect-line" style={{ whiteSpace: "pre-line" }}>{formatEffects(assignedRelic.positiveEffectIds)}</span>
                        {assignedRelic.type === "deep" && (
                          <><div>---</div>
                          <span className="effect-line" style={{ whiteSpace: "pre-line" }}>{formatEffects(assignedRelic.negativeEffectIds)}</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            {!selectedLoadout && <p className="muted">ビルドを作成または選択してください。</p>}
          </>
        )}
      </div>

      {selectedLoadout && selectedSlot && isPickerOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsPickerOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="relic-picker-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="relic-picker-title">{getSlotHeader(selectedSlot)} の遺物選択</h3>
              <button type="button" aria-label="閉じる" onClick={() => setIsPickerOpen(false)}>
                ×
              </button>
            </div>
            <p className="muted">候補は条件に合う遺物だけ自動表示されています。</p>
            <div className="picker-tools">
              <label htmlFor="relic-search-input">
                <span>検索</span>
                <input
                  id="relic-search-input"
                  data-testid="relic-search-input"
                  type="text"
                  placeholder="効果名で検索"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
              <label htmlFor="relic-sort-select">
                <span>並び替え</span>
                <select
                  id="relic-sort-select"
                  data-testid="relic-sort-select"
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as PickerSortMode)}
                >
                  <option value="recent">新しい順</option>
                  <option value="positive_count">正効果が多い順</option>
                  <option value="negative_count">負効果が少ない順</option>
                </select>
              </label>
            </div>
            <div className="keyword-chips">
              {COMMON_KEYWORDS.map((keyword) => {
                const isActive = activeKeywordKeys.includes(keyword.key);
                return (
                  <button
                    key={keyword.key}
                    type="button"
                    data-testid={`keyword-${keyword.key}`}
                    className={`keyword-chip ${isActive ? "active" : ""}`}
                    onClick={() => toggleKeyword(keyword.key)}
                  >
                    {keyword.label}
                  </button>
                );
              })}
              <button
                type="button"
                className="keyword-clear"
                onClick={() => {
                  setSearchQuery("");
                  setActiveKeywordKeys([]);
                }}
              >
                条件クリア
              </button>
            </div>
            <div className="picker-actions">
              <button type="button" data-testid="clear-slot" onClick={() => handleAssignRelic(null)}>
                この枠を空にする
              </button>
            </div>
            {filteredAndSortedRelics.length === 0 && <p className="muted">条件に一致する遺物がありません。</p>}
            <ul className="item-list">
              {filteredAndSortedRelics.map((relic) => (
                <li key={relic.id}>
                  <div>
                    <strong>{formatEffects(relic.positiveEffectIds)}</strong>
                    {relic.type === "deep" && <p>{formatEffects(relic.negativeEffectIds)}</p>}
                  </div>
                  <button
                    type="button"
                    data-testid={`candidate-${relic.id}`}
                    onClick={() => handleAssignRelic(relic.id)}
                  >
                    配置
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
