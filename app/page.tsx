"use client";

import { useState } from "react";

// ─── Tokens ──────────────────────────────────────────────────────
const C = {
  bg:            "#09090b",
  surface:       "#0f0f12",
  card:          "#141417",
  border:        "#27272a",
  borderSoft:    "#1e1e22",
  text:          "#f4f4f5",
  textSub:       "#a1a1aa",
  textMuted:     "#52525b",
  accent:        "#6366f1",
  accentBg:      "rgba(99,102,241,0.1)",
  accentBorder:  "rgba(99,102,241,0.22)",
  green:         "#22c55e",
  greenBg:       "rgba(34,197,94,0.08)",
  greenBorder:   "rgba(34,197,94,0.2)",
  amber:         "#f59e0b",
  amberBg:       "rgba(245,158,11,0.08)",
  amberBorder:   "rgba(245,158,11,0.2)",
  red:           "#ef4444",
  redBg:         "rgba(239,68,68,0.08)",
  redBorder:     "rgba(239,68,68,0.2)",
} as const;

// ─── Types ────────────────────────────────────────────────────────
interface ParsedRole {
  title: string;
  seniority: string;
  location: string;
  mustHaveSkills: string[];
  niceToHave: string[];
  tone: string;
  dealbreakers: string[];
}
interface Candidate {
  id: string;
  name: string;
  title: string;
  company: string;
  score: number;
  whyMatched: string;
  skills: string[];
  risk: string;
  stage: "matched" | "outreach_sent" | "replied" | "interview_ready";
}
type StageStatus = "complete" | "active" | "queued";
interface PipelineStage {
  id: string;
  label: string;
  status: StageStatus;
  metric: string;
}

// ─── Constants ────────────────────────────────────────────────────
const EXAMPLE_INPUT =
  "Hire a senior full-stack engineer in SF. Strong React, TypeScript, AI agent experience. Startup background preferred. Tone: direct and high-agency.";

const STAGE_DEFS = [
  { id: "intake",        label: "Role Intake",    metric: "1 role defined"  },
  { id: "sourcing",      label: "Sourcing",        metric: "142 scanned"     },
  { id: "scoring",       label: "Scoring",         metric: "18 matches"      },
  { id: "outreach",      label: "Outreach",        metric: "7 drafts ready"  },
  { id: "replies",       label: "Replies",         metric: "3 predicted"     },
  { id: "qualification", label: "Qualification",   metric: "2 qualified"     },
  { id: "interview",     label: "Interview Ready", metric: "2 advancing"     },
];

// ─── Parsing ──────────────────────────────────────────────────────
function parseRole(input: string): ParsedRole {
  const lc = input.toLowerCase();

  let seniority = "Senior";
  if (lc.includes("staff") || lc.includes("principal")) seniority = "Staff";
  else if (lc.includes("lead")) seniority = "Lead";
  else if (lc.includes("junior") || lc.includes("jr")) seniority = "Junior";
  else if (lc.includes("mid")) seniority = "Mid-level";

  let location = "San Francisco, CA";
  if (lc.includes("new york") || lc.includes("nyc")) location = "New York, NY";
  else if (lc.includes("remote")) location = "Remote";
  else if (lc.includes("austin")) location = "Austin, TX";
  else if (lc.includes("seattle")) location = "Seattle, WA";
  else if (lc.includes("london")) location = "London, UK";
  else if (lc.includes("boston")) location = "Boston, MA";

  let base = "Software Engineer";
  if (lc.includes("full-stack") || lc.includes("fullstack") || lc.includes("full stack")) base = "Full-Stack Engineer";
  else if (lc.includes("frontend") || lc.includes("front-end")) base = "Frontend Engineer";
  else if (lc.includes("backend") || lc.includes("back-end")) base = "Backend Engineer";
  else if (lc.includes("ml engineer") || lc.includes("machine learning")) base = "ML Engineer";
  else if (lc.includes("data engineer")) base = "Data Engineer";
  else if (lc.includes("product manager") || lc.includes(" pm ")) base = "Product Manager";
  else if (lc.includes("devops") || lc.includes("infra engineer")) base = "Infrastructure Engineer";
  else if (lc.includes("designer") || lc.includes(" ux ")) base = "Product Designer";

  const SKILL_MAP: [string, string][] = [
    ["react",       "React"],       ["typescript",  "TypeScript"],  ["python",      "Python"],
    [" go ",        "Go"],          ["rust",        "Rust"],        ["node.js",     "Node.js"],
    ["node ",       "Node.js"],     ["next.js",     "Next.js"],     [" ai ",        "AI"],
    ["llm",         "LLM"],         ["postgres",    "Postgres"],    ["supabase",    "Supabase"],
    ["kubernetes",  "Kubernetes"],  ["graphql",     "GraphQL"],     ["aws",         "AWS"],
    ["docker",      "Docker"],      ["agent",       "Agent orchestration"],
    ["swift",       "Swift"],       ["kotlin",      "Kotlin"],      ["java ",       "Java"],
    ["redis",       "Redis"],       ["kafka",       "Kafka"],
  ];
  const skills = [...new Set(SKILL_MAP.filter(([k]) => lc.includes(k)).map(([, v]) => v))];
  const mustHaveSkills = skills.length > 0 ? skills.slice(0, 5) : ["React", "TypeScript", "Node.js"];

  let tone = "Professional";
  if (lc.includes("direct") || lc.includes("high-agency") || lc.includes("bold")) tone = "Direct";
  else if (lc.includes("warm") || lc.includes("conversational") || lc.includes("human")) tone = "Conversational";

  const dealbreakers: string[] = [];
  if (lc.includes("startup")) dealbreakers.push("No startup experience");
  dealbreakers.push("Requires relocation support");
  if (lc.includes("ai") || lc.includes("llm")) dealbreakers.push("No AI/ML exposure");

  const niceToHave: string[] = [];
  if (lc.includes("startup")) niceToHave.push("Startup / founding engineer background");
  niceToHave.push("Open source contributions", "Published writing or talks");

  return {
    title:         `${seniority} ${base}`,
    seniority,
    location,
    mustHaveSkills,
    niceToHave:    niceToHave.slice(0, 3),
    tone,
    dealbreakers:  dealbreakers.slice(0, 3),
  };
}

function getMockCandidates(role: ParsedRole): Candidate[] {
  const s = role.mustHaveSkills;
  return [
    {
      id: "1", name: "Maya Chen", title: "Senior Full-Stack Eng.", company: "Vercel", score: 94,
      whyMatched: `Strong match on ${s.slice(0, 2).join(", ")}. Shipped AI-powered surfaces. Startup arc before Vercel.`,
      skills: [...s.slice(0, 2), "Next.js", "Postgres"].slice(0, 4),
      risk: "May want staff-level scope", stage: "outreach_sent",
    },
    {
      id: "2", name: "Andre Laurent", title: "AI Product Engineer", company: "Mistral", score: 91,
      whyMatched: "Deep LLM infra experience. Full-stack capable. Open to the right early-stage role.",
      skills: [...s.slice(0, 2), "Python", "LLM"].slice(0, 4),
      risk: "Comp expectations may be high", stage: "replied",
    },
    {
      id: "3", name: "Priya Shah", title: "Founding Engineer", company: "Seed-stage startup", score: 89,
      whyMatched: "Founding eng — owns full stack, shipped from zero. Actively looking after wind-down.",
      skills: s.slice(0, 4),
      risk: "Recent company exit", stage: "interview_ready",
    },
    {
      id: "4", name: "Lucas Meyer", title: "Staff Frontend Eng.", company: "Shopify", score: 84,
      whyMatched: "Strong React/TS depth. Some backend exposure. Shopify scale gives relevant complexity.",
      skills: ["React", "TypeScript", "GraphQL", "Node.js"].slice(0, 4),
      risk: "Frontend-heavy — limited backend", stage: "matched",
    },
    {
      id: "5", name: "Sofia Ramos", title: "Senior Engineer", company: "Linear", score: 81,
      whyMatched: "Real-time collab infra at Linear. Clean code reputation. Curious about agent tooling.",
      skills: ["React", "TypeScript", "Rust", "Postgres"].slice(0, 4),
      risk: "Prefers infra-heavy work", stage: "matched",
    },
  ];
}

function generateOutreach(c: Candidate, role: ParsedRole, type: "initial" | "followup" | "objection"): string {
  const first  = c.name.split(" ")[0];
  const skills = role.mustHaveSkills.slice(0, 2).join(" and ");
  if (type === "initial") {
    return `${first} —\n\nWe're hiring a ${role.title} in ${role.location}. Your work at ${c.company} stood out — specifically the depth in ${skills}.\n\nThis is founding-level scope. You'd own the full product surface, not a feature slice.\n\nWorth 20 minutes this week?`;
  }
  if (type === "followup") {
    return `${first} —\n\nCircling back once. The role is still open and timing is actually good right now.\n\nSmall team. Real scope. Fast decisions. That's intentional.\n\nStill worth a quick call?`;
  }
  return `${first} —\n\nThat makes sense — and I'm not here to pressure you.\n\nMost people who joined teams like this weren't actively looking either. The ones who moved did it because the scope was genuinely different.\n\nWhat would have to be true for this to be worth 20 minutes?`;
}

// ─── Small components ─────────────────────────────────────────────
function Lbl({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMuted }}>
      {children}
    </p>
  );
}

function StatusDot({ status }: { status: StageStatus }) {
  if (status === "complete")
    return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.green }} />;
  if (status === "active")
    return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: C.accent }} />;
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.textMuted }} />;
}

function StageBadge({ stage }: { stage: Candidate["stage"] }) {
  const map = {
    matched:         { label: "Matched",         bg: C.accentBg, border: C.accentBorder, color: C.accent  },
    outreach_sent:   { label: "Outreach sent",   bg: C.amberBg,  border: C.amberBorder,  color: C.amber   },
    replied:         { label: "Replied",          bg: C.greenBg,  border: C.greenBorder,  color: C.green   },
    interview_ready: { label: "Interview ready", bg: C.greenBg,  border: C.greenBorder,  color: "#4ade80" },
  };
  const s = map[stage];
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 90 ? C.green : score >= 83 ? C.accent : C.amber;
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ border: `2px solid ${color}`, background: `${color}18` }}>
      <span className="text-xs font-black font-mono tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function OperatorPage() {
  const [input, setInput]               = useState("");
  const [isRunning, setIsRunning]       = useState(false);
  const [activeStages, setActiveStages] = useState(0);
  const [pipelineReady, setPipelineReady] = useState(false);
  const [parsedRole, setParsedRole]     = useState<ParsedRole | null>(null);
  const [candidates, setCandidates]     = useState<Candidate[]>([]);
  const [selected, setSelected]         = useState<Candidate | null>(null);
  const [tab, setTab]                   = useState<"initial" | "followup" | "objection">("initial");
  const [toast, setToast]               = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  async function runPipeline() {
    if (!input.trim() || isRunning) return;
    setIsRunning(true);
    setPipelineReady(false);
    setActiveStages(0);

    const role  = parseRole(input);
    const mocks = getMockCandidates(role);
    setParsedRole(role);
    setCandidates(mocks);
    setSelected(mocks[0]);
    setTab("initial");

    for (let i = 1; i <= STAGE_DEFS.length; i++) {
      await new Promise<void>((r) => setTimeout(r, 360));
      setActiveStages(i);
    }
    setIsRunning(false);
    setPipelineReady(true);
  }

  const stages: PipelineStage[] = STAGE_DEFS.map((s, i) => ({
    ...s,
    status: (
      i < activeStages
        ? (i === activeStages - 1 && !pipelineReady ? "active" : "complete")
        : "queued"
    ) as StageStatus,
  }));

  const showDash = activeStages > 0 || pipelineReady;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl"
        style={{ borderColor: C.border, background: "rgba(9,9,11,0.92)" }}>
        <div className="max-w-[1160px] mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] font-black text-white"
              style={{ background: C.accent }}>P</div>
            <span className="text-sm font-bold" style={{ color: C.text }}>PSVIEW</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
              style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent }}>
              operator
            </span>
          </div>
          <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>
            Simulation only — no real outreach is sent
          </span>
        </div>
      </header>

      <main className="max-w-[1160px] mx-auto px-6 pb-24">

        {/* Hero */}
        <section className="pt-12 pb-8 max-w-xl">
          <h1 className="text-[2.25rem] font-extrabold tracking-tight leading-tight mb-2" style={{ color: C.text }}>
            Describe the hire.
          </h1>
          <p className="text-base mb-7" style={{ color: C.textSub }}>
            The agents run the pipeline.
          </p>

          <textarea
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runPipeline(); }}
            placeholder="Hire a senior full-stack engineer in SF. Strong React, TypeScript, AI agent experience. Startup background preferred."
            className="w-full text-sm leading-relaxed rounded-xl px-4 py-3 resize-none focus:outline-none transition-colors"
            style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.accentBorder; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
          />

          <div className="flex items-center gap-3 mt-3">
            <button type="button" onClick={() => setInput(EXAMPLE_INPUT)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: C.card, border: `1px solid ${C.border}`, color: C.textSub }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.textSub; }}>
              Try example
            </button>
            <div className="flex-1" />
            <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>⌘↵</span>
            <button type="button" onClick={runPipeline}
              disabled={!input.trim() || isRunning}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: C.accent, color: "#fff" }}>
              {isRunning
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Running…</>
                : <>Run pipeline →</>}
            </button>
          </div>
        </section>

        {/* Dashboard */}
        {showDash && parsedRole && (
          <div className="space-y-4 animate-fade-in">

            {/* Row 1: Role Intelligence + Agent Team */}
            <div className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>

              {/* Role Intelligence */}
              <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2.5 px-5 py-3"
                  style={{ background: C.surface, borderBottom: `1px solid ${C.borderSoft}` }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
                    Role Intelligence
                  </span>
                  <div className="flex-1" />
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                    style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green }}>
                    Role understood.
                  </span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-5">
                    {([
                      ["Role title",  parsedRole.title],
                      ["Location",    parsedRole.location],
                      ["Seniority",   parsedRole.seniority],
                      ["Hiring tone", parsedRole.tone],
                    ] as [string, string][]).map(([label, value]) => (
                      <div key={label}>
                        <Lbl>{label}</Lbl>
                        <p className="text-sm font-semibold" style={{ color: C.text }}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <Lbl>Must-have skills</Lbl>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedRole.mustHaveSkills.map((s) => (
                        <span key={s} className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
                          style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.accent }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8">
                    <div>
                      <Lbl>Nice to have</Lbl>
                      {parsedRole.niceToHave.map((n) => (
                        <p key={n} className="text-[11px] mb-1" style={{ color: C.textSub }}>· {n}</p>
                      ))}
                    </div>
                    <div>
                      <Lbl>Dealbreakers</Lbl>
                      {parsedRole.dealbreakers.map((d) => (
                        <p key={d} className="text-[11px] mb-1" style={{ color: C.red, opacity: 0.85 }}>✕ {d}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Agent Team */}
              <div>
                <Lbl>Agent team</Lbl>
                <div className="space-y-2.5">
                  {([
                    {
                      name: "Sourcing Agent", status: "complete" as const,
                      desc: "Scanned 142 profiles across LinkedIn, GitHub, and referral signals.",
                      detail: "18 strong matches identified",
                      color: C.green, colorBg: C.greenBg, colorBorder: C.greenBorder,
                    },
                    {
                      name: "Outreach Agent", status: "active" as const,
                      desc: "Writing personalized messages based on each candidate's background.",
                      detail: "7 / 18 drafts ready",
                      color: C.accent, colorBg: C.accentBg, colorBorder: C.accentBorder,
                    },
                    {
                      name: "Qualification Agent", status: "queued" as const,
                      desc: "Handles candidate replies, screens fit, routes qualified candidates forward.",
                      detail: "Waiting for first replies",
                      color: C.textMuted, colorBg: "rgba(82,82,91,0.08)", colorBorder: "rgba(82,82,91,0.2)",
                    },
                  ]).map((ag) => (
                    <div key={ag.name} className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                          style={{ background: ag.colorBg, border: `1px solid ${ag.colorBorder}` }}>
                          {ag.status === "active"
                            ? <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: ag.color }} />
                            : ag.status === "complete"
                            ? <span className="text-[10px] font-bold" style={{ color: ag.color }}>✓</span>
                            : <span className="w-1.5 h-1.5 rounded-full" style={{ background: ag.color }} />}
                        </div>
                        <span className="text-sm font-semibold flex-1" style={{ color: C.text }}>{ag.name}</span>
                        <span className="text-[10px] font-mono capitalize px-1.5 py-0.5 rounded"
                          style={{ background: ag.colorBg, color: ag.color }}>{ag.status}</span>
                      </div>
                      <p className="text-xs leading-relaxed mb-1.5" style={{ color: C.textSub }}>{ag.desc}</p>
                      <p className="text-[11px] font-mono font-semibold" style={{ color: ag.color }}>{ag.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pipeline Timeline */}
            <div>
              <Lbl>Pipeline</Lbl>
              <div className="rounded-xl px-5 py-5 overflow-x-auto"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="flex items-start min-w-max">
                  {stages.map((stage, i) => {
                    const isLast    = i === stages.length - 1;
                    const nextReady = !isLast && stages[i + 1].status !== "queued";
                    return (
                      <div key={stage.id} className="flex items-start">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                            style={{
                              background: stage.status === "complete" ? C.greenBg
                                        : stage.status === "active"   ? C.accentBg
                                        : "rgba(39,39,42,0.5)",
                              border: `1px solid ${
                                stage.status === "complete" ? C.greenBorder
                                : stage.status === "active"  ? C.accentBorder
                                : C.borderSoft}`,
                            }}>
                            <StatusDot status={stage.status} />
                            <span className="text-[10px] font-semibold whitespace-nowrap"
                              style={{
                                color: stage.status === "complete" ? C.green
                                     : stage.status === "active"   ? C.accent
                                     : C.textMuted,
                              }}>
                              {stage.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono"
                            style={{ color: stage.status === "queued" ? C.borderSoft : C.textMuted }}>
                            {stage.status !== "queued" ? stage.metric : "—"}
                          </span>
                        </div>
                        {!isLast && (
                          <div className="flex items-center h-7 mx-2 flex-shrink-0">
                            <div className="w-8 h-px"
                              style={{ background: nextReady ? C.greenBorder : C.borderSoft }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Candidate Matches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Lbl>Candidate matches</Lbl>
                <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>
                  {candidates.length} candidates · ranked by match
                </span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
                {candidates.map((c) => {
                  const isSel = selected?.id === c.id;
                  return (
                    <button key={c.id} type="button"
                      onClick={() => { setSelected(c); setTab("initial"); }}
                      className="rounded-xl text-left p-4 transition-all duration-150"
                      style={{
                        background: isSel ? C.accentBg : C.card,
                        border: `1px solid ${isSel ? C.accentBorder : C.border}`,
                      }}>
                      <div className="flex items-start gap-2.5 mb-3">
                        <ScoreRing score={c.score} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-tight truncate" style={{ color: C.text }}>{c.name}</p>
                          <p className="text-[11px] leading-tight mt-0.5 truncate" style={{ color: C.textSub }}>{c.title}</p>
                          <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: C.textMuted }}>{c.company}</p>
                        </div>
                      </div>
                      <div className="mb-2.5"><StageBadge stage={c.stage} /></div>
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {c.skills.slice(0, 3).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                            style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, color: C.textMuted }}>
                            {s}
                          </span>
                        ))}
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: C.textSub }}>{c.whyMatched}</p>
                      {c.risk && (
                        <p className="text-[11px] mt-2 font-medium" style={{ color: C.amber }}>⚠ {c.risk}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Outreach + Reasoning */}
            {selected && (
              <div className="grid gap-4 animate-fade-in" style={{ gridTemplateColumns: "1.4fr 1fr" }}>

                {/* Left: Outreach + Simulation */}
                <div className="space-y-3">

                  {/* Outreach */}
                  <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2.5 px-5 py-3"
                      style={{ background: C.surface, borderBottom: `1px solid ${C.borderSoft}` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
                        Outreach · {selected.name}
                      </span>
                    </div>
                    <div className="flex gap-5 px-5 pt-4 border-b" style={{ borderColor: C.borderSoft }}>
                      {(["initial", "followup", "objection"] as const).map((t) => (
                        <button key={t} type="button" onClick={() => setTab(t)}
                          className="text-[11px] font-semibold pb-3 border-b-2 transition-colors"
                          style={{ color: tab === t ? C.accent : C.textMuted, borderColor: tab === t ? C.accent : "transparent" }}>
                          {t === "initial" ? "Initial message" : t === "followup" ? "Follow-up" : "Objection response"}
                        </button>
                      ))}
                    </div>
                    <div className="px-5 py-5">
                      <pre className="text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ color: C.textSub, fontFamily: "inherit" }}>
                        {generateOutreach(selected, parsedRole, tab)}
                      </pre>
                    </div>
                    <div className="px-5 pb-5 flex gap-2">
                      <button onClick={() => showToast("Simulation only — no real outreach sent")}
                        className="text-xs px-3.5 py-1.5 rounded-lg font-bold"
                        style={{ background: C.accent, color: "#fff" }}>
                        Approve outreach
                      </button>
                      <button onClick={() => showToast("Simulation only — no real action taken")}
                        className="text-xs px-3.5 py-1.5 rounded-lg font-medium"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSub }}>
                        Edit draft
                      </button>
                    </div>
                  </div>

                  {/* Reply simulation */}
                  <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="px-5 py-3" style={{ background: C.surface, borderBottom: `1px solid ${C.borderSoft}` }}>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
                        Live simulation
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <p className="text-[10px] font-mono mb-2" style={{ color: C.textMuted }}>{selected.name}</p>
                        <div className="px-4 py-3 rounded-xl text-sm leading-relaxed"
                          style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, color: C.textSub }}>
                          "Sounds interesting, but I'm not actively looking right now."
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono mb-2">
                          <span style={{ color: C.accent }}>Qualification Agent</span>
                          <span style={{ color: C.textMuted }}> · handling objection</span>
                        </p>
                        <div className="px-4 py-3 rounded-xl text-sm leading-relaxed"
                          style={{ background: C.accentBg, border: `1px solid ${C.accentBorder}`, color: C.textSub }}>
                          That makes sense — and I&apos;m not here to pressure you. Most people who&apos;ve joined teams like this weren&apos;t actively looking either. The ones who moved did it because the scope was genuinely different. What would have to be true for this to be worth 20 minutes?
                        </div>
                      </div>
                      <button onClick={() => showToast("Simulation only — no real action taken")}
                        className="w-full text-xs py-2 rounded-lg font-medium"
                        style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.textSub }}>
                        Advance to interview →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Brain + Guardrails + Actions */}
                <div className="space-y-3">

                  {/* Agent Brain */}
                  <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2.5 px-5 py-3"
                      style={{ background: C.surface, borderBottom: `1px solid ${C.borderSoft}` }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
                        Agent Brain
                      </span>
                    </div>
                    <div className="p-5 space-y-3">
                      {([
                        ["Candidate intent",   "Cautious interest", C.amber  ],
                        ["Next action",        "Handle objection",  C.accent ],
                        ["Candidate stage",    "Curious",           C.textSub],
                        ["Fit signal",         "Strong",            C.green  ],
                        ["Hallucination risk", "Low",               C.green  ],
                      ] as [string, string, string][]).map(([label, value, color]) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className="text-[11px] font-mono" style={{ color: C.textMuted }}>{label}</span>
                          <span className="text-[11px] font-semibold" style={{ color }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Guardrails */}
                  <div className="rounded-xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <div className="px-5 py-3" style={{ background: C.surface, borderBottom: `1px solid ${C.borderSoft}` }}>
                      <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: C.textMuted }}>
                        Guardrails
                      </span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <Lbl>Known facts used</Lbl>
                        <div className="flex flex-wrap gap-1.5">
                          {["Role title", "Skills", "Company tone", "Candidate signals"].map((f) => (
                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-md"
                              style={{ background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Lbl>Will not invent</Lbl>
                        <div className="flex flex-wrap gap-1.5">
                          {["Compensation", "Remote policy", "Visa", "Benefits"].map((f) => (
                            <span key={f} className="text-[10px] px-2 py-0.5 rounded-md"
                              style={{ background: C.redBg, border: `1px solid ${C.redBorder}`, color: C.red }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] leading-relaxed pt-1 border-t"
                        style={{ borderColor: C.borderSoft, color: C.textSub }}>
                        <span style={{ color: C.amber }}>⚡ Active</span> — agent flags missing info, never guesses.
                      </p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="rounded-xl p-4" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                    <Lbl>Actions</Lbl>
                    <div className="space-y-1.5">
                      {([
                        ["Approve all outreach",   "Run 7 drafts"],
                        ["Advance to interview",   selected.name.split(" ")[0]],
                        ["Reject candidate",       "Remove from pipeline"],
                        ["Export pipeline report", "Download CSV"],
                      ] as [string, string][]).map(([label, sub]) => (
                        <button key={label} type="button"
                          onClick={() => showToast("Simulation only — no real action taken")}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all"
                          style={{ background: C.surface, border: `1px solid ${C.borderSoft}`, color: C.textSub }}
                          onMouseEnter={(e) => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.borderColor = C.border; b.style.color = C.text;
                          }}
                          onMouseLeave={(e) => {
                            const b = e.currentTarget as HTMLButtonElement;
                            b.style.borderColor = C.borderSoft; b.style.color = C.textSub;
                          }}>
                          <span>{label}</span>
                          <span className="font-mono text-[10px]" style={{ color: C.textMuted }}>{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="px-4 py-2.5 rounded-xl text-sm font-medium"
            style={{
              background: C.card, border: `1px solid ${C.border}`, color: C.textSub,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
