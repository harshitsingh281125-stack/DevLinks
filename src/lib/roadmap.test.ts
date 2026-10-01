import { describe, expect, it } from "vitest";
import { moveItem, sortByPosition } from "./roadmap";

describe("sortByPosition", () => {
  it("orders by position, then by save date", () => {
    const items = [
      { id: "c", position: 2, createdAt: "2026-01-03" },
      { id: "a", position: 1, createdAt: "2026-01-05" },
      { id: "b", position: 2, createdAt: "2026-01-01" },
    ];
    expect(sortByPosition(items).map((i) => i.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate its input", () => {
    const items = [
      { position: 2, createdAt: "x" },
      { position: 1, createdAt: "x" },
    ];
    sortByPosition(items);
    expect(items[0].position).toBe(2);
  });
});

describe("moveItem", () => {
  const list = ["a", "b", "c", "d"];

  it("moves forward and backward", () => {
    expect(moveItem(list, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(list, 3, 0)).toEqual(["d", "a", "b", "c"]);
  });

  it("clamps the target and ignores out-of-range sources", () => {
    expect(moveItem(list, 1, 99)).toEqual(["a", "c", "d", "b"]);
    expect(moveItem(list, 2, -5)).toEqual(["c", "a", "b", "d"]);
    expect(moveItem(list, 7, 0)).toEqual(list);
  });

  it("returns a new array", () => {
    expect(moveItem(list, 1, 1)).not.toBe(list);
  });
});
