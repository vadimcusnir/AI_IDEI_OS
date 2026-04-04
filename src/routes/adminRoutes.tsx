import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { AdminRoute } from "@/components/AdminRoute";

function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

const AdminDashboard = lazyRetry(() => import("@/pages/AdminDashboard"));
const AdminAuditLog = lazyRetry(() => import("@/pages/AdminAuditLog"));
const AdminKernel = lazyRetry(() => import("@/pages/AdminKernel"));
const AdminDomination = lazyRetry(() => import("@/pages/AdminDomination"));
const AdminInevitability = lazyRetry(() => import("@/pages/AdminInevitability"));
const AdminFinancialization = lazyRetry(() => import("@/pages/AdminFinancialization"));
const AdminRevenue = lazyRetry(() => import("@/pages/AdminRevenue"));
const RuntimeDashboard = lazyRetry(() => import("@/pages/RuntimeDashboard"));
const AnalyticsDashboard = lazyRetry(() => import("@/pages/AnalyticsDashboard"));
const SecurityDocs = lazyRetry(() => import("@/pages/SecurityDocs"));
const DatabaseRelations = lazyRetry(() => import("@/pages/DatabaseRelations"));

export function adminRoutes() {
  return (
    <>
      <Route path="/runtime" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Runtime failed to load"><RuntimeDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/cusnir-os/operator" element={<Navigate to="/admin" replace />} />
      <Route path="/analytics" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Analytics failed to load"><AnalyticsDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/security" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Security failed to load"><SecurityDocs /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/db-schema" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="DB Schema failed to load"><DatabaseRelations /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Admin failed to load"><AdminDashboard /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin/kernel" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Kernel failed to load"><AdminKernel /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin/domination" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Domination failed to load"><AdminDomination /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin/inevitability" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Inevitability failed to load"><AdminInevitability /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin/financialization" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Financialization failed to load"><AdminFinancialization /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin/revenue" element={<AdminRoute><AppLayout><ErrorBoundary fallbackTitle="Revenue failed to load"><AdminRevenue /></ErrorBoundary></AppLayout></AdminRoute>} />
      <Route path="/admin/audit-log" element={<AppLayout><AdminRoute><ErrorBoundary fallbackTitle="Audit log failed to load"><AdminAuditLog /></ErrorBoundary></AdminRoute></AppLayout>} />
    </>
  );
}
