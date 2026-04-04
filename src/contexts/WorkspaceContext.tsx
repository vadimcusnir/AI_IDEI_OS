import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  avatar_url: string | null;
  description: string | null;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  display_name?: string;
  email?: string;
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  members: WorkspaceMember[];
  loading: boolean;
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => Promise<Workspace | null>;
  updateWorkspace: (id: string, updates: Partial<Pick<Workspace, "name" | "description" | "avatar_url">>) => Promise<boolean>;
  deleteWorkspace: (id: string) => Promise<boolean>;
  inviteMember: (email: string, role: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  updateMemberRole: (memberId: string, role: string) => Promise<boolean>;
  currentRole: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const WS_STORAGE_KEY = "ai-idei-workspace-id";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "workspace";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  // Load workspaces
  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      // Fetch only workspaces where the user is a member (covers owner too)
      const { data: memberRows } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", user.id);

      const memberWsIds = (memberRows || []).map((r: any) => r.workspace_id);

      // Also fetch owned workspaces (in case membership row is missing)
      const { data: ownedRows } = await supabase
        .from("workspaces")
        .select("id")
        .eq("owner_id", user.id);

      const ownedIds = (ownedRows || []).map((r: any) => r.id);
      const allIds = [...new Set([...memberWsIds, ...ownedIds])];

      let data: any[] = [];
      if (allIds.length > 0) {
        const { data: wsData } = await supabase
          .from("workspaces")
          .select("*")
          .in("id", allIds)
          .order("created_at");
        data = wsData || [];
      }

      let ws = (data || []) as Workspace[];

      // Auto-create workspace if none exist (trigger may have failed)
      // Uses upsert-like approach: unique index on owner_id prevents duplicates
      if (ws.length === 0 && user) {
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "My";
        const slug = `${user.id.slice(0, 8)}-${Date.now().toString(36)}`;
        const { data: created, error: createErr } = await supabase
          .from("workspaces")
          .insert({ name: `${name}'s Workspace`, slug, owner_id: user.id })
          .select()
          .single();

        if (createErr) {
          // Race condition: another tab/trigger already created it — re-fetch
          const { data: refetch } = await supabase
            .from("workspaces")
            .select("*")
            .order("created_at");
          ws = (refetch || []) as Workspace[];
        } else if (created) {
          const newWs = created as Workspace;
          await supabase
            .from("workspace_members")
            .insert({ workspace_id: newWs.id, user_id: user.id, role: "owner" as any });
          ws = [newWs];
        }
      }

      setWorkspaces(ws);

      // Restore or pick first
      const savedId = localStorage.getItem(WS_STORAGE_KEY);
      const saved = ws.find((w) => w.id === savedId);
      setCurrentWorkspace(saved || ws[0] || null);
      setLoading(false);
    };

    load();
  }, [user]);

  // Load members when workspace changes
  useEffect(() => {
    if (!currentWorkspace || !user) {
      setMembers([]);
      setCurrentRole(null);
      return;
    }

    localStorage.setItem(WS_STORAGE_KEY, currentWorkspace.id);

    const loadMembers = async () => {
      const { data } = await supabase
        .from("workspace_members")
        .select("*")
        .eq("workspace_id", currentWorkspace.id);

      setMembers((data || []) as WorkspaceMember[]);

      const me = (data || []).find((m: any) => m.user_id === user.id);
      setCurrentRole(me?.role || null);
    };

    loadMembers();
  }, [currentWorkspace, user]);

  const switchWorkspace = useCallback((id: string) => {
    const ws = workspaces.find((w) => w.id === id);
    if (ws) setCurrentWorkspace(ws);
  }, [workspaces]);

  const createWorkspace = useCallback(async (name: string): Promise<Workspace | null> => {
    if (!user) return null;
    const slug = slugify(name) + "-" + Date.now().toString(36);

    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name, slug, owner_id: user.id })
      .select()
      .single();

    if (error || !data) return null;

    // Add self as owner
    await supabase
      .from("workspace_members")
      .insert({ workspace_id: (data as any).id, user_id: user.id, role: "owner" as const });

    const ws = data as Workspace;
    setWorkspaces((prev) => [...prev, ws]);
    setCurrentWorkspace(ws);
    return ws;
  }, [user]);

  const updateWorkspace = useCallback(async (id: string, updates: Partial<Pick<Workspace, "name" | "description" | "avatar_url">>): Promise<boolean> => {
    const { error } = await supabase.from("workspaces").update(updates).eq("id", id);
    if (error) return false;
    setWorkspaces((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    if (currentWorkspace?.id === id) setCurrentWorkspace((prev) => prev ? { ...prev, ...updates } : prev);
    return true;
  }, [currentWorkspace]);

  const deleteWorkspace = useCallback(async (id: string): Promise<boolean> => {
    const { error } = await supabase.from("workspaces").delete().eq("id", id);
    if (error) return false;
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (currentWorkspace?.id === id) {
      const remaining = workspaces.filter((w) => w.id !== id);
      setCurrentWorkspace(remaining[0] || null);
    }
    return true;
  }, [currentWorkspace, workspaces]);

  const inviteMember = useCallback(async (email: string, role: string): Promise<boolean> => {
    if (!currentWorkspace) return false;
    // Look up user by email in profiles - use any to avoid deep type instantiation
    const profileQuery: any = supabase.from("profiles").select("user_id");
    const { data: profile } = await profileQuery.eq("email", email).single();

    if (!profile) return false;

    const { error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: currentWorkspace.id,
        user_id: (profile as any).user_id,
        role: role as any,
        invited_by: user?.id,
      } as any);

    return !error;
  }, [currentWorkspace, user]);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    const { error } = await supabase.from("workspace_members").delete().eq("id", memberId);
    if (!error) setMembers((prev) => prev.filter((m) => m.id !== memberId));
    return !error;
  }, []);

  const updateMemberRole = useCallback(async (memberId: string, role: string): Promise<boolean> => {
    const { error } = await supabase.from("workspace_members").update({ role: role as any }).eq("id", memberId);
    if (!error) setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
    return !error;
  }, []);

  return (
    <WorkspaceContext.Provider value={{
      workspaces, currentWorkspace, members, loading,
      switchWorkspace, createWorkspace, updateWorkspace, deleteWorkspace,
      inviteMember, removeMember, updateMemberRole, currentRole,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
