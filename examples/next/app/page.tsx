"use client";

import { useEffect } from "react";
import { createHistoryCoordinator } from "@path-controller/core";
import { useState } from "react";

type ViewState = { type: "list" } | { type: "detail"; id: string };

const history = createHistoryCoordinator<ViewState>();

export default function RecordList() {
  const [overlayId, setOverlayId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = history.subscribe(({ entry }) => {
      if (entry.state?.type === "detail") {
        setOverlayId(entry.state.id);
      } else {
        setOverlayId(null);
      }
    });
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
