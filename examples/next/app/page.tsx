"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HistoryEntry, useHistory, usePathParams } from "@path-controller/core";
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

const POSTS_ENDPOINT = "https://jsonplaceholder.typicode.com/posts";

const fetchPosts = async (): Promise<Post[]> => {
  const res = await fetch(`${POSTS_ENDPOINT}?_limit=10`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load posts");
  return res.json();
};

const fetchPostDetail = async (id: number): Promise<Post> => {
  const res = await fetch(`${POSTS_ENDPOINT}/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load post detail");
  return res.json();
};

export default function RecordList() {
  const history = useHistory<ViewState>();
  const queryClient = useQueryClient();
  const params = usePathParams("/posts/[id]");

  const selectedId = useMemo(() => {
    const id = params?.id;
    if (!id) return null;
    const parsed = Number(id);
    return Number.isNaN(parsed) ? null : parsed;
  }, [params]);

  const postsQuery = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const detailQuery = useQuery({
    queryKey: ["post", selectedId],
    queryFn: () => fetchPostDetail(selectedId!),
    enabled: selectedId != null,
    staleTime: 1000 * 30,
  });

  const handleSelect = useCallback(
    (entry: HistoryEntry<ViewState>) => {
      history.push(entry);
    },
    [history]
  );

  const handleHover = useCallback(
    (id: number) => {
      queryClient.prefetchQuery({
        queryKey: ["post", id],
        queryFn: () => fetchPostDetail(id),
        staleTime: 1000 * 30,
      });
    },
    [queryClient]
  );

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        history.back();
      }
      // open === true のときは何もしない（選択時 push が既に走っているため）
    },
    [history]
  );

  const posts = postsQuery.data ?? [];
  const selectedPost = detailQuery.data;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-bold mb-2">Posts</h2>
      {postsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading posts…</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((post) => (
            <li key={post.id}>
              <button
                className="block w-full text-left p-3 border rounded hover:bg-muted"
                onClick={() =>
                  handleSelect({
                    url: `/posts/${post.id}`,
                    state: { type: "detail", id: post.id },
                  })
                }
                onMouseEnter={() => handleHover(post.id)}
              >
                <div className="font-semibold">{post.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {post.body}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet
        modal={false}
        open={selectedId != null}
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent
          onInteractOutside={(e) => {
            // 投稿リストクリックで閉じるのを防ぐ
            e.preventDefault();
          }}
          key={selectedId}
          side="right"
          className="w-[400px]"
        >
          <SheetHeader>
            <SheetTitle>
              {detailQuery.isPending
                ? "Loading…"
                : selectedPost?.title ?? "Post not found"}
            </SheetTitle>
            <SheetDescription>
              {selectedId != null ? `ID: ${selectedId}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="p-4 text-sm whitespace-pre-line">
            {detailQuery.isPending
              ? "Loading post…"
              : selectedPost?.body ?? "No content available."}
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
