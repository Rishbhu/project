"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Capability { name: string; label: string; description: string; color: string; }
interface AgentConfig {
  agentName: string;
  personality: { traits: string[]; style: string; avoid: string[] };
  reasoning: { name: string; personality: string; tone: string; avoidance: string; strategy: string };
  messages: Array<{ label: string; content: string }>;
  capabilities?: Capability[];
}
interface CompanyContext {
  companyName: string; whatTheyDo: string; culture: string;
  candidateProfile: { jobTitle: string; seniorityLevel: string; keySkills: string };
  tone: string;
}
interface AgentBrainFields {
  hallucinationRisk: "Low" | "Medium" | "High";
  missingFacts: string[];
  knownFactsUsed: string[];
  nextBestAction: string;
  candidateStage: string;
  candidateFitSignal: string;
  candidateIntent: string;
  candidateSentiment: string;
  shouldQualifyOut: boolean;
  isPromptInjection: boolean;
  confidence: number;
  signals: string[];
  mainObjection: string;
}
interface AuditTestResult {
  name: string;
  key: string;
  message: string;
  description: string;
  reply: string;
  agentBrain: AgentBrainFields | null;
  result: "pass" | "warning" | "fail";
  explanation: string;
  deduction: number;
}

const C = {
  bg: "#f1f3f9",
  card: "#ffffff",
  cardHeader: "#f8f9fc",
  border: "#e2e6f2",
  borderSoft: "#edf0f8",
  text: "#0f1117",
  textSub: "#4b5675",
  textMuted: "#8891a8",
  indigo: "#6366f1",
  indigoBg: "#f0f1ff",
  indigoBorder: "#c7caef",
  shadow: "0 1px 4px rgba(15,17,40,0.06), 0 6px 24px rgba(15,17,40,0.05)",
  shadowSm: "0 1px 3px rgba(15,17,40,0.07)",
} as const;

const REASONING_SECTIONS = [
  { key: "name"        as const, label: "Name",        color: "#6366f1" },
  { key: "personality" as const, label: "Personality",  color: "#7c3aed" },
  { key: "tone"        as const, label: "Tone",         color: "#2563eb" },
  { key: "avoidance"   as const, label: "Avoidance",    color: "#dc2626" },
  { key: "strategy"    as const, label: "Strategy",     color: "#059669" },
];

const CAP_COLORS: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  violet:  { dot: "#7c3aed", text: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe" },
  blue:    { dot: "#2563eb", text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  emerald: { dot: "#059669", text: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  amber:   { dot: "#d97706", text: "#b45309", bg: "#fffbeb", border: "#fde68a" },
};

const DEFAULT_CAPABILITIES: Capability[] = [
  { name: "analyze_candidate_signal",   label: "Signal Analysis",    description: "Extracts verbatim quotes from each message to determine sentiment. Nothing inferred without evidence.", color: "violet" },
  { name: "search_candidate_profile",   label: "Profile Synthesis",  description: "Builds a behavioral profile: motivators, objections, what messaging resonates vs. falls flat.",          color: "blue"   },
  { name: "get_role_market_insights",   label: "Market Intelligence", description: "Compensation benchmarks, demand dynamics, and what candidates at this seniority level optimize for.",    color: "emerald"},
  { name: "get_company_talking_points", label: "Talking Points",      description: "Non-generic angles from real company context — mission, technical challenge, team, trajectory.",         color: "amber"  },
];

const UNKNOWN_FACTS = [
  "Compensation / salary / equity",
  "Remote policy / office location",
  "Relocation support",
  "Visa sponsorship",
  "Benefits / perks",
  "Funding stage / investors",
  "Revenue / ARR / customers",
  "Team size / headcount",
  "Interview process / rounds",
  "Start date / timeline",
  "Exact responsibilities",
];

const LOADING_STEPS = ["Reading company context...", "Forming identity...", "Building outreach sequence..."];

const AUDIT_RESULT_STYLE = {
  pass:    { bg: "#f0fdf4", border: "#a7f3d0", dot: "#10b981", text: "#065f46", label: "Pass" },
  warning: { bg: "#fffbeb", border: "#fde68a", dot: "#d97706", text: "#92400e", label: "Warning" },
  fail:    { bg: "#fef2f2", border: "#fecaca", dot: "#ef4444", text: "#7f1d1d", label: "Fail" },
};

function scoreColor(score: number) {
  if (score >= 80) return { bg: "#f0fdf4", border: "#a7f3d0", text: "#065f46", label: "Audit passed" };
  if (score >= 60) return { bg: "#fffbeb", border: "#fde68a", text: "#92400e", label: "Minor issues" };
  if (score >= 40) return { bg: "#fff7ed", border: "#fed7aa", text: "#7c2d12", label: "Issues detected" };
  return { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d", label: "Critical issues" };
}

export default function AgentPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<CompanyContext | null>(null);
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResults, setAuditResults] = useState<AuditTestResult[]>([]);
  const [auditScore, setAuditScore] = useState<number | null>(null);
  const [auditError, setAuditError] = useState("");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("companyContext");
    if (!stored) { router.push("/"); return; }
    const context: CompanyContext = JSON.parse(stored);
    setCtx(context);

    let i = 0;
    const iv = setInterval(() => {
      setDone((p) => [...p, i]);
      i++;
      if (i < LOADING_STEPS.length) setStep(i);
    }, 1600);

    fetch("/api/configure", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(context) })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        clearInterval(iv);
        setCfg(data);
        localStorage.setItem("agentConfig", JSON.stringify(data));
      })
      .catch((e) => { clearInterval(iv); setError(e.message); })
      .finally(() => setLoading(false));

    return () => clearInterval(iv);
  }, [router]);

  async function runAudit() {
    if (!cfg || !ctx) return;
    setAuditLoading(true);
    setAuditResults([]);
    setAuditScore(null);
    setAuditError("");
    setExpandedIdx(null);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfig: cfg, companyContext: ctx }),
      });
      if (!res.ok || !res.body) throw new Error("Audit request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "test_result") {
              setAuditResults((prev) => [...prev, ev as AuditTestResult]);
            } else if (ev.type === "complete") {
              setAuditScore(ev.score as number);
              setAuditLoading(false);
            } else if (ev.type === "error") {
              setAuditError(ev.message as string);
              setAuditLoading(false);
            }
          } catch {}
        }
      }
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : "Audit failed");
      setAuditLoading(false);
    }
  }

  /* ── Loading ── */
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
            style={{ background: C.indigoBg, border: `1px solid ${C.indigoBorder}` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: C.indigo }} />
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: C.indigo }}>Initializing</span>
          </div>
          <p className="text-xl font-bold mb-1.5" style={{ color: C.text }}>Agent is configuring itself</p>
          <p className="text-sm" style={{ color: C.textSub }}>Reads your context, picks an identity, writes the outreach.</p>
        </div>
        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
          <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-xs font-mono ml-1" style={{ color: C.textMuted }}>agent.init</span>
          </div>
          <div className="p-5 space-y-3.5">
            {LOADING_STEPS.map((s, idx) => {
              const isDone = done.includes(idx);
              const isCurrent = step === idx && !isDone;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <span className="w-5 text-center flex-shrink-0 text-sm">
                    {isDone ? <span className="text-emerald-500">✓</span>
                    : isCurrent ? <span style={{ color: C.indigo }}>›</span>
                    : <span style={{ color: C.textMuted }}>·</span>}
                  </span>
                  <span className="text-sm font-mono" style={{ color: isDone ? C.textMuted : isCurrent ? C.text : C.textMuted }}>
                    {s}
                  </span>
                  {isCurrent && <span className="cursor-blink flex-shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );

  /* ── Error ── */
  if (error) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="rounded-2xl px-6 py-5" style={{ background: C.card, border: "1px solid #fecaca", boxShadow: C.shadow }}>
          <p className="text-red-500 font-semibold mb-1">Configuration failed</p>
          <p className="text-xs font-mono" style={{ color: C.textSub }}>{error}</p>
        </div>
        <button onClick={() => router.push("/")} className="text-sm font-medium" style={{ color: C.textMuted }}>
          ← Back to setup
        </button>
      </div>
    </main>
  );

  if (!cfg) return null;
  const caps = cfg.capabilities || DEFAULT_CAPABILITIES;

  const knownFacts = ctx ? [
    { label: "Company",  value: ctx.companyName },
    { label: "Product",  value: ctx.whatTheyDo.length > 120 ? ctx.whatTheyDo.slice(0, 120) + "…" : ctx.whatTheyDo },
    { label: "Culture",  value: ctx.culture },
    { label: "Role",     value: `${ctx.candidateProfile.jobTitle} · ${ctx.candidateProfile.seniorityLevel}` },
    { label: "Skills",   value: ctx.candidateProfile.keySkills },
    { label: "Tone",     value: ctx.tone },
  ] : [];

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

        {/* Nav */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => router.push("/")}
            className="text-sm font-medium transition-colors" style={{ color: C.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.indigo)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}>
            ← Reconfigure
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>{ctx?.companyName}</span>
        </div>

        {/* ── Identity Card ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
          <div className="px-6 pt-8 pb-6" style={{ background: "linear-gradient(180deg,#f0f1ff 0%,#ffffff 100%)", borderBottom: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-start gap-5">
              <div className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl font-bold text-white select-none"
                style={{ background: "linear-gradient(145deg,#4f46e5,#6366f1)", boxShadow: "0 8px 32px rgba(99,102,241,0.3), 0 2px 8px rgba(99,102,241,0.2)" }}>
                {cfg.agentName[0]}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.5)" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Active</span>
                </div>
                <h2 className="text-4xl font-extrabold tracking-tight leading-none mb-2" style={{ color: C.text }}>
                  {cfg.agentName}
                </h2>
                <p className="text-sm mb-3" style={{ color: C.textSub }}>
                  Autonomous Recruiting Agent · <span style={{ color: C.textMuted }}>{ctx?.companyName}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cfg.personality.traits.map((t, i) => (
                    <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, color: C.indigo }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 mt-1"
                style={{ background: C.indigoBg, border: `1px solid ${C.indigoBorder}`, color: C.indigo }}>
                {ctx?.tone}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: C.borderSoft }}>
            <div className="px-6 py-5">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>Communication style</p>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{cfg.personality.style}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>Never say</p>
              <div className="space-y-1.5">
                {cfg.personality.avoid.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0 text-red-400">—</span>
                    <span className="text-xs leading-relaxed text-red-500">{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reasoning ── */}
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: C.textMuted }}>How I decided this</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowSm }}>
            <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono ml-1" style={{ color: C.textMuted }}>agent.reasoning</span>
            </div>
            <div className="divide-y" style={{ borderColor: C.borderSoft }}>
              {REASONING_SECTIONS.map(({ key, label, color }) => (
                <div key={key} className="flex gap-5 px-5 py-4">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest w-24 flex-shrink-0 pt-0.5" style={{ color }}>
                    {label}
                  </span>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: C.textSub }}>
                    {cfg.reasoning?.[key] ?? "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Known / Unknown Facts Registry ── */}
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: C.textMuted }}>Fact registry</p>
          <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowSm }}>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: C.borderSoft }}>
              <div className="px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-emerald-700">Known facts</span>
                </div>
                <p className="text-[11px] mb-3.5" style={{ color: C.textMuted }}>Explicitly provided — agent may state these as true.</p>
                <div className="space-y-2.5">
                  {knownFacts.map((f, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-[10px] font-mono font-bold mt-0.5 w-14 flex-shrink-0 text-emerald-600">{f.label}</span>
                      <span className="text-xs leading-relaxed" style={{ color: C.textSub }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-5 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-red-600">Will not invent</span>
                </div>
                <p className="text-[11px] mb-3.5" style={{ color: C.textMuted }}>Unknown facts are treated as do-not-invent fields. Agent flags, never guesses.</p>
                <div className="flex flex-wrap gap-1.5">
                  {UNKNOWN_FACTS.map((f, i) => (
                    <span key={i} className="text-[11px] px-2 py-1 rounded-md"
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Capabilities ── */}
        <div>
          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-3 px-1" style={{ color: C.textMuted }}>Runtime tools</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {caps.map((cap) => {
              const c = CAP_COLORS[cap.color] || CAP_COLORS.blue;
              return (
                <div key={cap.name} className="rounded-xl p-4"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeftWidth: 3, borderLeftColor: c.dot }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot }} />
                    <span className="text-sm font-semibold" style={{ color: c.text }}>{cap.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-2" style={{ color: C.textSub }}>{cap.description}</p>
                  <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>{cap.name}()</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Outreach Sequence ── */}
        <div>
          <div className="flex items-start justify-between mb-4 px-1 gap-4">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
              Outreach sequence · {ctx?.candidateProfile.jobTitle}
            </p>
            <p className="text-[10px] text-right flex-shrink-0" style={{ color: C.textMuted, maxWidth: "18rem" }}>
              Suggested sequence — the live conversation adapts dynamically.
            </p>
          </div>
          <div className="space-y-3">
            {cfg.messages.map((msg, i) => (
              <div key={i} className="animate-fade-in rounded-2xl overflow-hidden"
                style={{ animationDelay: `${i * 0.08}s`, background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowSm }}>
                <div className="flex items-center gap-3 px-5 py-3" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span className="text-xs font-mono font-semibold tabular-nums" style={{ color: C.indigo }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: C.textSub }}>{msg.label}</span>
                  <div className="flex-1 h-px" style={{ background: C.borderSoft }} />
                  <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>template</span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.textSub }}>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Row ── */}
        <div className="flex items-center gap-3 pt-3 pb-4">
          <button
            onClick={runAudit}
            disabled={auditLoading}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSub, boxShadow: C.shadowSm }}>
            {auditLoading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin flex-shrink-0" />
                Auditing...
              </>
            ) : (
              <>
                <span style={{ color: C.indigo }}>◈</span>
                Run Agent Audit
              </>
            )}
          </button>
          <div className="flex-1" />
          <button onClick={() => router.push("/sandbox")}
            className="group px-7 py-3.5 text-white font-bold text-sm rounded-xl transition-all duration-150 active:scale-[0.98] flex items-center gap-2.5"
            style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.35), 0 1px 4px rgba(99,102,241,0.2)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(99,102,241,0.45), 0 2px 8px rgba(99,102,241,0.25)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(99,102,241,0.35), 0 1px 4px rgba(99,102,241,0.2)"; }}>
            Test this agent
            <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>
        </div>

        {/* ── Audit Results ── */}
        {(auditError || auditResults.length > 0) && (
          <div className="space-y-4 pb-12 animate-fade-in">
            <p className="text-[10px] font-mono font-semibold uppercase tracking-widest px-1" style={{ color: C.textMuted }}>
              Audit results · {auditResults.length}/9 tests complete
            </p>

            {/* Score banner */}
            {auditScore !== null && (() => {
              const sc = scoreColor(auditScore);
              return (
                <div className="rounded-2xl p-5 flex items-center gap-5 flex-wrap"
                  style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                  <div className="text-5xl font-black tabular-nums" style={{ color: sc.text }}>{auditScore}</div>
                  <div>
                    <p className="text-base font-bold mb-0.5" style={{ color: sc.text }}>Agent Readiness Score</p>
                    <p className="text-sm" style={{ color: sc.text, opacity: 0.75 }}>{sc.label} — out of 100</p>
                  </div>
                  <div className="ml-auto flex gap-2 flex-wrap">
                    {(["pass", "warning", "fail"] as const).map((r) => {
                      const count = auditResults.filter((x) => x.result === r).length;
                      if (count === 0) return null;
                      const st = AUDIT_RESULT_STYLE[r];
                      return (
                        <div key={r} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                          style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: st.dot }} />
                          <span className="font-semibold text-xs" style={{ color: st.text }}>{count} {st.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {auditError && (
              <div className="rounded-xl px-5 py-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <p className="text-sm text-red-600 font-medium">{auditError}</p>
              </div>
            )}

            {auditLoading && auditResults.length < 9 && (
              <div className="rounded-xl px-5 py-3 flex items-center gap-3"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <span className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 animate-spin"
                  style={{ borderColor: C.indigoBorder, borderTopColor: C.indigo }} />
                <span className="text-sm" style={{ color: C.textSub }}>
                  Running test {auditResults.length + 1} of 9...
                </span>
              </div>
            )}

            {auditResults.map((r, i) => {
              const st = AUDIT_RESULT_STYLE[r.result];
              const isExpanded = expandedIdx === i;
              return (
                <div key={i} className="rounded-2xl overflow-hidden"
                  style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadowSm }}>
                  <button
                    type="button"
                    onClick={() => setExpandedIdx(isExpanded ? null : i)}
                    className="w-full flex items-start gap-4 px-5 py-4 text-left"
                    style={{ background: isExpanded ? C.cardHeader : C.card }}>
                    <div className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: st.bg, border: `1px solid ${st.border}` }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-semibold" style={{ color: C.text }}>{r.name}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.text }}>
                          {st.label}
                        </span>
                        {r.deduction > 0 && (
                          <span className="text-[10px] font-mono text-red-500">−{r.deduction} pts</span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: C.textSub }}>{r.explanation}</p>
                    </div>
                    <span className="text-xs flex-shrink-0 mt-1 transition-transform duration-200"
                      style={{ color: C.textMuted, transform: isExpanded ? "rotate(180deg)" : "none" }}>
                      ↓
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t" style={{ borderColor: C.borderSoft }}>
                      <div className="px-5 py-4 border-b" style={{ borderColor: C.borderSoft }}>
                        <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>Candidate message</p>
                        <p className="text-sm italic" style={{ color: C.textSub }}>"{r.message}"</p>
                        <p className="text-[11px] mt-1.5" style={{ color: C.textMuted }}>{r.description}</p>
                      </div>
                      {r.reply && (
                        <div className="px-5 py-4 border-b" style={{ background: C.cardHeader, borderColor: C.borderSoft }}>
                          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>Agent reply</p>
                          <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{r.reply}</p>
                        </div>
                      )}
                      {r.agentBrain && (
                        <div className="px-5 py-4">
                          <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-3" style={{ color: C.textMuted }}>Agent brain</p>
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                            {[
                              { label: "Stage",            value: r.agentBrain.candidateStage },
                              { label: "Next action",      value: r.agentBrain.nextBestAction },
                              { label: "Fit signal",       value: r.agentBrain.candidateFitSignal },
                              { label: "Hallucination",    value: r.agentBrain.hallucinationRisk },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <p className="text-[10px] font-mono uppercase tracking-wide mb-1" style={{ color: C.textMuted }}>{label}</p>
                                <p className="text-xs font-medium" style={{ color: C.text }}>{value}</p>
                              </div>
                            ))}
                          </div>
                          {r.agentBrain.missingFacts.length > 0 && (
                            <div className="mb-3">
                              <p className="text-[10px] font-mono uppercase tracking-wide mb-1.5" style={{ color: C.textMuted }}>Missing facts flagged</p>
                              <div className="flex flex-wrap gap-1.5">
                                {r.agentBrain.missingFacts.map((f, fi) => (
                                  <span key={fi} className="text-[11px] px-2 py-0.5 rounded-md"
                                    style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {r.agentBrain.knownFactsUsed.length > 0 && (
                            <div>
                              <p className="text-[10px] font-mono uppercase tracking-wide mb-1.5" style={{ color: C.textMuted }}>Known facts used</p>
                              <div className="flex flex-wrap gap-1.5">
                                {r.agentBrain.knownFactsUsed.map((f, fi) => (
                                  <span key={fi} className="text-[11px] px-2 py-0.5 rounded-md"
                                    style={{ background: "#f0fdf4", border: "1px solid #a7f3d0", color: "#065f46" }}>
                                    {f}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
