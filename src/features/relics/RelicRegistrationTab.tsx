import { useMemo, useState } from "react";
import {
  DEEP_NEGATIVE_EFFECTS,
  DEEP_POSITIVE_EFFECTS,
  NORMAL_POSITIVE_EFFECTS,
  RELIC_COLOR_LABELS,
  RELIC_TIER_LABELS,
  getEffectLabel
} from "../../data/gameData";
import { createId } from "../../domain/ids";
import type { EffectSelection, Relic, RelicColor, RelicTier } from "../../domain/types";

interface RelicRegistrationTabProps {
  inventory: Relic[];
  innateRelics?: Relic[];
  onSaveRelic: (relic: Relic) => void;
  onDeleteRelic: (relicId: string) => void;
}

interface RelicFormState {
  type: RelicTier;
  color: RelicColor;
  positiveEffectIds: EffectSelection;
  negativeEffectIds: EffectSelection;
}

const EMPTY_EFFECTS: EffectSelection = [null, null, null];

function createInitialFormState(): RelicFormState {
  return {
    type: "normal",
    color: "red",
    positiveEffectIds: [...EMPTY_EFFECTS] as EffectSelection,
    negativeEffectIds: [...EMPTY_EFFECTS] as EffectSelection
  };
}

function formatEffectList(effectIds: EffectSelection): string {
  const labels = effectIds.filter((effectId): effectId is string => effectId !== null).map((effectId) => getEffectLabel(effectId));
  return labels.length > 0 ? labels.join(" \n ") : "未設定";
}

export default function RelicRegistrationTab({
  inventory,
  innateRelics = [],
  onSaveRelic,
  onDeleteRelic
}: RelicRegistrationTabProps): JSX.Element {
  const [form, setForm] = useState<RelicFormState>(createInitialFormState);
  const [editingRelicId, setEditingRelicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editingRelic = useMemo(
    () => inventory.find((relic) => relic.id === editingRelicId) ?? null,
    [inventory, editingRelicId]
  );

  const positiveOptions = form.type === "normal" ? NORMAL_POSITIVE_EFFECTS : DEEP_POSITIVE_EFFECTS;

  const selectedPositiveIds = new Set(
    form.positiveEffectIds.filter((effectId): effectId is string => effectId !== null)
  );

  const handleTypeChange = (type: RelicTier) => {
    setForm((previous) => ({
      ...previous,
      type,
      positiveEffectIds: [...EMPTY_EFFECTS] as EffectSelection,
      negativeEffectIds: [...EMPTY_EFFECTS] as EffectSelection
    }));
    setError(null);
  };

  const handlePositiveChange = (index: number, rawValue: string) => {
    const nextValue = rawValue || null;
    setForm((previous) => {
      const positiveEffectIds = [...previous.positiveEffectIds] as EffectSelection;
      positiveEffectIds[index] = nextValue;

      let negativeEffectIds = previous.negativeEffectIds;
      if (previous.type === "deep" && !nextValue) {
        negativeEffectIds = [...previous.negativeEffectIds] as EffectSelection;
        negativeEffectIds[index] = null;
      }

      return {
        ...previous,
        positiveEffectIds,
        negativeEffectIds
      };
    });
    setError(null);
  };

  const handleNegativeChange = (index: number, rawValue: string) => {
    const nextValue = rawValue || null;
    setForm((previous) => {
      const negativeEffectIds = [...previous.negativeEffectIds] as EffectSelection;
      negativeEffectIds[index] = nextValue;
      return {
        ...previous,
        negativeEffectIds
      };
    });
  };

  const resetForm = () => {
    setForm(createInitialFormState());
    setEditingRelicId(null);
    setError(null);
  };

  const beginEdit = (relic: Relic) => {
    setEditingRelicId(relic.id);
    setForm({
      type: relic.type,
      color: relic.color,
      positiveEffectIds: [...relic.positiveEffectIds] as EffectSelection,
      negativeEffectIds: [...relic.negativeEffectIds] as EffectSelection
    });
    setError(null);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedPositives = form.positiveEffectIds.filter((effectId): effectId is string => effectId !== null);
    if (selectedPositives.length === 0) {
      setError("正効果を最低1つ選択してください。");
      return;
    }

    if (selectedPositives.length !== selectedPositiveIds.size) {
      setError("同じ正効果を重複して選択できません。");
      return;
    }

    const now = new Date().toISOString();
    const normalizedNegativeEffectIds =
      form.type === "deep"
        ? (form.negativeEffectIds.map((effectId, index) => (form.positiveEffectIds[index] ? effectId : null)) as EffectSelection)
        : ([null, null, null] as EffectSelection);

    const relic: Relic = {
      id: editingRelic?.id ?? createId("relic"),
      type: form.type,
      color: form.color,
      positiveEffectIds: [...form.positiveEffectIds] as EffectSelection,
      negativeEffectIds: normalizedNegativeEffectIds,
      createdAt: editingRelic?.createdAt ?? now,
      updatedAt: now
    };

    onSaveRelic(relic);
    resetForm();
  };

  return (
    <section className="panel-grid">
      <form className="panel panel-form" onSubmit={handleSubmit}>
        <h2>{editingRelic ? "遺物編集" : "遺物登録"}</h2>

        <label className="field">
          <span>遺物タイプ</span>
          <div className="segmented">
            <button
              type="button"
              className={form.type === "normal" ? "active" : ""}
              onClick={() => handleTypeChange("normal")}
            >
              通常遺物
            </button>
            <button
              type="button"
              className={form.type === "deep" ? "active" : ""}
              onClick={() => handleTypeChange("deep")}
            >
              深層遺物
            </button>
          </div>
        </label>

        <label className="field">
          <span>色</span>
          <select value={form.color} onChange={(event) => setForm((previous) => ({ ...previous, color: event.target.value as RelicColor }))}>
            <option value="red">赤</option>
            <option value="yellow">黄</option>
            <option value="green">緑</option>
            <option value="blue">青</option>
          </select>
        </label>

        <div className="field">
          <span>効果</span>
          <div className="three-column">
            {[0, 1, 2].map((index) => {
              const currentValue = form.positiveEffectIds[index];
              return (
                <select
                  key={`positive-${index}`}
                  value={currentValue ?? ""}
                  onChange={(event) => handlePositiveChange(index, event.target.value)}
                >
                  <option value="">未選択</option>
                  {positiveOptions.map((option) => {
                    const selectedInOtherField =
                      option.id !== currentValue && form.positiveEffectIds.some((effectId) => effectId === option.id);
                    return (
                      <option key={option.id} value={option.id} disabled={selectedInOtherField}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              );
            })}
          </div>
        </div>

        {form.type === "deep" && (
          <div className="field">
            <span>デメリット</span>
            <div className="three-column">
              {[0, 1, 2].map((index) => (
                <select
                  key={`negative-${index}`}
                  value={form.negativeEffectIds[index] ?? ""}
                  onChange={(event) => handleNegativeChange(index, event.target.value)}
                  disabled={!form.positiveEffectIds[index]}
                >
                  <option value="">なし</option>
                  {DEEP_NEGATIVE_EFFECTS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="primary">
            {editingRelic ? "更新" : "登録"}
          </button>
          <button type="button" onClick={resetForm}>
            クリア
          </button>
        </div>
      </form>

      <div className="panel">
        <h2>登録済み遺物 ({inventory.length})</h2>
        {inventory.length === 0 && <p className="muted">まだ遺物が登録されていません。</p>}
        <ul className="item-list">
          {inventory.map((relic) => (
            <li key={relic.id}>
              <div>
                <strong>
                  {RELIC_TIER_LABELS[relic.type]} / {RELIC_COLOR_LABELS[relic.color]}
                </strong>
                <p style={{ whiteSpace: "pre-line" }}>{formatEffectList(relic.positiveEffectIds)}</p>
                {relic.type === "deep" && (<><div>---</div><p style={{ whiteSpace: "pre-line" }}>{formatEffectList(relic.negativeEffectIds)}</p></>)}
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => beginEdit(relic)}>
                  編集
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("この遺物を削除しますか？")) {
                      onDeleteRelic(relic.id);
                      if (editingRelicId === relic.id) {
                        resetForm();
                      }
                    }
                  }}
                >
                  削除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h2>固有遺物 ({innateRelics.length})</h2>
        {innateRelics.length === 0 && <p className="muted">固有遺物は未設定です。</p>}
        <ul className="item-list">
          {innateRelics.map((relic) => (
            <li key={relic.id}>
              <div>
                <strong>
                  {RELIC_TIER_LABELS[relic.type]} / {RELIC_COLOR_LABELS[relic.color]}
                </strong>
                <p style={{ whiteSpace: "pre-line" }}>{formatEffectList(relic.positiveEffectIds)}</p>
                {relic.type === "deep" && (
                  <>
                    <div>---</div>
                    <p style={{ whiteSpace: "pre-line" }}>{formatEffectList(relic.negativeEffectIds)}</p>
                  </>
                )}
              </div>
              <div className="row-actions">
                <button type="button" disabled>
                  固有
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
