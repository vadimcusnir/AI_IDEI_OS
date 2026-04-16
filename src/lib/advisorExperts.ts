export interface AdvisorExpert {
  key: string;
  name: string;
  role: string;
  emoji: string;
  color: string;
}

export const ADVISOR_EXPERTS: AdvisorExpert[] = [
  { key: "cfo", name: "CFO Advisor", role: "Director Financiar", emoji: "💰", color: "text-emerald-500" },
  { key: "control_center", name: "Control Center", role: "Operations Director", emoji: "🎛️", color: "text-blue-500" },
  { key: "analytics", name: "Analytics", role: "Data Analyst", emoji: "📊", color: "text-purple-500" },
  { key: "kernel", name: "Kernel", role: "Platform Architect", emoji: "🧬", color: "text-rose-500" },
  { key: "content", name: "Content", role: "Knowledge Director", emoji: "📚", color: "text-amber-500" },
  { key: "security", name: "Security", role: "CISO", emoji: "🛡️", color: "text-red-500" },
  { key: "growth", name: "Growth/SEO", role: "Head of Growth", emoji: "🚀", color: "text-cyan-500" },
  { key: "operations", name: "Operations", role: "COO", emoji: "⚙️", color: "text-orange-500" },
  { key: "pricing", name: "Pricing", role: "Revenue Strategist", emoji: "💎", color: "text-fuchsia-500" },
];

export const getExpert = (key: string) => ADVISOR_EXPERTS.find(e => e.key === key);
