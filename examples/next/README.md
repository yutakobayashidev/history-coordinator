# Next.js Example

App Router を使ったタスクダッシュボードのデモです。`/tasks` でタスクリストを表示し、アイテムを選択すると URL を `/tasks/[id]` へ pushState で更新しつつ、シート型の詳細ビューを開きます。ページを再読込した場合は Next.js が SSR で `app/tasks/[id]/page.tsx` をレンダリングするため、通常のルーティングとも衝突しません。

## セットアップ

```bash
pnpm install
pnpm --filter @path-controller/core build
pnpm --filter @path-controller/example-next dev
```

- 開発サーバーは `http://localhost:3000` で起動します。
- `/tasks` ページでタスクをクリックすると、URL と `history.state` が更新されシートが開きます。
- ブラウザの戻る/進む・ページの再読込を行うと、履歴コーディネーターが状態を復元します。`History Feed` で `push`/`pop`/`replace` のイベントを確認できます。
- `/tasks/[id]` を直接開くと、App Router のルーティングによって詳細ページが SSR で表示されます。

## 実装メモ

- `HistoryProvider` をアプリ全体に配置し、クライアントコンポーネントで `useHistory` / `useHistorySubscription` を呼び出して状態を同期。
- 初期表示では URL と `history.state` を突き合わせ、`/tasks/[id]` からの直アクセスでもシート表示を再現。
- `TaskDetailContent` をページとシートで共有し、pushState の UI 遷移と Next.js 既定のルーティングが両立する構成を示しています。
