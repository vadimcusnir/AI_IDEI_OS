import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppLayout } from "@/components/AppLayout";
import { LocaleRouter } from "@/components/LocaleRouter";

function lazyRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      window.location.reload();
      return new Promise(() => {});
    })
  );
}

const Landing = lazyRetry(() => import("@/pages/Landing"));
const Auth = lazyRetry(() => import("@/pages/Auth"));
const ResetPassword = lazyRetry(() => import("@/pages/ResetPassword"));
const Links = lazyRetry(() => import("@/pages/Links"));
const Architecture = lazyRetry(() => import("@/pages/Architecture"));
const PublicUserProfile = lazyRetry(() => import("@/pages/PublicUserProfile"));
const GuestProfile = lazyRetry(() => import("@/pages/GuestProfile"));
const Docs = lazyRetry(() => import("@/pages/Docs"));
const Changelog = lazyRetry(() => import("@/pages/Changelog"));
const Blog = lazyRetry(() => import("@/pages/Blog"));
const BlogPost = lazyRetry(() => import("@/pages/BlogPost"));
const PublicEntityPage = lazyRetry(() => import("@/pages/PublicEntityPage"));
const PublicInsightPage = lazyRetry(() => import("@/pages/PublicInsightPage"));
const PublicProfileEntityPage = lazyRetry(() => import("@/pages/PublicProfileEntityPage"));
const PublicAnalysis = lazyRetry(() => import("@/pages/PublicAnalysis"));
const Marketplace = lazyRetry(() => import("@/pages/Marketplace"));
const MarketplaceDetail = lazyRetry(() => import("@/pages/MarketplaceDetail"));
const MediaProfiles = lazyRetry(() => import("@/pages/MediaProfiles"));
const MediaProfilePublic = lazyRetry(() => import("@/pages/MediaProfilePublic"));
const AdminMediaProfiles = lazyRetry(() => import("@/pages/AdminMediaProfiles"));
const PipelineOverview = lazyRetry(() => import("@/pages/PipelineOverview"));
const ProductSurfacePage = lazyRetry(() => import("@/pages/ProductSurfacePage"));
const TermsOfService = lazyRetry(() => import("@/pages/TermsOfService"));
const Pricing = lazyRetry(() => import("@/pages/Pricing"));
const About = lazyRetry(() => import("@/pages/About"));
const AboutVadimCusnir = lazyRetry(() => import("@/pages/AboutVadimCusnir"));
const PaymentResult = lazyRetry(() => import("@/pages/PaymentResult"));
const PrivacyPolicy = lazyRetry(() => import("@/pages/PrivacyPolicy"));
const Community = lazyRetry(() => import("@/pages/Community"));
const CommunityThread = lazyRetry(() => import("@/pages/CommunityThread"));
const Services = lazyRetry(() => import("@/pages/Services"));
const Programs = lazyRetry(() => import("@/pages/Programs"));
const ServicesCatalog = lazyRetry(() => import("@/pages/NewServicesCatalog"));
const ServiceDetail = lazyRetry(() => import("@/pages/ServiceDetail"));
const ServiceExecute = lazyRetry(() => import("@/pages/ServiceExecute"));
const DeliverablesLibrary = lazyRetry(() => import("@/pages/DeliverablesLibrary"));
const PurchaseHistory = lazyRetry(() => import("@/pages/PurchaseHistory"));

/**
 * All public SEO-indexable route definitions.
 * Used both under /:lang prefix and as bare-path redirects.
 */
function publicRouteDefinitions() {
  return (
    <>
      <Route index element={<ErrorBoundary fallbackTitle="Landing failed to load"><Landing /></ErrorBoundary>} />
      <Route path="auth" element={<ErrorBoundary fallbackTitle="Auth failed to load"><Auth /></ErrorBoundary>} />
      <Route path="reset-password" element={<ErrorBoundary fallbackTitle="Reset password failed"><ResetPassword /></ErrorBoundary>} />
      <Route path="links" element={<AppLayout><ErrorBoundary fallbackTitle="Links failed to load"><Links /></ErrorBoundary></AppLayout>} />
      <Route path="architecture" element={<AppLayout><ErrorBoundary fallbackTitle="Architecture failed to load"><Architecture /></ErrorBoundary></AppLayout>} />
      <Route path="u/:username" element={<ErrorBoundary fallbackTitle="Profile failed to load"><PublicUserProfile /></ErrorBoundary>} />
      <Route path="guest/:slug" element={<ErrorBoundary fallbackTitle="Guest profile failed to load"><GuestProfile /></ErrorBoundary>} />

      {/* Public knowledge infrastructure */}
      <Route path="docs" element={<AppLayout><ErrorBoundary fallbackTitle="Docs failed to load"><Docs /></ErrorBoundary></AppLayout>} />
      <Route path="docs/:section/:topic" element={<AppLayout><ErrorBoundary fallbackTitle="Docs failed to load"><Docs /></ErrorBoundary></AppLayout>} />
      <Route path="changelog" element={<AppLayout><ErrorBoundary fallbackTitle="Changelog failed to load"><Changelog /></ErrorBoundary></AppLayout>} />
      <Route path="blog" element={<AppLayout><ErrorBoundary fallbackTitle="Blog failed to load"><Blog /></ErrorBoundary></AppLayout>} />
      <Route path="blog/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Blog post failed to load"><BlogPost /></ErrorBoundary></AppLayout>} />

      {/* SEO-indexable entity pages */}
      <Route path="knowledge/:slug" element={<ErrorBoundary fallbackTitle="Knowledge page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="insights/:slug" element={<ErrorBoundary fallbackTitle="Insight page failed"><PublicInsightPage /></ErrorBoundary>} />
      <Route path="profiles/:slug" element={<ErrorBoundary fallbackTitle="Profile page failed"><PublicProfileEntityPage /></ErrorBoundary>} />
      <Route path="patterns/:slug" element={<ErrorBoundary fallbackTitle="Pattern page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="formulas/:slug" element={<ErrorBoundary fallbackTitle="Formula page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="contradictions/:slug" element={<ErrorBoundary fallbackTitle="Contradiction page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="applications/:slug" element={<ErrorBoundary fallbackTitle="Application page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="topics/:slug" element={<ErrorBoundary fallbackTitle="Topic page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="analysis/:slug" element={<ErrorBoundary fallbackTitle="Analysis page failed"><PublicAnalysis /></ErrorBoundary>} />

      {/* Redirects */}
      <Route path="insights" element={<Navigate to="/library" replace />} />
      <Route path="patterns" element={<Navigate to="/library" replace />} />
      <Route path="formulas" element={<Navigate to="/library" replace />} />
      <Route path="contradictions" element={<Navigate to="/library" replace />} />
      <Route path="applications" element={<Navigate to="/library" replace />} />
      <Route path="profiles" element={<Navigate to="/library" replace />} />
      <Route path="topics" element={<Navigate to="/library" replace />} />
      <Route path="topics/discovery" element={<Navigate to="/library" replace />} />

      {/* Marketplace & media (public access) */}
      <Route path="marketplace" element={<AppLayout><ErrorBoundary fallbackTitle="Marketplace failed to load"><Marketplace /></ErrorBoundary></AppLayout>} />
      <Route path="marketplace/:id" element={<AppLayout><ErrorBoundary fallbackTitle="Marketplace detail failed"><MarketplaceDetail /></ErrorBoundary></AppLayout>} />
      <Route path="media/profiles" element={<AppLayout><ErrorBoundary fallbackTitle="Media profiles failed to load"><MediaProfiles /></ErrorBoundary></AppLayout>} />
      <Route path="media/profiles/:slug" element={<ErrorBoundary fallbackTitle="Media profile failed"><MediaProfilePublic /></ErrorBoundary>} />
      <Route path="admin/media-profiles" element={<AppLayout><ErrorBoundary fallbackTitle="Admin media failed"><AdminMediaProfiles /></ErrorBoundary></AppLayout>} />

      {/* Pipeline & services (public catalog) */}
      <Route path="pipeline-overview" element={<AppLayout><ErrorBoundary fallbackTitle="Pipeline failed to load"><PipelineOverview /></ErrorBoundary></AppLayout>} />
      <Route path="services" element={<AppLayout><ErrorBoundary fallbackTitle="Services failed to load"><Services /></ErrorBoundary></AppLayout>} />
      <Route path="programs" element={<AppLayout><ErrorBoundary fallbackTitle="Programs failed to load"><Programs /></ErrorBoundary></AppLayout>} />
      <Route path="services-catalog" element={<AppLayout><ErrorBoundary fallbackTitle="Catalog failed to load"><ServicesCatalog /></ErrorBoundary></AppLayout>} />
      <Route path="services/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Service detail failed"><ServiceDetail /></ErrorBoundary></AppLayout>} />
      <Route path="services/:slug/execute" element={<AppLayout><ErrorBoundary fallbackTitle="Service execution failed"><ServiceExecute /></ErrorBoundary></AppLayout>} />
      <Route path="deliverables" element={<AppLayout><ErrorBoundary fallbackTitle="Deliverables failed to load"><DeliverablesLibrary /></ErrorBoundary></AppLayout>} />
      <Route path="purchases" element={<AppLayout><ErrorBoundary fallbackTitle="Purchases failed to load"><PurchaseHistory /></ErrorBoundary></AppLayout>} />
      <Route path="products/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Product failed to load"><ProductSurfacePage /></ErrorBoundary></AppLayout>} />

      {/* Static pages */}
      <Route path="terms" element={<AppLayout><ErrorBoundary fallbackTitle="Terms failed to load"><TermsOfService /></ErrorBoundary></AppLayout>} />
      <Route path="pricing" element={<AppLayout><ErrorBoundary fallbackTitle="Pricing failed to load"><Pricing /></ErrorBoundary></AppLayout>} />
      <Route path="about" element={<AppLayout><ErrorBoundary fallbackTitle="About failed to load"><About /></ErrorBoundary></AppLayout>} />
      <Route path="about-vadim-cusnir" element={<AppLayout><ErrorBoundary fallbackTitle="About Vadim failed to load"><AboutVadimCusnir /></ErrorBoundary></AppLayout>} />
      <Route path="payment/result" element={<AppLayout><ErrorBoundary fallbackTitle="Payment failed to load"><PaymentResult /></ErrorBoundary></AppLayout>} />
      <Route path="privacy" element={<AppLayout><ErrorBoundary fallbackTitle="Privacy failed to load"><PrivacyPolicy /></ErrorBoundary></AppLayout>} />

      {/* Community */}
      <Route path="community" element={<AppLayout><ErrorBoundary fallbackTitle="Community failed to load"><Community /></ErrorBoundary></AppLayout>} />
      <Route path="community/:category" element={<AppLayout><ErrorBoundary fallbackTitle="Community failed to load"><Community /></ErrorBoundary></AppLayout>} />
      <Route path="community/:category/thread/:threadId" element={<AppLayout><ErrorBoundary fallbackTitle="Thread failed to load"><CommunityThread /></ErrorBoundary></AppLayout>} />

      {/* Legacy redirects */}
      <Route path="transcribe" element={<Navigate to="/extractor" replace />} />
      <Route path="tools/vtt-validator" element={<Navigate to="/home" replace />} />
    </>
  );
}

export function publicRoutes() {
  return (
    <>
      {/* /:lang/* — SEO subfolder routes */}
      <Route path=":lang" element={<LocaleRouter />}>
        {publicRouteDefinitions()}
      </Route>

      {/* Bare paths — redirect to default lang subfolder */}
      <Route path="/" element={<ErrorBoundary fallbackTitle="Landing failed to load"><Landing /></ErrorBoundary>} />
      <Route path="/auth" element={<ErrorBoundary fallbackTitle="Auth failed to load"><Auth /></ErrorBoundary>} />
      <Route path="/reset-password" element={<ErrorBoundary fallbackTitle="Reset password failed"><ResetPassword /></ErrorBoundary>} />
      <Route path="/links" element={<AppLayout><ErrorBoundary fallbackTitle="Links failed to load"><Links /></ErrorBoundary></AppLayout>} />
      <Route path="/architecture" element={<AppLayout><ErrorBoundary fallbackTitle="Architecture failed to load"><Architecture /></ErrorBoundary></AppLayout>} />
      <Route path="/u/:username" element={<ErrorBoundary fallbackTitle="Profile failed to load"><PublicUserProfile /></ErrorBoundary>} />
      <Route path="/guest/:slug" element={<ErrorBoundary fallbackTitle="Guest profile failed to load"><GuestProfile /></ErrorBoundary>} />
      <Route path="/docs" element={<AppLayout><ErrorBoundary fallbackTitle="Docs failed to load"><Docs /></ErrorBoundary></AppLayout>} />
      <Route path="/docs/:section/:topic" element={<AppLayout><ErrorBoundary fallbackTitle="Docs failed to load"><Docs /></ErrorBoundary></AppLayout>} />
      <Route path="/changelog" element={<AppLayout><ErrorBoundary fallbackTitle="Changelog failed to load"><Changelog /></ErrorBoundary></AppLayout>} />
      <Route path="/blog" element={<AppLayout><ErrorBoundary fallbackTitle="Blog failed to load"><Blog /></ErrorBoundary></AppLayout>} />
      <Route path="/blog/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Blog post failed to load"><BlogPost /></ErrorBoundary></AppLayout>} />
      <Route path="/knowledge/:slug" element={<ErrorBoundary fallbackTitle="Knowledge page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="/insights/:slug" element={<ErrorBoundary fallbackTitle="Insight page failed"><PublicInsightPage /></ErrorBoundary>} />
      <Route path="/profiles/:slug" element={<ErrorBoundary fallbackTitle="Profile page failed"><PublicProfileEntityPage /></ErrorBoundary>} />
      <Route path="/patterns/:slug" element={<ErrorBoundary fallbackTitle="Pattern page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="/formulas/:slug" element={<ErrorBoundary fallbackTitle="Formula page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="/contradictions/:slug" element={<ErrorBoundary fallbackTitle="Contradiction page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="/applications/:slug" element={<ErrorBoundary fallbackTitle="Application page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="/topics/:slug" element={<ErrorBoundary fallbackTitle="Topic page failed"><PublicEntityPage /></ErrorBoundary>} />
      <Route path="/analysis/:slug" element={<ErrorBoundary fallbackTitle="Analysis page failed"><PublicAnalysis /></ErrorBoundary>} />
      <Route path="/insights" element={<Navigate to="/library" replace />} />
      <Route path="/patterns" element={<Navigate to="/library" replace />} />
      <Route path="/formulas" element={<Navigate to="/library" replace />} />
      <Route path="/contradictions" element={<Navigate to="/library" replace />} />
      <Route path="/applications" element={<Navigate to="/library" replace />} />
      <Route path="/profiles" element={<Navigate to="/library" replace />} />
      <Route path="/topics" element={<Navigate to="/library" replace />} />
      <Route path="/topics/discovery" element={<Navigate to="/library" replace />} />
      <Route path="/marketplace" element={<AppLayout><ErrorBoundary fallbackTitle="Marketplace failed to load"><Marketplace /></ErrorBoundary></AppLayout>} />
      <Route path="/marketplace/:id" element={<AppLayout><ErrorBoundary fallbackTitle="Marketplace detail failed"><MarketplaceDetail /></ErrorBoundary></AppLayout>} />
      <Route path="/media/profiles" element={<AppLayout><ErrorBoundary fallbackTitle="Media profiles failed to load"><MediaProfiles /></ErrorBoundary></AppLayout>} />
      <Route path="/media/profiles/:slug" element={<ErrorBoundary fallbackTitle="Media profile failed"><MediaProfilePublic /></ErrorBoundary>} />
      <Route path="/admin/media-profiles" element={<AppLayout><ErrorBoundary fallbackTitle="Admin media failed"><AdminMediaProfiles /></ErrorBoundary></AppLayout>} />
      <Route path="/pipeline-overview" element={<AppLayout><ErrorBoundary fallbackTitle="Pipeline failed to load"><PipelineOverview /></ErrorBoundary></AppLayout>} />
      <Route path="/services" element={<AppLayout><ErrorBoundary fallbackTitle="Services failed to load"><Services /></ErrorBoundary></AppLayout>} />
      <Route path="/programs" element={<AppLayout><ErrorBoundary fallbackTitle="Programs failed to load"><Programs /></ErrorBoundary></AppLayout>} />
      <Route path="/services-catalog" element={<AppLayout><ErrorBoundary fallbackTitle="Catalog failed to load"><ServicesCatalog /></ErrorBoundary></AppLayout>} />
      <Route path="/services/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Service detail failed"><ServiceDetail /></ErrorBoundary></AppLayout>} />
      <Route path="/services/:slug/execute" element={<AppLayout><ErrorBoundary fallbackTitle="Service execution failed"><ServiceExecute /></ErrorBoundary></AppLayout>} />
      <Route path="/deliverables" element={<AppLayout><ErrorBoundary fallbackTitle="Deliverables failed"><DeliverablesLibrary /></ErrorBoundary></AppLayout>} />
      <Route path="/purchases" element={<AppLayout><ErrorBoundary fallbackTitle="Purchases failed"><PurchaseHistory /></ErrorBoundary></AppLayout>} />
      <Route path="/products/:slug" element={<AppLayout><ErrorBoundary fallbackTitle="Product failed to load"><ProductSurfacePage /></ErrorBoundary></AppLayout>} />
      <Route path="/terms" element={<AppLayout><ErrorBoundary fallbackTitle="Terms failed to load"><TermsOfService /></ErrorBoundary></AppLayout>} />
      <Route path="/pricing" element={<AppLayout><ErrorBoundary fallbackTitle="Pricing failed to load"><Pricing /></ErrorBoundary></AppLayout>} />
      <Route path="/about" element={<AppLayout><ErrorBoundary fallbackTitle="About failed to load"><About /></ErrorBoundary></AppLayout>} />
      <Route path="/about-vadim-cusnir" element={<AppLayout><ErrorBoundary fallbackTitle="About Vadim failed to load"><AboutVadimCusnir /></ErrorBoundary></AppLayout>} />
      <Route path="/payment/result" element={<AppLayout><ErrorBoundary fallbackTitle="Payment failed to load"><PaymentResult /></ErrorBoundary></AppLayout>} />
      <Route path="/privacy" element={<AppLayout><ErrorBoundary fallbackTitle="Privacy failed to load"><PrivacyPolicy /></ErrorBoundary></AppLayout>} />
      <Route path="/community" element={<AppLayout><ErrorBoundary fallbackTitle="Community failed to load"><Community /></ErrorBoundary></AppLayout>} />
      <Route path="/community/:category" element={<AppLayout><ErrorBoundary fallbackTitle="Community failed to load"><Community /></ErrorBoundary></AppLayout>} />
      <Route path="/community/:category/thread/:threadId" element={<AppLayout><ErrorBoundary fallbackTitle="Thread failed to load"><CommunityThread /></ErrorBoundary></AppLayout>} />
      <Route path="/transcribe" element={<Navigate to="/extractor" replace />} />
      <Route path="/tools/vtt-validator" element={<Navigate to="/home" replace />} />
    </>
  );
}
