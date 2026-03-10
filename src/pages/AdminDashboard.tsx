import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Shield, Users, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import logo from "@/assets/logo.gif";

interface NeuronStat {
  total: number;
  published: number;
  draft: number;
}

interface RecentNeuron {
  id: number;
  number: number;
  title: string;
  status: string;
  visibility: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { isAdmin, loading, user } = useAdminCheck();
  const navigate = useNavigate();
  const [stats, setStats] = useState<NeuronStat>({ total: 0, published: 0, draft: 0 });
  const [recentNeurons, setRecentNeurons] = useState<RecentNeuron[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!isAdmin) { navigate("/"); return; }

    const fetchData = async () => {
      const [allRes, publishedRes, draftRes, recentRes] = await Promise.all([
        supabase.from("neurons").select("id", { count: "exact", head: true }),
        supabase.from("neurons").select("id", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("neurons").select("id", { count: "exact", head: true }).eq("status", "draft"),
        supabase.from("neurons").select("id, number, title, status, visibility, created_at").order("created_at", { ascending: false }).limit(20),
      ]);

      setStats({
        total: allRes.count ?? 0,
        published: publishedRes.count ?? 0,
        draft: draftRes.count ?? 0,
      });
      setRecentNeurons(recentRes.data ?? []);
      setLoadingData(false);
    };

    fetchData();
  }, [isAdmin, loading, user, navigate]);

  if (loading || loadingData) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="h-12 border-b border-border bg-card flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <img src={logo} alt="ai-idei.com" className="h-6 w-6" />
          <span className="text-base font-serif">Admin Dashboard</span>
          <Shield className="h-4 w-4 text-primary" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Neurons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-serif">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-serif text-primary">{stats.published}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-serif">{stats.draft}</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent neurons table */}
        <div>
          <h2 className="text-lg font-serif mb-4">Recent Neurons</h2>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Visibility</TableHead>
                  <TableHead className="w-32">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentNeurons.map((n) => (
                  <TableRow
                    key={n.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/n/${n.number}`)}
                  >
                    <TableCell className="font-mono text-primary font-bold text-xs">
                      {n.number}
                    </TableCell>
                    <TableCell className="font-medium">{n.title}</TableCell>
                    <TableCell>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {n.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {n.visibility}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {recentNeurons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No neurons yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
