import { describe, expect, it } from "vitest";

import { matchPathParams } from "./path-params";

describe("matchPathParams", () => {
  it("matches single dynamic segment", () => {
    expect(matchPathParams("/posts/[id]", "/posts/123")).toEqual({ id: "123" });
  });

  it("ignores query strings", () => {
    expect(matchPathParams("/posts/[id]", "/posts/123?foo=bar")).toEqual({
      id: "123",
    });
  });

  it("matches nested dynamic segments", () => {
    expect(
      matchPathParams("/posts/[id]/comments/[commentId]", "/posts/123/comments/456")
    ).toEqual({ id: "123", commentId: "456" });
  });

  it("matches catch-all segments", () => {
    expect(matchPathParams("/docs/[...slug]", "/docs/a/b/c")).toEqual({
      slug: ["a", "b", "c"],
    });
  });

  it("matches optional catch-all with segments", () => {
    expect(matchPathParams("/docs/[[...slug]]", "/docs/a/b")).toEqual({
      slug: ["a", "b"],
    });
  });

  it("matches optional catch-all without segments", () => {
    expect(matchPathParams("/docs/[[...slug]]", "/docs")).toEqual({
      slug: undefined,
    });
  });

  it("returns null when segments are missing", () => {
    expect(matchPathParams("/posts/[id]", "/posts")).toBeNull();
  });

  it("returns null when segments remain", () => {
    expect(matchPathParams("/posts/[id]", "/posts/123/extra")).toBeNull();
  });

  it("matches the root path", () => {
    expect(matchPathParams("/", "/")).toEqual({});
  });
});
