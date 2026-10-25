import { describe, expect, it } from "vitest";
import { normalize, parseFile, total, validate, newEntry } from "./ancestry";

describe("ancestry rules", () => {
  it("empty genetic results do not acquire ancestry percentages", () => {
    expect(total([])).toBe(0);
    expect(validate([])).toContain("Add at least one region.");
  });
  it("flags totals that are not 100%", () => {
    expect(validate([newEntry("Iran", 50), newEntry("Italy", 30)]).join()).toContain("80%");
  });
  it("normalizes to exactly 100", () => {
    expect(total(normalize([newEntry("A", 1), newEntry("B", 1), newEntry("C", 1)]))).toBe(100);
  });
  it("parses CSV with header", () => {
    const r = parseFile("x.csv", "region,percent\nIran,60%\nItaly,40");
    expect(r.map((e) => [e.region, e.percent])).toEqual([["Iran", 60], ["Italy", 40]]);
  });
});
