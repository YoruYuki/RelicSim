import type { Loadout, Relic } from "./types";

export interface OptimizationRequest {
  characterId: string;
  presetId: string;
  targetEffectIds: string[];
  inventory: Relic[];
}

export interface OptimizationCandidate {
  loadout: Loadout;
  score: number;
  matchedEffectIds: string[];
}

export interface OptimizationResult {
  status: "not_implemented";
  candidates: OptimizationCandidate[];
  message: string;
}

export function optimizeLoadout(_request: OptimizationRequest): OptimizationResult {
  return {
    status: "not_implemented",
    candidates: [],
    //自動最適化は今後のバージョンで対応予定です。
    message: ""
  };
}
