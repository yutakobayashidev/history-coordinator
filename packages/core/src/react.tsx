import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  DependencyList,
  FC,
} from "react";

import { createHistoryCoordinator } from "./controller";
import { matchPathParams } from "./path-params";
import { HistoryCoordinator, HistoryListener, PathParams } from "./types";

export const HistoryContext = createContext<HistoryCoordinator<any> | null>(
  null
);

export const HistoryProvider: FC<{
  coordinator?: HistoryCoordinator<any>;
  children: ReactNode;
}> = ({ coordinator, children }) => {
  const ref = useRef<HistoryCoordinator<any> | null>(coordinator ?? null);

  if (!ref.current) {
    ref.current = createHistoryCoordinator();
  }

  useEffect(() => () => ref.current?.destroy(), []);

  return (
    <HistoryContext.Provider value={ref.current}>
      {children}
    </HistoryContext.Provider>
  );
};

export function useHistory<State = unknown>() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error("HistoryProviderが必要です");
  return ctx as HistoryCoordinator<State>;
}

export function useHistorySubscription<State = unknown>(
  listener: HistoryListener<State>,
  deps: DependencyList = []
) {
  const history = useHistory<State>();
  useEffect(() => history.subscribe(listener), [history, ...deps]);
}

const getCurrentPathname = () =>
  typeof window === "undefined" ? null : window.location.pathname;

export function usePathParams<Pattern extends string>(
  pattern: Pattern
): PathParams<Pattern> | null {
  const compute = useCallback(() => {
    const pathname = getCurrentPathname();
    if (pathname == null) return null;
    const match = matchPathParams(pattern, pathname);
    return (match ?? null) as PathParams<Pattern> | null;
  }, [pattern]);

  const [params, setParams] = useState<PathParams<Pattern> | null>(compute);

  useEffect(() => {
    setParams(compute());
  }, [compute]);

  useHistorySubscription(() => {
    setParams(compute());
  }, [compute]);

  return params;
}
