/**
 * Agent Command Packs — Role-specific command sets for the Agent Console.
 * 30 commands organized across 10 profession-specific packs.
 */

export interface CommandPack {
  id: string;
  label: string;
  emoji: string;
  description: string;
  highlightedCommands: string[];
  quickPrompts: Array<{
    label: string;
    prompt: string;
  }>;
}

export const COMMAND_PACKS: CommandPack[] = [
  // ─── Pack 1: Podcaster ───
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
  // ─── Pack 2: Content Creator ───
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
  // ─── Pack 3: Consultant ───
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
  // ─── Pack 4: Marketer ───
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
  // ─── Pack 5: Researcher ───
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
  // ─── Pack 6: Educator ───
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
  // ─── Pack 7: Sales Professional ───
  {
    id: "sales",
    label: "Sales Pro",
    emoji: "🤝",
    description: "For sales teams — pitch decks, objection handling, case studies",
    highlightedCommands: ["/pitch", "/objections", "/case-study", "/compare", "/profile"],
    quickPrompts: [
      { label: "Build pitch deck", prompt: "Create a pitch deck from my extracted frameworks and case studies about" },
      { label: "Objection handlers", prompt: "Generate 15 objection-handling scripts from my persuasion neurons" },
      { label: "Case study generator", prompt: "Transform this client story into a structured case study with metrics" },
      { label: "Competitor battle card", prompt: "Build a competitive battle card using my differentiation neurons" },
      { label: "Sales email sequence", prompt: "Write a 7-email nurture sequence using my best persuasion frameworks" },
    ],
  },
  // ─── Pack 8: Author / Writer ───
  {
    id: "author",
    label: "Author",
    emoji: "📖",
    description: "For authors — book structuring, chapter outlines, manuscript building",
    highlightedCommands: ["/outline", "/chapter", "/extract", "/summarize", "/generate"],
    quickPrompts: [
      { label: "Book outline", prompt: "Create a 12-chapter book outline from all my extracted knowledge on" },
      { label: "Chapter draft", prompt: "Write a complete chapter using my neurons and frameworks about" },
      { label: "Extract narrative arcs", prompt: "Identify narrative structures and storytelling patterns in my content" },
      { label: "Argument builder", prompt: "Build a persuasive argument chain from my evidence neurons about" },
      { label: "Transform to manuscript", prompt: "Transform my extracted insights into a polished manuscript section on" },
    ],
  },
  // ─── Pack 9: Coach / Trainer ───
  {
    id: "coach",
    label: "Coach",
    emoji: "🏋️",
    description: "For coaches — client assessments, program design, transformation tracking",
    highlightedCommands: ["/assess", "/program", "/profile", "/track", "/generate"],
    quickPrompts: [
      { label: "Client assessment", prompt: "Generate a client assessment questionnaire from my coaching frameworks" },
      { label: "Program design", prompt: "Build a 12-week coaching program using my extracted methodologies on" },
      { label: "Transformation map", prompt: "Create a client transformation roadmap from my behavioral patterns about" },
      { label: "Workshop facilitation", prompt: "Design a 2-hour workshop with exercises from my content on" },
      { label: "Progress tracker", prompt: "Build a progress tracking template using my measurement frameworks" },
    ],
  },
  // ─── Pack 10: Agency Owner ───
  {
    id: "agency",
    label: "Agency Owner",
    emoji: "🏢",
    description: "For agencies — SOPs, client deliverables, white-label content",
    highlightedCommands: ["/sop", "/deliverable", "/white-label", "/report", "/funnel"],
    quickPrompts: [
      { label: "Generate SOP", prompt: "Create a detailed SOP document from my process neurons about" },
      { label: "Client report template", prompt: "Build a professional client report template using my analytics frameworks" },
      { label: "White-label content pack", prompt: "Generate a white-label content pack (10 articles + 30 social posts) on" },
      { label: "Service productization", prompt: "Transform my methodology into a productized service offering for" },
      { label: "Onboarding sequence", prompt: "Create a client onboarding sequence using my best practices about" },
    ],
  },
];

export function getCommandPack(packId: string): CommandPack | undefined {
  return COMMAND_PACKS.find(p => p.id === packId);
}

export function getDefaultPack(): CommandPack {
  return COMMAND_PACKS[0];
}

/** Get packs relevant to a user's role/tier */
export function getPacksForTier(tier: "free" | "authenticated" | "pro" | "vip"): CommandPack[] {
  // Free: first 3, authenticated: first 6, pro/vip: all
  if (tier === "free") return COMMAND_PACKS.slice(0, 3);
  if (tier === "authenticated") return COMMAND_PACKS.slice(0, 6);
  return COMMAND_PACKS;
}
