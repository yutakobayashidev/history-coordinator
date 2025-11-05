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
  back: () => void;
  subscribe: (listener: HistoryListener<State>) => () => void;
  destroy: () => void;
}

export interface HistoryCoordinatorOptions {
  window?: Window;
  emitOnSameUrl?: boolean;
  serializeState?: (state: unknown) => unknown;
  deserializeState?: (raw: unknown) => unknown;
}

type AppendSegment<Segment extends string, Acc extends string[]> = Segment extends ""
  ? Acc
  : [...Acc, Segment];

type SplitPath<Pattern extends string, Acc extends string[] = []> =
  Pattern extends ""
    ? Acc
    : Pattern extends `/${infer Rest}`
    ? SplitPath<Rest, Acc>
    : Pattern extends `${infer Segment}/${infer Rest}`
    ? SplitPath<Rest, AppendSegment<Segment, Acc>>
    : AppendSegment<Pattern, Acc>;

type SegmentParam<Segment extends string> = Segment extends `[[...${infer Param}]]`
  ? { [K in Param]?: string[] }
  : Segment extends `[...${infer Param}]`
  ? { [K in Param]: string[] }
  : Segment extends `[${infer Param}]`
  ? { [K in Param]: string }
  : {};

type PathParamsFromSegments<Segments extends string[]> = Segments extends [
  infer Head extends string,
  ...infer Tail extends string[]
]
  ? SegmentParam<Head> & PathParamsFromSegments<Tail>
  : {};

export type PathParams<Pattern extends string> = string extends Pattern
  ? Record<string, string | string[] | undefined>
  : PathParamsFromSegments<SplitPath<Pattern>>;
