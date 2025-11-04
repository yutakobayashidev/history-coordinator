import {
  createContext,
  useContext,
  useEffect,
  useRef,
  ReactNode,
  DependencyList,
  FC,
} from "react";

import { createHistoryCoordinator } from "./controller";
import { HistoryCoordinator, HistoryListener } from "./types";

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
