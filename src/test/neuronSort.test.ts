import { describe, it, expect } from "vitest";

// Extract pure sorting/grouping logic from useNeuronList for testing
interface TestNeuron {
  id: number;
  number: number;
  title: string;
  status: string;
  updated_at: string;
  created_at: string;
  score: number;
}

type SortField = "updated_at" | "created_at" | "title" | "number" | "score";
type SortDir = "asc" | "desc";

function sortNeurons(
  list: TestNeuron[],
  sortField: SortField,
  sortDir: SortDir,
  pinnedIds: Set<number> = new Set()
): TestNeuron[] {
  return [...list].sort((a, b) => {
    const aPinned = pinnedIds.has(a.id) ? 1 : 0;
    const bPinned = pinnedIds.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;

    let cmp = 0;
    if (sortField === "title") cmp = a.title.localeCompare(b.title);
    else if (sortField === "number") cmp = a.number - b.number;
    else if (sortField === "score") cmp = a.score - b.score;
    else if (sortField === "created_at") cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    return sortDir === "desc" ? -cmp : cmp;
  });
}

function groupByStatus(list: TestNeuron[]) {
  const groups: Record<string, TestNeuron[]> = {};
  list.forEach(n => {
    if (!groups[n.status]) groups[n.status] = [];
    groups[n.status].push(n);
  });
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

const NEURONS: TestNeuron[] = [
  { id: 1, number: 10, title: "Zeta Framework", status: "draft", updated_at: "2026-03-10T00:00:00Z", created_at: "2026-03-01T00:00:00Z", score: 80 },
  { id: 2, number: 5, title: "Alpha Pattern", status: "published", updated_at: "2026-03-15T00:00:00Z", created_at: "2026-03-05T00:00:00Z", score: 95 },
  { id: 3, number: 20, title: "Beta Insight", status: "draft", updated_at: "2026-03-12T00:00:00Z", created_at: "2026-03-08T00:00:00Z", score: 60 },
];

describe("neuron sorting", () => {
  it("sorts by title ascending", () => {
    const sorted = sortNeurons(NEURONS, "title", "asc");
    expect(sorted.map(n => n.title)).toEqual(["Alpha Pattern", "Beta Insight", "Zeta Framework"]);
  });

  it("sorts by title descending", () => {
    const sorted = sortNeurons(NEURONS, "title", "desc");
    expect(sorted.map(n => n.title)).toEqual(["Zeta Framework", "Beta Insight", "Alpha Pattern"]);
  });

  it("sorts by score descending", () => {
    const sorted = sortNeurons(NEURONS, "score", "desc");
    expect(sorted.map(n => n.score)).toEqual([95, 80, 60]);
  });

  it("sorts by number ascending", () => {
    const sorted = sortNeurons(NEURONS, "number", "asc");
    expect(sorted.map(n => n.number)).toEqual([5, 10, 20]);
  });

  it("pinned items come first regardless of sort", () => {
    const sorted = sortNeurons(NEURONS, "title", "asc", new Set([3]));
    expect(sorted[0].id).toBe(3);
  });

  it("sorts by updated_at descending (most recent first)", () => {
    const sorted = sortNeurons(NEURONS, "updated_at", "desc");
    expect(sorted.map(n => n.id)).toEqual([2, 3, 1]);
  });
});

describe("neuron grouping", () => {
  it("groups by status", () => {
    const groups = groupByStatus(NEURONS);
    expect(groups.length).toBe(2);
    const draftGroup = groups.find(g => g.label === "draft");
    expect(draftGroup?.items.length).toBe(2);
    const pubGroup = groups.find(g => g.label === "published");
    expect(pubGroup?.items.length).toBe(1);
  });

  it("handles empty list", () => {
    const groups = groupByStatus([]);
    expect(groups.length).toBe(0);
  });
});
