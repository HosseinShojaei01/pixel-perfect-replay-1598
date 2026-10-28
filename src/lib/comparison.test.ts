import { describe, expect, it, vi, afterEach } from "vitest";
import { apiBase, comparePortrait, comparisonSchema } from "./comparison";
afterEach(() => vi.unstubAllGlobals());
describe("real comparison boundaries", () => {
  it("rejects processing without consent before sending a photo", async () => {
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await expect(comparePortrait("https://service.example", "data:image/jpeg;base64,AA==", false, vi.fn(), new AbortController().signal)).rejects.toThrow("consent");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not silently use a backend when its URL is missing", () => { expect(() => apiBase("")).toThrow("not connected"); });
  it("rejects insecure remote photo transmission", () => { expect(() => apiBase("http://service.example")).toThrow("HTTPS"); });
  it("does not accept ancestry categories as visual comparisons", () => {
    expect(comparisonSchema.safeParse({ model: "test", reference_count: 1, elapsed_ms: 1, matches: [{ id: "1", category: "ethnicity", label: "test", cosine: .9 }] }).success).toBe(false);
  });
  it("does not fabricate a result when Python returns an error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ detail: "No reference images" }), { status: 409 })));
    await expect(comparePortrait("https://service.example", "data:image/jpeg;base64,AA==", true, vi.fn(), new AbortController().signal)).rejects.toThrow("No reference images");
  });
});