import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useForumCategories, useForumThreads } from "@/hooks/useForum";
import { SEOHead } from "@/components/SEOHead";
import { PageTransition } from "@/components/motion/PageTransition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CommunityRewardsGuide } from "@/components/community/CommunityRewardsGuide";
import { CommunityStats } from "@/components/community/CommunityStats";
import { CategoryList } from "@/components/community/CategoryList";
import { ThreadRow } from "@/components/community/ThreadRow";
import { NewThreadDialog } from "@/components/community/NewThreadDialog";
import { ControlledSection } from "@/components/ControlledSection";
import {
  MessageSquare, ArrowLeft, Search, Filter,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Community() {
  const { t } = useTranslation("pages");
  const { category: categorySlug } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: categories, isLoading: catLoading } = useForumCategories();
  const { data: threads, isLoading: threadsLoading, refetch } = useForumThreads(categorySlug);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "top" | "unsolved">("recent");

  const selectedCategory = categories?.find((c) => c.slug === categorySlug);

  const filteredThreads = (threads || [])
    .filter((th) => !search || th.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "top") return b.vote_score - a.vote_score;
      if (sortBy === "unsolved") return (a.is_solved ? 1 : 0) - (b.is_solved ? 1 : 0);
      return new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime();
    });

  return (
    <PageTransition>
      <SEOHead title="Community — AI-IDEI" description="Ask questions, share knowledge, earn karma & NEURONS rewards in the AI-IDEI community." />
      <div className="flex-1 overflow-auto p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {categorySlug && (
            <Button variant="ghost" size="icon" onClick={() => navigate("/community")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold">{selectedCategory?.name || t("community.title")}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedCategory?.description || t("community.description")}
            </p>
          </div>
          {categorySlug && user && selectedCategory && (
            <NewThreadDialog categoryId={selectedCategory.id} onSuccess={() => refetch()} />
          )}
        </div>

        {/* User stats bar */}
        <ControlledSection elementId="community.stats">
          <CommunityStats />
        </ControlledSection>

        {/* Rewards guide (collapsible) */}
        <ControlledSection elementId="community.rewards_guide">
          {!categorySlug && <CommunityRewardsGuide />}
        </ControlledSection>

        {/* Category listing */}
        {!categorySlug && (
          <>
            {catLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : (
              <CategoryList categories={categories || []} onSelect={(slug) => navigate(`/community/${slug}`)} />
            )}
          </>
        )}

        {/* Thread listing */}
        {categorySlug && (
          <>
            {/* Search & Sort toolbar */}
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder={t("community.search_threads")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {(["recent", "top", "unsolved"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={sortBy === s ? "default" : "ghost"}
                    size="sm"
                    className="text-micro h-7 px-2"
                    onClick={() => setSortBy(s)}
                  >
                    {s === "recent" ? t("community.sort_recent") : s === "top" ? t("community.sort_top") : t("community.sort_unsolved")}
                  </Button>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-2">
                {threadsLoading ? (
                  <div className="space-y-2 p-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
                  </div>
                ) : filteredThreads.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredThreads.map((thread) => (
                      <ThreadRow
                        key={thread.id}
                        thread={thread}
                        onClick={() => navigate(`/community/${categorySlug}/thread/${thread.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {search ? t("community.no_threads_search") : t("community.no_threads")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <CommunityRewardsGuide />
          </>
        )}
      </div>
    </PageTransition>
  );
}
