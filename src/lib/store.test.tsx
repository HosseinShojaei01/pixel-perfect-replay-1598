import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProvider, useApp } from "./store";

function Connection() {
  const { apiUrl } = useApp();
  return <output data-testid="api-url">{apiUrl}</output>;
}

beforeEach(() => localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

describe("live frontend connection", () => {
  it("defaults new visitors to the live Render API without an environment override", () => {
    vi.stubEnv("VITE_PYTHON_API_URL", "");
    render(<AppProvider><Connection /></AppProvider>);
    expect(screen.getByTestId("api-url").textContent).toBe("https://origindna-comparison.onrender.com");
  });

  it("preserves an existing visitor's explicitly saved connection", async () => {
    localStorage.setItem("odna-api-url", "https://existing.example");
    render(<AppProvider><Connection /></AppProvider>);
    await waitFor(() => expect(screen.getByTestId("api-url").textContent).toBe("https://existing.example"));
  });
});