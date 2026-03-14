import { SEOHead } from "@/components/SEOHead";
import { PlatformChat } from "@/components/chat/PlatformChat";

export default function ChatPage() {
  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)]">
      <SEOHead
        title="AI Assistant — AI-IDEI"
        description="Chat with the AI-IDEI assistant to extract knowledge, run services, and navigate the platform."
      />
      <PlatformChat />
    </div>
  );
}
