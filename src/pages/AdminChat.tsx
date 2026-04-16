import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Plus, Send, Users, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ADVISOR_EXPERTS, getExpert } from "@/lib/advisorExperts";

interface Conversation { id: string; title: string; active_experts: string[]; updated_at: string; }
interface Message { id: string; role: string; expert_key: string | null; content: string; created_at: string; }

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedExperts, setSelectedExperts] = useState<string[]>(["cfo"]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from("advisor_conversations")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setConversations(data || []);
    if (!activeId && data && data.length > 0) {
      setActiveId(data[0].id);
      setSelectedExperts(data[0].active_experts || ["cfo"]);
    }
  };

  const loadMessages = async (convId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("advisor_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setMessages(data || []);
  };

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const newConversation = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("advisor_conversations")
      .insert({ user_id: user.id, title: "Conversație nouă", active_experts: selectedExperts })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    setConversations(prev => [data, ...prev]);
    setActiveId(data.id);
    setMessages([]);
  };

  const deleteConv = async (id: string) => {
    if (!confirm("Șterge conversația?")) return;
    const { error } = await supabase.from("advisor_conversations").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  };

  const toggleExpert = (key: string) => {
    setSelectedExperts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const send = async () => {
    if (!input.trim() || selectedExperts.length === 0) return;

    let convId = activeId;
    if (!convId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("advisor_conversations")
        .insert({ user_id: user.id, title: input.slice(0, 60), active_experts: selectedExperts })
        .select()
        .single();
      if (error) { toast.error(error.message); return; }
      convId = data.id;
      setActiveId(convId);
      setConversations(prev => [data, ...prev]);
    } else {
      // Update title if first message + active experts
      if (messages.length === 0) {
        await supabase.from("advisor_conversations")
          .update({ title: input.slice(0, 60), active_experts: selectedExperts })
          .eq("id", convId);
      } else {
        await supabase.from("advisor_conversations")
          .update({ active_experts: selectedExperts })
          .eq("id", convId);
      }
    }

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { id: `tmp-${Date.now()}`, role: "user", expert_key: null, content: userMsg, created_at: new Date().toISOString() }]);
    setStreaming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-council`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ conversationId: convId, userMessage: userMsg, expertKeys: selectedExperts }),
      });

      if (!resp.ok || !resp.body) {
        const errBody = await resp.text();
        throw new Error(errBody || "Stream failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const expertBuffers: Record<string, string> = {};
      const expertMsgIds: Record<string, string> = {};

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          try {
            const evt = JSON.parse(line.slice(6).trim());

            if (evt.type === "expert_start") {
              const tmpId = `stream-${evt.expert_key}-${Date.now()}`;
              expertMsgIds[evt.expert_key] = tmpId;
              expertBuffers[evt.expert_key] = "";
              setMessages(prev => [...prev, {
                id: tmpId, role: "assistant", expert_key: evt.expert_key,
                content: "", created_at: new Date().toISOString(),
              }]);
            } else if (evt.type === "delta") {
              expertBuffers[evt.expert_key] = (expertBuffers[evt.expert_key] || "") + evt.delta;
              const tmpId = expertMsgIds[evt.expert_key];
              const text = expertBuffers[evt.expert_key];
              setMessages(prev => prev.map(m => m.id === tmpId ? { ...m, content: text } : m));
            } else if (evt.type === "error") {
              toast.error(`${evt.expert_key}: ${evt.error}`);
            } else if (evt.type === "done") {
              // reload from DB to get real ids
              if (convId) loadMessages(convId);
            }
          } catch { /* partial */ }
        }
      }
    } catch (e: any) {
      toast.error("Send failed: " + e.message);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-full">
        {/* Sidebar */}
        <Card className="p-3 flex flex-col gap-3 overflow-hidden">
          <Button onClick={newConversation} size="sm" className="w-full">
            <Plus className="h-4 w-4 mr-2" /> Conversație nouă
          </Button>
          <Separator />
          <ScrollArea className="flex-1">
            <div className="space-y-1 pr-2">
              {conversations.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nicio conversație încă.</p>
              )}
              {conversations.map(c => (
                <div
                  key={c.id}
                  className={`group flex items-start gap-2 p-2 rounded-md cursor-pointer text-sm transition ${activeId === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}
                  onClick={() => { setActiveId(c.id); setSelectedExperts(c.active_experts || ["cfo"]); }}
                >
                  <MessageSquare className="h-3 w-3 mt-1 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteConv(c.id); }}
                    className="opacity-0 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat */}
        <Card className="flex flex-col overflow-hidden">
          {/* Expert picker */}
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium">Council ({selectedExperts.length} {selectedExperts.length === 1 ? "expert" : "experți"})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ADVISOR_EXPERTS.map(e => (
                <button
                  key={e.key}
                  onClick={() => toggleExpert(e.key)}
                  disabled={streaming}
                  className={`text-xs px-2.5 py-1 rounded-full border transition ${selectedExperts.includes(e.key) ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted border-border"}`}
                >
                  <span className="mr-1">{e.emoji}</span>{e.name}
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef as any}>
            <div className="p-4 space-y-4">
              {loading && <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />}
              {!loading && messages.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Selectează experții și pune o întrebare.</p>
                  <p className="text-xs mt-1">Ex: "Cum stă platforma financiar și operațional?"</p>
                </div>
              )}
              {messages.map(m => {
                if (m.role === "user") {
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%] text-sm">
                        {m.content}
                      </div>
                    </div>
                  );
                }
                const expert = m.expert_key ? getExpert(m.expert_key) : null;
                return (
                  <div key={m.id} className="flex gap-3">
                    <div className="text-2xl flex-shrink-0">{expert?.emoji || "🤖"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold ${expert?.color || ""}`}>{expert?.name || "Assistant"}</span>
                        {expert && <Badge variant="outline" className="text-[10px] py-0 h-4">{expert.role}</Badge>}
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/40 rounded-lg p-3 border">
                        {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={selectedExperts.length === 0 ? "Selectează cel puțin un expert..." : "Pune întrebarea... (Enter pentru trimitere, Shift+Enter pentru rând nou)"}
                rows={2}
                disabled={streaming || selectedExperts.length === 0}
                className="resize-none"
              />
              <Button onClick={send} disabled={streaming || !input.trim() || selectedExperts.length === 0} size="icon" className="h-auto">
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
