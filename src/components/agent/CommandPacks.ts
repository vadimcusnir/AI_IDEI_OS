/**
 * Agent Command Packs — Role-specific command sets for the Agent Console.
 * Each pack surfaces the most relevant commands for a specific profession/use case.
 */

export interface CommandPack {
  id: string;
  label: string;
  emoji: string;
  description: string;
  /** Slash command prefixes this pack highlights */
  highlightedCommands: string[];
  /** Quick prompts specific to this role */
  quickPrompts: Array<{
    label: string;
    prompt: string;
  }>;
}

export const COMMAND_PACKS: CommandPack[] = [
  {
    id: "podcaster",
    label: "Podcaster",
    emoji: "🎙️",
    description: "Optimized for podcast hosts — transcription, guest analysis, episode insights",
    highlightedCommands: ["/transcribe", "/analyze", "/extract", "/profile", "/summarize"],
    quickPrompts: [
      { label: "Transcribe latest episode", prompt: "Transcribe my latest podcast episode from URL" },
      { label: "Extract guest insights", prompt: "Extract key insights and frameworks from my guest's interview" },
      { label: "Generate show notes", prompt: "Generate professional show notes with timestamps and key takeaways" },
      { label: "Analyze guest profile", prompt: "Build a comprehensive psychological and expertise profile of my guest" },
      { label: "Create social clips", prompt: "Generate 10 social media posts from the best quotes in this episode" },
    ],
  },
  {
    id: "creator",
    label: "Content Creator",
    emoji: "✍️",
    description: "For content creators — article generation, social posts, course building",
    highlightedCommands: ["/article", "/social", "/course", "/generate", "/copy"],
    quickPrompts: [
      { label: "Write article from neurons", prompt: "Write a 1500-word article using my top neurons about" },
      { label: "Social media batch", prompt: "Generate 20 social media posts from my latest content" },
      { label: "Create mini-course", prompt: "Build a 5-module course from my knowledge on" },
      { label: "Content calendar", prompt: "Create a 30-day content calendar from my extracted insights" },
      { label: "Newsletter draft", prompt: "Draft a newsletter combining my top 5 recent neurons" },
    ],
  },
  {
    id: "consultant",
    label: "Consultant",
    emoji: "💼",
    description: "For consultants — frameworks, proposals, competitive analysis",
    highlightedCommands: ["/extract", "/compare", "/relate", "/funnel", "/brand"],
    quickPrompts: [
      { label: "Extract frameworks", prompt: "Extract all decision frameworks and methodologies from this transcript" },
      { label: "Build proposal", prompt: "Generate a consulting proposal based on my extracted expertise in" },
      { label: "Competitive analysis", prompt: "Compare and contrast the approaches discussed across my episodes on" },
      { label: "Find contradictions", prompt: "Identify contradicting viewpoints in my knowledge base about" },
      { label: "Client workshop", prompt: "Create a workshop outline using my frameworks on" },
    ],
  },
  {
    id: "marketer",
    label: "Marketer",
    emoji: "📊",
    description: "For marketers — funnels, copywriting, brand analysis, campaigns",
    highlightedCommands: ["/funnel", "/copy", "/brand", "/social", "/webinar"],
    quickPrompts: [
      { label: "Build marketing funnel", prompt: "Design a complete marketing funnel from my content about" },
      { label: "Generate copy variants", prompt: "Create 10 headline variants and 5 ad copy versions for" },
      { label: "Webinar from neurons", prompt: "Build a webinar presentation from my extracted knowledge on" },
      { label: "Brand voice analysis", prompt: "Analyze my brand voice patterns from all my transcripts" },
      { label: "Lead magnet", prompt: "Create a lead magnet (checklist + framework) from my insights about" },
    ],
  },
  {
    id: "researcher",
    label: "Researcher",
    emoji: "🔬",
    description: "For researchers — knowledge graph exploration, pattern detection, synthesis",
    highlightedCommands: ["/search", "/topics", "/relate", "/contradictions", "/compare"],
    quickPrompts: [
      { label: "Map knowledge graph", prompt: "Show me the full topic map of connections in my knowledge base" },
      { label: "Find patterns", prompt: "Identify recurring patterns across all my extracted neurons about" },
      { label: "Synthesize findings", prompt: "Create a research synthesis from neurons across multiple episodes on" },
      { label: "Gap analysis", prompt: "What topics are underrepresented in my knowledge graph?" },
      { label: "Citation network", prompt: "Show how concepts reference each other in my knowledge base" },
    ],
  },
  {
    id: "educator",
    label: "Educator",
    emoji: "🎓",
    description: "For educators — course building, curriculum design, knowledge structuring",
    highlightedCommands: ["/course", "/summarize", "/extract", "/topics", "/generate"],
    quickPrompts: [
      { label: "Design curriculum", prompt: "Build a comprehensive curriculum from my expertise in" },
      { label: "Create lesson plans", prompt: "Generate 10 lesson plans from my extracted frameworks on" },
      { label: "Student exercises", prompt: "Create practical exercises and quizzes from my content about" },
      { label: "Knowledge summary", prompt: "Create a structured executive summary of all my knowledge on" },
      { label: "Assessment rubric", prompt: "Build an assessment framework from the key concepts in" },
    ],
  },
];

export function getCommandPack(packId: string): CommandPack | undefined {
  return COMMAND_PACKS.find(p => p.id === packId);
}

export function getDefaultPack(): CommandPack {
  return COMMAND_PACKS[0];
}
