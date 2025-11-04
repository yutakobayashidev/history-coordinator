"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createHistoryCoordinator,
  createHistoryRouter,
} from "@path-controller/core";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type Post = {
  id: number;
  title: string;
  body: string;
};

type ViewState = { type: "detail"; id: number };

const history = createHistoryCoordinator<ViewState>();

export default function RecordList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [overlayId, setOverlayId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    fetch("https://jsonplaceholder.typicode.com/posts?_limit=10")
      .then((res) => res.json())
      .then(setPosts);
  }, []);

  useEffect(() => {
    const unsubscribe = createHistoryRouter(history, [
      {
        test: (entry) => entry.state?.type === "detail",
        listener: async ({ entry }) => {
          if (entry.state?.type === "detail" && entry.state?.id) {
            setOverlayId(entry.state.id);
            setSheetOpen(true);
            const res = await fetch(
              `https://jsonplaceholder.typicode.com/posts/${entry.state.id}`
            );
            const data = await res.json();
            setSelectedPost(data);
          }
        },
      },
      {
        test: (entry) => entry.state?.type !== "detail",
        listener: () => {
          setOverlayId(null);
          setSheetOpen(false);
          setSelectedPost(null);
        },
      },
    ]);
    return unsubscribe;
  }, []);

  // Sheet を閉じたときに履歴を戻す
  const handleSheetOpenChange = useCallback((open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      history.back();
    }
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold mb-2">Posts</h2>
      <ul className="space-y-2">
        {posts.map((post) => (
          <li key={post.id}>
            <button
              className="block w-full text-left p-3 border rounded hover:bg-muted"
              onClick={() =>
                history.push({
                  url: `/posts/${post.id}`,
                  state: { type: "detail", id: post.id },
                })
              }
            >
              <div className="font-semibold">{post.title}</div>
              <div className="text-sm text-muted-foreground truncate">
                {post.body}
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Sheet
        modal={false}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent side="right" className="w-[400px]">
          <SheetHeader>
            <SheetTitle>{selectedPost?.title ?? "Loading..."}</SheetTitle>
            <SheetDescription>ID: {overlayId}</SheetDescription>
          </SheetHeader>
          <div className="p-4 text-sm whitespace-pre-line">
            {selectedPost?.body ?? "Loading post..."}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <button className="mt-2 border rounded px-3 py-1">Close</button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
