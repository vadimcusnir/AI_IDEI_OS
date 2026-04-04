import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { SEOHead } from "@/components/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2, Users, Eye, EyeOff, ExternalLink, Brain,
  Sparkles, Quote, Search, X, AlertTriangle, Merge, Copy,
  TrendingUp, BookOpen, Share2, FolderTree,
} from "lucide-react";
import { FolderSidebar, useFolderSidebar } from "@/components/shared/FolderSidebar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface GuestProfile {
  id: string;
  full_name: string;
  slug: string;
  role: string;
  bio: string;
  expertise_areas: string[];
  frameworks_mentioned: string[];
  psychological_traits: string[];
  key_quotes: string[];
  episode_ids: string[];
  is_public: boolean;
  created_at: string;
}

// Simple similarity check for duplicate detection
function findDuplicateCandidates(guests: GuestProfile[]): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  const normalize = (name: string) => name.toLowerCase().replace(/[^a-zăâîșț\s]/gi, "").trim();

  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      const a = normalize(guests[i].full_name);
      const b = normalize(guests[j].full_name);
      const wordsA = a.split(/\s+/).filter(w => w.length > 3);
      const wordsB = b.split(/\s+/).filter(w => w.length > 3);
      const overlap = wordsA.some(w => wordsB.includes(w)) || a.includes(b) || b.includes(a);
      if (overlap) {
        const key = guests[i].id;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(guests[j].id);
      }
    }
  }
  return groups;
}

export default function GuestPages() {
  const { t } = useTranslation("pages");
  const { user, loading: authLoading } = useAuth();
  const { currentWorkspace, loading: wsLoading } = useWorkspace();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<GuestProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGuest, setSelectedGuest] = useState<GuestProfile | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { assignments } = useFolderSidebar("guest_folders");

  useEffect(() => {
    if (authLoading || wsLoading) return;
    if (!user || !currentWorkspace) { setLoading(false); return; }
    loadGuests();
  }, [user, authLoading, wsLoading, currentWorkspace]);

  const loadGuests = async () => {
    const { data, error } = await supabase
      .from("guest_profiles")
      .select("*")
      .eq("workspace_id", currentWorkspace!.id)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setGuests(data as unknown as GuestProfile[]);
    if (error) toast.error(t("guest_pages.error_loading"));
    setLoading(false);
  };

  const duplicates = useMemo(() => findDuplicateCandidates(guests), [guests]);
  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    duplicates.forEach((targets, source) => {
      ids.add(source);
      targets.forEach(t => ids.add(t));
    });
    return ids;
  }, [duplicates]);

  const togglePublic = async (guest: GuestProfile) => {
    const newState = !guest.is_public;
    const { error } = await supabase
      .from("guest_profiles")
      .update({ is_public: newState } as any)
      .eq("id", guest.id);
    if (error) { toast.error(t("guest_pages.error_generic")); return; }
    setGuests(prev => prev.map(g => g.id === guest.id ? { ...g, is_public: newState } : g));

    if (newState) {
      const publicUrl = `${window.location.origin}/guest/${guest.slug}`;
      toast.success(
        `✅ ${t("guest_pages.profile_now_public", { name: guest.full_name })}`,
        {
          description: t("guest_pages.profile_public_desc", { url: publicUrl }),
          duration: 10000,
          action: {
            label: t("guest_pages.copy_url"),
            onClick: () => {
              navigator.clipboard.writeText(publicUrl);
              toast.info(t("guest_pages.url_copied_clipboard"));
            },
          },
        }
      );
    } else {
      toast.success(t("guest_pages.profile_hidden"));
    }
  };

  const copyProfileUrl = (guest: GuestProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/guest/${guest.slug}`;
    navigator.clipboard.writeText(url);
    toast.success(t("guest_pages.url_copied"));
  };

  const filtered = useMemo(() => {
    let list = search.trim()
      ? guests.filter(g => g.full_name.toLowerCase().includes(search.toLowerCase()))
      : guests;
    if (showDuplicates) {
      list = list.filter(g => duplicateIds.has(g.id));
    }
    if (selectedFolderId === "__unassigned") {
      const assigned = new Set(Object.keys(assignments));
      list = list.filter(g => !assigned.has(g.id));
    } else if (selectedFolderId) {
      list = list.filter(g => assignments[g.id] === selectedFolderId);
    }
    return list;
  }, [guests, search, showDuplicates, duplicateIds, selectedFolderId, assignments]);

  if (authLoading || wsLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex-1 flex overflow-hidden">
        {showFolders && (
          <FolderSidebar storageKey="guest_folders" items={guests.map(g => ({ id: g.id, label: g.full_name }))}
            selectedFolderId={selectedFolderId} onSelectFolder={setSelectedFolderId} allLabel={t("guest_pages.all_guests")} headerLabel={t("guest_pages.guest_folders")} />
        )}
        <div className="flex-1 overflow-y-auto">
        <SEOHead title={`${t("guest_pages.title")} — AI-IDEI`} description={t("guest_pages.auto_generated")} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant={showFolders ? "default" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setShowFolders(!showFolders)}>
                <FolderTree className="h-3.5 w-3.5" />
              </Button>
              <h1 className="text-lg font-semibold tracking-tight">{t("guest_pages.title")}</h1>
              <span className="text-micro font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                {t("guest_pages.profiles_count", { count: guests.length })}
              </span>
            </div>
            {duplicates.size > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showDuplicates ? "default" : "outline"}
                    size="sm"
                    className="text-micro h-7 gap-1"
                    onClick={() => setShowDuplicates(!showDuplicates)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {t("guest_pages.possible_duplicates", { count: duplicates.size })}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-[220px] text-micro">
                  {t("guest_pages.duplicate_tooltip")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Enhanced description */}
          <div className="rounded-xl border border-border bg-card/50 p-4 mb-6">
            <div className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-foreground font-medium">
                  {t("guest_pages.auto_generated")}
                </p>
                <p className="text-dense text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("guest_pages.auto_generated_desc") }} />
                <div className="flex flex-wrap gap-3 pt-1 text-micro text-muted-foreground/70">
                  <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {t("guest_pages.organic_traffic")}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {t("guest_pages.social_sharing")}</span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {t("guest_pages.viral_content")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg px-2.5 py-1.5 mb-6 max-w-xs">
            <Search className="h-3 w-3 text-muted-foreground/50 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t("guest_pages.search_placeholder")}
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-10 w-10 opacity-20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                {guests.length === 0
                  ? t("guest_pages.no_profiles")
                  : showDuplicates
                    ? t("guest_pages.no_duplicates")
                    : t("guest_pages.no_search_results")
                }
              </p>
              {guests.length === 0 && (
                <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate("/extractor")}>
                  {t("guest_pages.go_to_extractor")}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(guest => {
                const isDuplicate = duplicateIds.has(guest.id);
                return (
                  <div
                    key={guest.id}
                    className={cn(
                      "rounded-xl border bg-card p-4 transition-all cursor-pointer hover:border-primary/30 hover:shadow-sm",
                      selectedGuest?.id === guest.id ? "border-primary/40 ring-1 ring-primary/20" : "border-border",
                      showDuplicates && isDuplicate && "border-yellow-500/30 bg-yellow-500/5"
                    )}
                    onClick={() => setSelectedGuest(selectedGuest?.id === guest.id ? null : guest)}
                  >
                    {/* Duplicate warning */}
                    {showDuplicates && isDuplicate && (
                      <div className="flex items-center gap-1.5 text-nano text-yellow-600 dark:text-yellow-400 mb-2">
                        <AlertTriangle className="h-3 w-3" />
                        <span>{t("guest_pages.possible_duplicate_warning")}</span>
                      </div>
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">
                            {guest.full_name.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{guest.full_name}</h3>
                          <span className="text-nano uppercase tracking-wider text-muted-foreground">{guest.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {guest.is_public && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => copyProfileUrl(guest, e)}
                                className="text-muted-foreground/50 hover:text-primary transition-colors"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="text-micro">{t("guest_pages.copy_public_url")}</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              {guest.is_public ? (
                                <Eye className="h-3 w-3 text-status-validated" />
                              ) : (
                                <EyeOff className="h-3 w-3 text-muted-foreground/40" />
                              )}
                              <Switch
                                checked={guest.is_public}
                                onCheckedChange={() => togglePublic(guest)}
                                className="scale-75"
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-micro max-w-[180px]">
                            {guest.is_public
                              ? t("guest_pages.profile_public_tooltip")
                              : t("guest_pages.profile_private_tooltip")
                            }
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-dense text-muted-foreground line-clamp-2 mb-2">{guest.bio}</p>

                    {/* Tags */}
                    {guest.expertise_areas.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {guest.expertise_areas.slice(0, 4).map((area, i) => (
                          <span key={i} className="text-nano px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {area}
                          </span>
                        ))}
                        {guest.expertise_areas.length > 4 && (
                          <span className="text-nano text-muted-foreground/50">+{guest.expertise_areas.length - 4}</span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-nano text-muted-foreground/60">
                      <span className="flex items-center gap-0.5">
                        <Brain className="h-2.5 w-2.5" />
                        {guest.frameworks_mentioned?.length || 0} {t("guest_pages.frameworks").toLowerCase()}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Quote className="h-2.5 w-2.5" />
                        {t("guest_pages.quotes_count", { count: guest.key_quotes?.length || 0 })}
                      </span>
                      <span>{t("guest_pages.episodes_count", { count: guest.episode_ids?.length || 0 })}</span>
                    </div>

                    {/* Expanded detail */}
                    {selectedGuest?.id === guest.id && (
                      <div className="mt-3 pt-3 border-t border-border space-y-3">
                        {guest.frameworks_mentioned.length > 0 && (
                          <div>
                            <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                              {t("guest_pages.frameworks")}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {guest.frameworks_mentioned.map((f, i) => (
                                <span key={i} className="text-micro px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {guest.psychological_traits.length > 0 && (
                          <div>
                            <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                              {t("guest_pages.traits")}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {guest.psychological_traits.map((tr, i) => (
                                <span key={i} className="text-micro px-2 py-0.5 rounded-full bg-accent/15 text-accent-foreground">
                                  {tr}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {guest.key_quotes.length > 0 && (
                          <div>
                            <span className="text-nano font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                              {t("guest_pages.key_quotes")}
                            </span>
                            <div className="space-y-1">
                              {guest.key_quotes.map((q, i) => (
                                <p key={i} className="text-micro italic text-muted-foreground pl-2 border-l-2 border-primary/20">
                                  "{q}"
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {guest.is_public && (
                            <a
                              href={`/guest/${guest.slug}`}
                              target="_blank"
                              rel="noopener"
                              className="inline-flex items-center gap-1 text-micro text-primary hover:underline"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                              {t("guest_pages.view_public_page")}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
