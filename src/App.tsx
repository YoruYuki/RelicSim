import { useEffect, useMemo, useRef, useState } from "react";
import { CHARACTERS, CONTAINER_PRESETS } from "./data/gameData";
import { INNATE_RELICS, isInnateRelicId, mergeWithInnateRelics } from "./data/innateRelics";
import { buildDamageCalculatorExport } from "./domain/damageExport";
import RelicRegistrationTab from "./features/relics/RelicRegistrationTab";
import LoadoutTab from "./features/loadouts/LoadoutTab";
import type { AppState, ImportMode, Relic } from "./domain/types";
import { exportStateToJson, importFromJson, loadState, saveState } from "./domain/storage";

type TabKey = "relics" | "loadouts";

function downloadJson(jsonText: string, filePrefix: string): void {
  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  anchor.href = url;
  anchor.download = `${filePrefix}-${timestamp}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function upsertRelic(inventory: Relic[], relic: Relic): Relic[] {
  const index = inventory.findIndex((entry) => entry.id === relic.id);
  if (index < 0) {
    return [...inventory, relic];
  }
  const next = [...inventory];
  next[index] = relic;
  return next;
}

export default function App(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabKey>("relics");
  const [state, setState] = useState<AppState>(() => loadState());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fullInventory = useMemo(() => mergeWithInnateRelics(state.inventory), [state.inventory]);
  const [isDamageExportModalOpen, setIsDamageExportModalOpen] = useState<boolean>(false);
  const [selectedDamageExportLoadoutId, setSelectedDamageExportLoadoutId] = useState<string>("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (!isDamageExportModalOpen) {
      return;
    }

    if (state.loadouts.length === 0) {
      setIsDamageExportModalOpen(false);
      setSelectedDamageExportLoadoutId("");
      return;
    }

    if (!state.loadouts.some((loadout) => loadout.id === selectedDamageExportLoadoutId)) {
      setSelectedDamageExportLoadoutId(state.loadouts[0].id);
    }
  }, [isDamageExportModalOpen, selectedDamageExportLoadoutId, state.loadouts]);

  useEffect(() => {
    if (!isDamageExportModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDamageExportModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDamageExportModalOpen]);

  const handleSaveRelic = (relic: Relic) => {
    setState((previous) => ({
      ...previous,
      inventory: upsertRelic(previous.inventory, relic)
    }));
  };

  const handleDeleteRelic = (relicId: string) => {
    if (isInnateRelicId(relicId)) {
      return;
    }

    setState((previous) => {
      const nextInventory = previous.inventory.filter((relic) => relic.id !== relicId);
      const nextLoadouts = previous.loadouts.map((loadout) => ({
        ...loadout,
        assignments: Object.fromEntries(
          Object.entries(loadout.assignments).map(([slotId, assignedRelicId]) => [
            slotId,
            assignedRelicId === relicId ? null : assignedRelicId
          ])
        ),
        updatedAt: new Date().toISOString()
      }));

      return {
        ...previous,
        inventory: nextInventory,
        loadouts: nextLoadouts
      };
    });
  };

  const handleImportInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      const jsonText = await file.text();
      const shouldReplace = window.confirm(
        "インポート方法を選択してください。\nOK: 上書き\nキャンセル: マージ（ID競合時は重複保持）"
      );
      const mode: ImportMode = shouldReplace ? "replace" : "merge";
      const nextState = importFromJson(jsonText, state, mode);
      setState(nextState);
      window.alert(`インポート完了: ${mode === "replace" ? "上書き" : "マージ"}を適用しました。`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "インポートに失敗しました。";
      window.alert(message);
    }
  };

  const handleOpenDamageCalculatorExportModal = () => {
    if (state.loadouts.length === 0) {
      window.alert("出力できるビルドがありません。");
      return;
    }

    const defaultLoadoutId =
      selectedDamageExportLoadoutId && state.loadouts.some((loadout) => loadout.id === selectedDamageExportLoadoutId)
        ? selectedDamageExportLoadoutId
        : state.loadouts[0].id;

    setSelectedDamageExportLoadoutId(defaultLoadoutId);
    setIsDamageExportModalOpen(true);
  };

  const handleConfirmDamageCalculatorExport = () => {
    if (!selectedDamageExportLoadoutId) {
      window.alert("プランを選択してください。");
      return;
    }

    const selectedLoadout = state.loadouts.find((loadout) => loadout.id === selectedDamageExportLoadoutId);
    if (!selectedLoadout) {
      window.alert("プランを選択してください。");
      return;
    }

    try {
      const payload = buildDamageCalculatorExport({
        loadout: selectedLoadout,
        inventory: fullInventory,
        outputName: selectedLoadout.name
      });

      downloadJson(JSON.stringify(payload, null, 2), "damage-calc");
      window.alert(`ダメ計算機フォーマットを出力しました: ${selectedLoadout.name}`);
      setIsDamageExportModalOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "ダメ計算機フォーマットの出力に失敗しました。";
      window.alert(message);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>ナイトレイン 遺物シミュレーター</h1>
          <p>白面さんのダメージ計算機用に出力できますぞ。</p>
        </div>
        <div className="topbar-actions">
          <button type="button" onClick={() => downloadJson(exportStateToJson(state), "nightreign-relic-data")}>
            保存
          </button>
          <button type="button" onClick={handleImportInputClick}>
            読込
          </button>
          <button type="button" onClick={handleOpenDamageCalculatorExportModal}>
            ダメ計算機出力
          </button>
          {/*'<button type="button" disabled title="今後対応予定">
            自動最適化 (Coming Soon)
          </button>'*/}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={activeTab === "relics" ? "active" : ""}
          onClick={() => setActiveTab("relics")}
        >
          遺物登録
        </button>
        <button
          type="button"
          className={activeTab === "loadouts" ? "active" : ""}
          onClick={() => setActiveTab("loadouts")}
        >
          配置シミュレーション
        </button>
      </nav>

      <main>
        {activeTab === "relics" ? (
          <RelicRegistrationTab
            inventory={state.inventory}
            innateRelics={INNATE_RELICS}
            onSaveRelic={handleSaveRelic}
            onDeleteRelic={handleDeleteRelic}
          />
        ) : (
          <LoadoutTab
            inventory={fullInventory}
            loadouts={state.loadouts}
            onLoadoutsChange={(nextLoadouts) => setState((previous) => ({ ...previous, loadouts: nextLoadouts }))}
          />
        )}
      </main>

      {isDamageExportModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => setIsDamageExportModalOpen(false)}>
          <div
            className="modal modal-narrow"
            role="dialog"
            aria-modal="true"
            aria-labelledby="damage-export-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="damage-export-modal-title">ダメ計算機出力</h3>
              <button type="button" aria-label="閉じる" onClick={() => setIsDamageExportModalOpen(false)}>
                ×
              </button>
            </div>

            <div className="field">
              <label htmlFor="damage-export-loadout-select">
                <span>出力するプラン</span>
              </label>
              <select
                id="damage-export-loadout-select"
                value={selectedDamageExportLoadoutId}
                onChange={(event) => setSelectedDamageExportLoadoutId(event.target.value)}
              >
                {state.loadouts.map((loadout) => {
                  const characterName =
                    CHARACTERS.find((character) => character.id === loadout.characterId)?.name ?? loadout.characterId;
                  const presetName = CONTAINER_PRESETS.find((preset) => preset.id === loadout.presetId)?.name ?? loadout.presetId;
                  return (
                    <option key={loadout.id} value={loadout.id}>
                      {`${loadout.name} (${characterName} / ${presetName})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-actions modal-actions">
              <button type="button" onClick={() => setIsDamageExportModalOpen(false)}>
                キャンセル
              </button>
              <button
                type="button"
                className="primary"
                onClick={handleConfirmDamageCalculatorExport}
                disabled={!selectedDamageExportLoadoutId}
              >
                出力
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
