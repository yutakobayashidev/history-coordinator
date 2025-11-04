export type HistoryDirection = "push" | "replace" | "pop";
export type HistoryMode = "push" | "replace";

export interface HistoryEntry<State = unknown> {
  url: string;
  title?: string;
  state?: State;
  scroll?: ScrollOptions | boolean;
}

export interface HistoryEvent<State = unknown> {
  entry: HistoryEntry<State>;
  direction: HistoryDirection;
  nativeEvent?: PopStateEvent;
}

export type HistoryListener<State = unknown> = (event: HistoryEvent<State>) => void;

export interface HistoryCoordinator<State = unknown> {
  push: (entry: HistoryEntry<State>) => void;
  replace: (entry: HistoryEntry<State>) => void;
  go: (delta: number) => void;
  subscribe: (listener: HistoryListener<State>) => () => void;
  destroy: () => void;
}

export interface HistoryCoordinatorOptions {
  window?: Window;
  emitOnSameUrl?: boolean;
  serializeState?: (state: unknown) => unknown;
  deserializeState?: (raw: unknown) => unknown;
}
