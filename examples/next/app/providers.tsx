"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HistoryProvider } from "@path-controller/core";
import { ReactNode, useState } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <HistoryProvider>{children}</HistoryProvider>
    </QueryClientProvider>
  );
}
