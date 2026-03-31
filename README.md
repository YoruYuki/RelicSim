# ナイトレイン 遺物シミュレーター

GitHub Pages で動作する、遺物登録と配置シミュレーション用の Web アプリです。

## 開発

```bash
npm install
npm run dev
```

## テスト / ビルド

```bash
npm run test
npm run build
```

## 機能

- 遺物登録タブ
  - 通常/深層、色、正効果(3枠)、深層負効果(3枠)を登録
  - 正効果重複禁止
  - 登録済み遺物の編集/削除
- 配置シミュレーションタブ
  - キャラクター -> 献器 -> 遺物配置
  - 白枠は「色のみ自由」、通常/深層の種別制限は維持
  - 同一遺物の重複配置禁止
  - 複数ビルド保存
- 保存
  - localStorage 自動保存
  - JSON エクスポート/インポート（毎回 上書き/マージを選択）
  - マージ時の ID 競合は新 ID を採番して重複保持
- 将来拡張
  - `src/domain/optimizer.ts` に自動最適化インターフェースを定義済み

## データについて

現在のキャラクター・容器・効果データは `src/data/gameData.ts` のサンプル固定データです。  
正式データに差し替える場合は同ファイルの定数を更新してください。

## GitHub Pages デプロイ

- `main` ブランチへ push すると `.github/workflows/deploy.yml` で自動デプロイします。
- リポジトリ側の Settings -> Pages で GitHub Actions を有効化してください。
