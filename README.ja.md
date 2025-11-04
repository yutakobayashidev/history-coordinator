# @your-scope/history-coordinator

ブラウザの History API を薄くラップし、オーバーレイやサイドピークを持つ UI で push / replace / pop を一元管理する軽量ライブラリです。状態オブジェクトを安全に履歴へ保存し、必要に応じて React 向けのヘルパーやルーティングユーティリティを利用できます。

## 特長

- `window.history` の最小ラッパーにシリアライズフックを追加。
- push / replace / pop をイベントとして通知し、複数コンポーネントを同期。
- URL 解析ではなく `history.state` に「何を表示したいか」を記録。
- React プロバイダ/フックと、述語ベースのルータをオプションで提供。

## インストール

```bash
npm install @your-scope/history-coordinator
```

コアライブラリはランタイム依存を持ちません。React 連携を使う場合は `react` / `react-dom`（推奨 v17+）が必要です。

## はじめかた

```ts
import { createHistoryCoordinator } from "@your-scope/history-coordinator";

type ViewState =
  | { type: "record"; id: string; presentation: "overlay" | "page" }
  | { type: "onboarding"; step: "intro" | "details" | "complete" };

const history = createHistoryCoordinator<ViewState>();

history.subscribe(({ direction, entry }) => {
  console.log(direction, entry.url, entry.state);
});

history.push({
  url: "/records/alpha/overlay/details",
  state: { type: "record", id: "alpha", presentation: "overlay" },
});
```

## パターン

### コーディネータを共有する

シングルトンを作成してエクスポートするか、コンテキスト経由で注入します。

```ts
// history/coordinator.ts
import { createHistoryCoordinator } from "@your-scope/history-coordinator";
import type { ViewState } from "./state";

export const appHistory = createHistoryCoordinator<ViewState>();
```

### `history.state` に意図を保存する

UI を再構築するのに必要な最小情報だけを載せ、type で分岐します。

```ts
// history/state.ts
export type ViewState =
  | { type: "record"; id: string; presentation: "overlay" | "page"; tab?: string }
  | { type: "dashboard"; widget: string }
  | { type: "onboarding"; step: number };
```

### イベントを購読して状態を更新

```ts
// history/listeners.ts
import { appHistory } from "./coordinator";

const unsubscribe = appHistory.subscribe(({ entry }) => {
  if (entry.state?.type === "record" && entry.state.presentation === "overlay") {
    recordOverlayStore.open(entry.state.id);
  } else if (entry.state?.type === "record") {
    recordOverlayStore.close();
  }
});
```

## React との連携

```tsx
import { HistoryProvider, useHistory, useHistorySubscription } from "@your-scope/history-coordinator/react";
import type { ViewState } from "@/history/state";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <HistoryProvider>{children}</HistoryProvider>;
}

export function RecordCard({ record }: { record: RecordSummary }) {
  const history = useHistory<ViewState>();

  return (
    <button
      onClick={() =>
        history.push({
          url: `/records/${record.id}/overlay`,
          state: { type: "record", id: record.id, presentation: "overlay" },
        })
      }
    >
      詳細を開く
    </button>
  );
}

export function OnboardingWatcher() {
  useHistorySubscription<ViewState>(({ entry }) => {
    if (entry.state?.type === "onboarding") {
      setCurrentStep(entry.state.step);
    }
  }, []);

  return null;
}
```

## ルーティングユーティリティ（任意）

`createHistoryRouter` を使うと、条件に応じてイベントを振り分けられます。

```ts
import { createHistoryCoordinator, createHistoryRouter } from "@your-scope/history-coordinator";
import type { ViewState } from "./state";

const history = createHistoryCoordinator<ViewState>();

createHistoryRouter(history, [
  {
    test: (entry) => entry.state?.type === "record",
    listener: ({ entry, direction }) => overlayController.sync(entry.state!, direction),
  },
  {
    test: (entry) => entry.state?.type === "onboarding",
    listener: ({ entry }) => onboardingStore.setStep(entry.state!.step),
  },
]);
```

## API リファレンス

### `createHistoryCoordinator(options?)`

指定した `window`（既定はグローバル）に紐づくコーディネータを生成します。`window` が無い環境では例外を投げます。

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `window` | `Window` | グローバル `window` | テスト用にカスタム window を注入する際に使用。
| `emitOnSameUrl` | `boolean` | `true` | URL が変化しない場合に通知をスキップするか。
| `serializeState` | `(state: unknown) => unknown` | identity | 履歴に保存する前に state を加工。
| `deserializeState` | `(raw: unknown) => unknown` | identity | 履歴から復元する際に state を加工。

**メソッド**

- `push(entry)` – エントリを push し、リスナーへ通知。
- `replace(entry)` – 現在のエントリを置き換え、リスナーへ通知。
- `go(delta)` – `history.go` のプロキシ。
- `subscribe(listener)` – リスナーを登録し、解除関数を返す。
- `destroy()` – 全リスナーと内部の `popstate` ハンドラを解除。

### `createHistoryRouter(coordinator, routes)`

コーディネータを購読し、`test` 条件を満たすルートへイベントを配信します。戻り値は購読解除用関数です。

### React エクスポート

- `HistoryProvider` – コーディネータをコンテキストで共有し、アンマウント時に `destroy()`。
- `useHistory()` – コンテキストからコーディネータを取得（プロバイダ外では例外）。
- `useHistorySubscription(listener, deps?)` – 履歴イベントを購読し、自動でクリーンアップ。

## 開発

```bash
npm run build
```

`tsc` を実行し、`dist/` に型定義付きの成果物を生成します。

## ライセンス

MIT
