import {
  HistoryCoordinator,
  HistoryCoordinatorOptions,
  HistoryDirection,
  HistoryEntry,
  HistoryEvent,
  HistoryListener,
} from "./types";

const noopSerialize = (value: unknown) => value;
const noopDeserialize = (value: unknown) => value;

export function createHistoryCoordinator<State = unknown>(
  options: HistoryCoordinatorOptions = {}
): HistoryCoordinator<State> {
  const win = options.window ?? (typeof window !== "undefined" ? window : undefined);
  if (!win) throw new Error("Window object is not available");

  const listeners = new Set<HistoryListener<State>>();
  const emitOnSameUrl = options.emitOnSameUrl ?? true;
  const serialize = options.serializeState ?? noopSerialize;
  const deserialize = options.deserializeState ?? noopDeserialize;

  const toEntry = (url: string, state: unknown, title?: string): HistoryEntry<State> => ({
    url,
    title,
    state: deserialize(state) as State | undefined,
  });

  let lastEntry: HistoryEntry<State> | null = toEntry(
    win.location.href,
    win.history.state,
    win.document?.title
  );

  const shouldEmit = (entry: HistoryEntry<State>) => {
    if (emitOnSameUrl) return true;
    if (!lastEntry) return true;
    return entry.url !== lastEntry.url;
  };

  const notify = (
    direction: HistoryDirection,
    entry: HistoryEntry<State>,
    native?: PopStateEvent
  ) => {
    lastEntry = { ...entry };
    const event: HistoryEvent<State> = { entry, direction, nativeEvent: native };
    listeners.forEach((listener) => listener(event));
  };

  const push = (entry: HistoryEntry<State>) => {
    const serializedState = serialize(entry.state);
    win.history.pushState(serializedState, entry.title ?? "", entry.url);
    if (!shouldEmit(entry)) {
      lastEntry = { ...entry };
      return;
    }
    notify("push", entry);
  };

  const replace = (entry: HistoryEntry<State>) => {
    const serializedState = serialize(entry.state);
    win.history.replaceState(serializedState, entry.title ?? "", entry.url);
    if (!shouldEmit(entry)) {
      lastEntry = { ...entry };
      return;
    }
    notify("replace", entry);
  };

  const handlePopState = (event: PopStateEvent) => {
    const entry = toEntry(win.location.href, event.state, win.document?.title);
    if (!shouldEmit(entry)) {
      lastEntry = { ...entry };
      return;
    }
    notify("pop", entry, event);
  };

  win.addEventListener("popstate", handlePopState);

  return {
    push,
    replace,
    go: (delta) => win.history.go(delta),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    destroy: () => {
      listeners.clear();
      win.removeEventListener("popstate", handlePopState);
    },
  };
}
