import { SEOHead } from "@/components/SEOHead";
import { AgentConsole } from "@/components/agent/AgentConsole";

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <SEOHead
        title="Agent Console — AI-IDEI"
        description="Knowledge OS command interface. Orchestrate extraction pipelines, generate assets, and search your knowledge graph."
      />
      <AgentConsole />
    </div>
  );
}
