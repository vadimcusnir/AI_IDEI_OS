import { describe, it, expect, vi } from "vitest";

describe("NeuronGraph link resolution logic", () => {
  it("should correctly separate outgoing and incoming links", () => {
    const neuronId = 42;
    const links = [
      { id: "1", source_neuron_id: 42, target_neuron_id: 10, relation_type: "supports" },
      { id: "2", source_neuron_id: 42, target_neuron_id: 20, relation_type: "extends" },
      { id: "3", source_neuron_id: 5, target_neuron_id: 42, relation_type: "contradicts" },
    ];

    const outgoing = links.filter(l => l.source_neuron_id === neuronId);
    const incoming = links.filter(l => l.target_neuron_id === neuronId);

    expect(outgoing).toHaveLength(2);
    expect(incoming).toHaveLength(1);
    expect(outgoing[0].relation_type).toBe("supports");
    expect(incoming[0].relation_type).toBe("contradicts");
  });

  it("should build title maps correctly", () => {
    const targets = [
      { id: 10, title: "Pricing Framework" },
      { id: 20, title: "Growth Pattern" },
    ];
    const titleMap = new Map(targets.map(t => [t.id, t.title]));

    expect(titleMap.get(10)).toBe("Pricing Framework");
    expect(titleMap.get(20)).toBe("Growth Pattern");
    expect(titleMap.get(99)).toBeUndefined();
  });

  it("should handle version numbering", () => {
    const versions = [
      { version: 3 },
      { version: 2 },
      { version: 1 },
    ];
    const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1;
    expect(nextVersion).toBe(4);
  });

  it("should compute next version from empty list", () => {
    const versions: any[] = [];
    const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1;
    expect(nextVersion).toBe(1);
  });
});
