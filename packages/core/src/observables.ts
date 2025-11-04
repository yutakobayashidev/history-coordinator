import { HistoryCoordinator, HistoryEntry, HistoryListener } from "./types";

export interface HistoryMatch<State> {
  test: (entry: HistoryEntry<State>) => boolean;
  listener: HistoryListener<State>;
}

export function createHistoryRouter<State>(
  coordinator: HistoryCoordinator<State>,
  routes: HistoryMatch<State>[]
) {
  const unsubscribe = coordinator.subscribe((event) => {
    routes.forEach((route) => {
      if (route.test(event.entry)) {
        route.listener(event);
      }
    });
  });

  return () => unsubscribe();
}
