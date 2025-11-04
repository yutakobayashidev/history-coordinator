"use client";

import { useEffect } from "react";
import {
  createHistoryCoordinator,
  createHistoryRouter,
} from "@path-controller/core";
import { useState } from "react";

type ViewState = { type: "list" } | { type: "detail"; id: string };

const history = createHistoryCoordinator<ViewState>();

export default function RecordList() {
  const [overlayId, setOverlayId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = createHistoryRouter(history, [
      {
        test: (entry) => entry.state?.type === "detail",
        listener: ({ entry }) => {
          const id = entry.state?.type === "detail" ? entry.state.id : null;
          setOverlayId(id);
        },
      },
      {
        test: (entry) => entry.state?.type !== "detail",
        listener: () => setOverlayId(null),
      },
    ]);

    return unsubscribe;
  }, []);

  return (
    <div>
      <button
        onClick={() => {
          history.push({
            url: "/records/123",
            state: { type: "detail", id: "123" },
          });
        }}
      >
        詳細を開く
      </button>

      {overlayId && <div>Overlay {overlayId}</div>}
    </div>
  );
}
