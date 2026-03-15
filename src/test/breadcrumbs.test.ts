import { describe, it, expect } from "vitest";

// Pure breadcrumb logic extracted from AppBreadcrumbs
const ROUTE_LABELS: Record<string, string> = {
  home: "Cockpit", neurons: "Neurons", n: "Neuron",
  extractor: "Extractor", services: "Services", jobs: "Jobs",
  credits: "Credits", dashboard: "Dashboard", library: "Library",
  intelligence: "Intelligence", docs: "Docs", entities: "Entities",
  topics: "Topics", marketplace: "Marketplace",
};

function buildCrumbs(pathname: string) {
  if (pathname === "/home" || pathname === "/") return null;
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  return segments.map((seg, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    const label = ROUTE_LABELS[seg] || decodeURIComponent(seg).replace(/-/g, " ");
    const isLast = i === segments.length - 1;
    const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
    return { path, label: displayLabel, isLast };
  });
}

describe("breadcrumb logic", () => {
  it("returns null for /home", () => {
    expect(buildCrumbs("/home")).toBeNull();
  });

  it("returns null for /", () => {
    expect(buildCrumbs("/")).toBeNull();
  });

  it("builds single-level crumb", () => {
    const crumbs = buildCrumbs("/neurons");
    expect(crumbs).toHaveLength(1);
    expect(crumbs![0]).toEqual({ path: "/neurons", label: "Neurons", isLast: true });
  });

  it("builds multi-level crumbs", () => {
    const crumbs = buildCrumbs("/n/42");
    expect(crumbs).toHaveLength(2);
    expect(crumbs![0]).toEqual({ path: "/n", label: "Neuron", isLast: false });
    expect(crumbs![1]).toEqual({ path: "/n/42", label: "42", isLast: true });
  });

  it("capitalizes unknown segments", () => {
    const crumbs = buildCrumbs("/some-page");
    expect(crumbs![0].label).toBe("Some page");
  });

  it("handles deep nesting", () => {
    const crumbs = buildCrumbs("/docs/getting-started/introduction");
    expect(crumbs).toHaveLength(3);
    expect(crumbs![0].isLast).toBe(false);
    expect(crumbs![2].isLast).toBe(true);
  });
});
