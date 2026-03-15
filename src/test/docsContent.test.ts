import { describe, it, expect } from "vitest";
import { DOCS_SECTIONS, TOPIC_CONTENT } from "@/pages/docs/docsContent";

describe("docsContent structure", () => {
  it("every section has at least one topic", () => {
    DOCS_SECTIONS.forEach(section => {
      expect(section.topics.length).toBeGreaterThan(0);
    });
  });

  it("every topic slug has matching content", () => {
    DOCS_SECTIONS.forEach(section => {
      const content = TOPIC_CONTENT[section.key];
      expect(content).toBeDefined();
      section.topics.forEach(topic => {
        expect(content[topic.slug]).toBeDefined();
        expect(content[topic.slug].title).toBeTruthy();
        expect(content[topic.slug].content.length).toBeGreaterThan(50);
      });
    });
  });

  it("section keys are unique", () => {
    const keys = DOCS_SECTIONS.map(s => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("topic slugs are unique within each section", () => {
    DOCS_SECTIONS.forEach(section => {
      const slugs = section.topics.map(t => t.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });
});
