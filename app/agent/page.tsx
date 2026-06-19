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

const C = {
  bg: "#07080f",
  card: "#0d1020",
  cardHeader: "#090c1a",
  surface: "#111527",
  border: "#1c2238",
  borderSoft: "#131828",
  text: "#eef0ff",
  textSub: "#6b7a9c",
  textMuted: "#353d58",
} as const;

const REASONING_SECTIONS = [
  { key: "name"        as const, label: "Name",        color: "#818cf8" },
  { key: "personality" as const, label: "Personality",  color: "#a78bfa" },
  { key: "tone"        as const, label: "Tone",         color: "#60a5fa" },
  { key: "avoidance"   as const, label: "Avoidance",    color: "#f87171" },
  { key: "strategy"    as const, label: "Strategy",     color: "#34d399" },
];

const CAP_COLORS: Record<string, { dot: string; text: string; bg: string; border: string; glow: string }> = {
  violet:  { dot: "#8b5cf6", text: "#a78bfa", bg: "rgba(139,92,246,0.06)",  border: "rgba(139,92,246,0.18)", glow: "rgba(139,92,246,0.12)" },
  blue:    { dot: "#3b82f6", text: "#60a5fa", bg: "rgba(59,130,246,0.06)",  border: "rgba(59,130,246,0.18)",  glow: "rgba(59,130,246,0.12)"  },
  emerald: { dot: "#10b981", text: "#34d399", bg: "rgba(16,185,129,0.06)",  border: "rgba(16,185,129,0.18)", glow: "rgba(16,185,129,0.12)"  },
  amber:   { dot: "#f59e0b", text: "#fbbf24", bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.18)",  glow: "rgba(245,158,11,0.12)"  },
};

const DEFAULT_CAPABILITIES: Capability[] = [
  { name: "analyze_candidate_signal",  label: "Signal Analysis",    description: "Extracts verbatim quotes from each message to determine sentiment. Nothing inferred without evidence.", color: "violet" },
  { name: "search_candidate_profile",  label: "Profile Synthesis",  description: "Builds a behavioral profile: motivators, objections, what messaging resonates vs. falls flat.",          color: "blue"   },
  { name: "get_role_market_insights",  label: "Market Intelligence", description: "Compensation benchmarks, demand dynamics, and what candidates at this seniority level optimize for.",    color: "emerald"},
  { name: "get_company_talking_points",label: "Talking Points",      description: "Non-generic angles from real company context — mission, technical challenge, team, trajectory.",         color: "amber"  },
];

const LOADING_STEPS = ["Reading company context...", "Forming identity...", "Building outreach sequence..."];

export default function AgentPage() {
  const router = useRouter();
  const [ctx, setCtx] = useState<CompanyContext | null>(null);
  const [cfg, setCfg] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<number[]>([]);

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

  /* ── Loading ── */
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse inline-block" />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: "#818cf8aa" }}>Initializing</span>
          </div>
          <p className="text-xl font-semibold mb-1.5" style={{ color: C.text }}>Agent is configuring itself</p>
          <p className="text-sm" style={{ color: C.textSub }}>Reads your context, picks an identity, writes the outreach.</p>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
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
                  <span className="w-5 text-center flex-shrink-0">
                    {isDone    ? <span className="text-emerald-400 text-xs">✓</span>
                     : isCurrent ? <span className="text-indigo-400">›</span>
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
        <div className="rounded-xl px-6 py-5" style={{ background: C.card, border: "1px solid rgba(248,113,113,0.2)" }}>
          <p className="text-red-400 font-medium mb-1">Configuration failed</p>
          <p className="text-xs font-mono" style={{ color: C.textSub }}>{error}</p>
        </div>
        <button onClick={() => router.push("/")} className="text-xs font-mono transition-colors" style={{ color: C.textMuted }}>
          ← Back to setup
        </button>
      </div>
    </main>
  );

  if (!cfg) return null;
  const caps = cfg.capabilities || DEFAULT_CAPABILITIES;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">

        {/* Nav */}
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => router.push("/")} className="text-xs font-mono transition-colors" style={{ color: C.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.textSub)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.textMuted)}>
            ← Reconfigure
          </button>
          <span className="text-xs font-mono uppercase tracking-widest" style={{ color: C.textMuted }}>{ctx?.companyName}</span>
        </div>

        {/* ── Identity Card ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          {/* Gradient header strip */}
          <div className="px-6 pt-8 pb-6"
            style={{ background: "linear-gradient(180deg, rgba(99,102,241,0.1) 0%, rgba(13,16,32,0) 100%)", borderBottom: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-[80px] h-[80px] rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl font-bold text-white select-none"
                style={{ background: "linear-gradient(145deg,#312e81,#4f46e5,#6366f1)", boxShadow: "0 0 40px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.12)" }}>
                {cfg.agentName[0]}
              </div>

              {/* Name + status */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" style={{ boxShadow: "0 0 8px #34d399" }} />
                  <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: "rgba(52,211,153,0.6)" }}>Active</span>
                </div>
                <h2 className="text-4xl font-bold tracking-tight leading-none mb-2"
                  style={{ background: "linear-gradient(135deg,#fff 30%,#c7d2fe 75%,#a5b4fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {cfg.agentName}
                </h2>
                <p className="text-sm mb-3" style={{ color: C.textSub }}>
                  Autonomous Recruiting Agent · <span style={{ color: C.textMuted }}>{ctx?.companyName}</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cfg.personality.traits.map((t, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", color: "#818cf8" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <span className="text-xs font-mono px-3 py-1.5 rounded-full flex-shrink-0 mt-1"
                style={{ color: "#818cf8", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)" }}>
                {ctx?.tone}
              </span>
            </div>
          </div>

          {/* Style + Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: C.borderSoft }}>
            <div className="px-6 py-5">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2.5" style={{ color: C.textMuted }}>Communication style</p>
              <p className="text-sm leading-relaxed" style={{ color: C.textSub }}>{cfg.personality.style}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2.5" style={{ color: C.textMuted }}>Never say</p>
              <div className="space-y-1.5">
                {cfg.personality.avoid.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: "rgba(248,113,113,0.4)" }}>—</span>
                    <span className="text-xs leading-relaxed" style={{ color: "rgba(248,113,113,0.55)" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reasoning ── */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-3 px-1" style={{ color: C.textMuted }}>How I decided this</p>
          <div className="rounded-xl overflow-hidden" style={{ background: "#080b18", border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-2 px-5 py-2.5" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-xs font-mono ml-1" style={{ color: C.textMuted }}>agent.reasoning</span>
            </div>
            <div className="divide-y" style={{ borderColor: "#0f1220" }}>
              {REASONING_SECTIONS.map(({ key, label, color }) => (
                <div key={key} className="flex gap-5 px-5 py-4">
                  <span className="text-[10px] font-mono uppercase tracking-widest w-24 flex-shrink-0 pt-0.5" style={{ color }}>
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

        {/* ── Capabilities ── */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-3 px-1" style={{ color: C.textMuted }}>Runtime tools</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {caps.map((cap) => {
              const c = CAP_COLORS[cap.color] || CAP_COLORS.blue;
              return (
                <div key={cap.name} className="rounded-xl p-4 transition-all duration-150"
                  style={{ background: c.bg, border: `1px solid ${c.border}`, borderLeftWidth: 3, borderLeftColor: c.dot }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.dot, boxShadow: `0 0 6px ${c.glow}` }} />
                    <span className="text-sm font-semibold" style={{ color: c.text }}>{cap.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed mb-2.5" style={{ color: C.textSub }}>{cap.description}</p>
                  <p className="text-[10px] font-mono" style={{ color: C.textMuted }}>{cap.name}()</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Outreach Sequence ── */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest mb-4 px-1" style={{ color: C.textMuted }}>
            Outreach sequence · {ctx?.candidateProfile.seniorityLevel} {ctx?.candidateProfile.jobTitle}
          </p>
          <div className="space-y-3">
            {cfg.messages.map((msg, i) => (
              <div key={i} className="animate-fade-in rounded-xl overflow-hidden" style={{ animationDelay: `${i * 0.08}s`, background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3 px-5 py-3" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span className="text-xs font-mono tabular-nums" style={{ color: "rgba(99,102,241,0.5)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-medium" style={{ color: C.textSub }}>{msg.label}</span>
                  <div className="flex-1 h-px" style={{ background: C.borderSoft }} />
                  <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>draft</span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#bcc5e0" }}>{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="flex justify-end pt-3 pb-12">
          <button
            onClick={() => router.push("/sandbox")}
            className="group px-7 py-3.5 text-white font-semibold text-sm rounded-xl transition-all duration-150 active:scale-[0.98] flex items-center gap-2.5"
            style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1,#818cf8)", boxShadow: "0 0 0 1px rgba(99,102,241,0.4), 0 6px 24px rgba(99,102,241,0.28)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 1px rgba(99,102,241,0.6), 0 10px 32px rgba(99,102,241,0.45)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 0 1px rgba(99,102,241,0.4), 0 6px 24px rgba(99,102,241,0.28)"; }}
          >
            Test this agent
            <span className="group-hover:translate-x-0.5 transition-transform duration-150">→</span>
          </button>
        </div>

      </div>
    </main>
  );
}
