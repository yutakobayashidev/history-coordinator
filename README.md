# @your-scope/history-coordinator

A lightweight wrapper around the browser History API for interfaces that open contextual panes, overlays, or wizards without losing the underlying page state. The coordinator normalises push/replace/pop events, lets you attach custom state objects, and ships with optional React helpers and routing utilities.

## Features

- Minimal API over `window.history` with pluggable state serialisation.
- Event notifications for push/replace/pop so multiple widgets can stay in sync.
- Typed state payloads that describe "what should be on screen" instead of re-parsing URLs.
- Optional React provider/hooks and an observable router for predicate-based dispatch.

## Installation

```bash
npm install @your-scope/history-coordinator
```

The core package has no runtime dependencies. React bindings require `react` and `react-dom` (v17+ recommended).

## Quick start

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

## Patterns

### Share the coordinator

Create a singleton and export it, or inject it through context so every part of the app works with the same instance.

```ts
// history/coordinator.ts
import { createHistoryCoordinator } from "@your-scope/history-coordinator";
import type { ViewState } from "./state";

export const appHistory = createHistoryCoordinator<ViewState>();
```

### Encode intent in `history.state`

Store the smallest piece of information needed to rebuild the UI, for example:

```ts
// history/state.ts
export type ViewState =
  | { type: "record"; id: string; presentation: "overlay" | "page"; tab?: string }
  | { type: "dashboard"; widget: string }
  | { type: "onboarding"; step: number };
```

Components can branch on `entry.state?.type` instead of parsing parameters.

### Listen and react

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

## React integration

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
      Open overlay
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

## Routing helper (optional)

Use `createHistoryRouter` when you want to declaratively fan out events.

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

## API reference

### `createHistoryCoordinator(options?)`

Creates a coordinator bound to a `window` (defaults to the global object). Throws if no window is available.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `window` | `Window` | global `window` | Inject a custom window, useful in tests.
| `emitOnSameUrl` | `boolean` | `true` | When `false`, listeners are skipped if the URL does not change.
| `serializeState` | `(state: unknown) => unknown` | identity | Customise how `state` is stored in History.
| `deserializeState` | `(raw: unknown) => unknown` | identity | Customise how `state` is restored from History.

**Methods**

- `push(entry)` – pushes a new entry and notifies listeners.
- `replace(entry)` – replaces the current entry and notifies listeners.
- `go(delta)` – proxies to `history.go`.
- `subscribe(listener)` – registers a listener; returns an unsubscribe function.
- `destroy()` – clears listeners and removes the internal `popstate` handler.

### `createHistoryRouter(coordinator, routes)`

Subscribes to the coordinator and dispatches events whose `test` predicate returns true. Returns an unsubscribe function.

### React exports

- `HistoryProvider` – Provides a coordinator via context. Destroys it on unmount.
- `useHistory()` – Retrieves the coordinator from context. Throws if called outside the provider.
- `useHistorySubscription(listener, deps?)` – Subscribes to history events with automatic cleanup.
- `usePathParams(pattern)` – Parses `window.location.pathname` using a Next.js-style pattern like `/posts/[id]`.

## Development

```bash
npm run build
```

Runs `tsc` using the repository `tsconfig.json` and emits declarations to `dist/`.

## License

MIT
