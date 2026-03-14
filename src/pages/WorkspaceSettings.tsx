import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Users, Crown, Shield, Pencil, Eye, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";

const ROLE_ICONS: Record<string, typeof Crown> = {
  owner: Crown,
  admin: Shield,
  editor: Pencil,
  viewer: Eye,
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  admin: "bg-red-500/10 text-red-600 border-red-500/20",
  editor: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  viewer: "bg-muted text-muted-foreground",
};

export default function WorkspaceSettings() {
  const { currentWorkspace, members, updateWorkspace, inviteMember, removeMember, updateMemberRole, currentRole, deleteWorkspace } = useWorkspace();
  const { user } = useAuth();
  const [name, setName] = useState(currentWorkspace?.name || "");
  const [description, setDescription] = useState(currentWorkspace?.description || "");
  const [saving, setSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);

  const isOwnerOrAdmin = currentRole === "owner" || currentRole === "admin";

  const handleSave = async () => {
    if (!currentWorkspace) return;
    setSaving(true);
    const ok = await updateWorkspace(currentWorkspace.id, { name, description });
    setSaving(false);
    if (ok) toast.success("Workspace actualizat");
    else toast.error("Eroare la salvare");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const ok = await inviteMember(inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (ok) {
      toast.success(`${inviteEmail} a fost invitat`);
      setInviteEmail("");
    } else {
      toast.error("Utilizatorul nu a fost găsit sau eroare la invitare");
    }
  };

  if (!currentWorkspace) {
    return <div className="p-8 text-center text-muted-foreground">Niciun workspace selectat.</div>;
  }

  return (
    <>
      <SEOHead title="Workspace Settings — AI-IDEI" description="Manage your workspace settings, members, and roles." />
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Setări Workspace</h1>
        </div>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
            <CardDescription>Numele și descrierea workspace-ului.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nume</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isOwnerOrAdmin} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descriere</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={!isOwnerOrAdmin} rows={3} />
            </div>
            {isOwnerOrAdmin && (
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? "Se salvează…" : "Salvează"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membri ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((m) => {
              const RoleIcon = ROLE_ICONS[m.role] || Eye;
              return (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <RoleIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.user_id === user?.id ? "Tu" : m.user_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(m.joined_at).toLocaleDateString()}</p>
                  </div>
                  {isOwnerOrAdmin && m.role !== "owner" ? (
                    <Select value={m.role} onValueChange={(r) => updateMemberRole(m.id, r)}>
                      <SelectTrigger className="w-24 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className={ROLE_COLORS[m.role]}>{m.role}</Badge>
                  )}
                  {isOwnerOrAdmin && m.role !== "owner" && m.user_id !== user?.id && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMember(m.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}

            {isOwnerOrAdmin && (
              <>
                <Separator />
                <div className="flex gap-2">
                  <Input
                    placeholder="Email utilizator"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleInvite} disabled={inviting} size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    {inviting ? "…" : "Invită"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {currentRole === "owner" && (
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Zonă Periculoasă</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="sm"
                onClick={async () => {
                  if (!confirm("Sigur vrei să ștergi acest workspace? Acțiunea este ireversibilă.")) return;
                  const ok = await deleteWorkspace(currentWorkspace.id);
                  if (ok) toast.success("Workspace șters");
                  else toast.error("Nu poți șterge workspace-ul principal");
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Șterge Workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
