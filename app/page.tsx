"use client";

import { useState, useEffect, useRef } from "react";

type ScanLine =
  | { kind: "dim";    text: string; delay: number }
  | { kind: "label";  text: string; delay: number }
  | { kind: "url";    text: string; score: number; delay: number }
  | { kind: "spacer"; delay: number }
  | { kind: "done";   text: string; delay: number };

const SCAN_LINES: ScanLine[] = [
  { kind: "dim",    text: "parsing role...",                              delay: 0    },
  { kind: "label",  text: "→ Senior Full-Stack Engineer · San Francisco",  delay: 340  },
  { kind: "dim",    text: "→ React, TypeScript, AI agents",               delay: 620  },
  { kind: "spacer",                                                         delay: 820  },
  { kind: "dim",    text: "scanning talent graph...",                     delay: 960  },
  { kind: "url",    text: "linkedin.com/in/maya-chen-eng",    score: 94,  delay: 1240 },
  { kind: "url",    text: "linkedin.com/in/andrelaurent-ai",  score: 91,  delay: 1500 },
  { kind: "url",    text: "linkedin.com/in/priyashah-dev",    score: 89,  delay: 1760 },
  { kind: "url",    text: "github.com/lucasmeyer-fe",         score: 84,  delay: 2000 },
  { kind: "url",    text: "github.com/danielokafor-ai",       score: 82,  delay: 2220 },
  { kind: "spacer",                                                         delay: 2400 },
  { kind: "dim",    text: "scoring candidates...",                         delay: 2520 },
  { kind: "dim",    text: "writing outreach sequences...",                 delay: 2860 },
  { kind: "spacer",                                                         delay: 3120 },
  { kind: "done",   text: "5 candidates ready.",                           delay: 3280 },
];

const CANDIDATES = [
  {
    id: "maya", name: "Maya Chen", co: "Vercel", title: "Senior Full-Stack Eng.", score: 94, stage: "Outreach sent",
    msg: `Maya —\n\nNoticed your work on Vercel's DX layer. We're building autonomous agents that replace the entire manual recruiting loop at PSVIEW — sourcing, qualifying, placing.\n\nFounding-level scope. Small team. Real customers.\n\nWorth 20 minutes?`,
    fu:  `Maya —\n\nCircling back once. First agents shipped, first customers live.\n\n20 minutes?`,
    obj: `Totally fair. The reason it may still be worth a look: you'd own the agent layer replacing manual staffing ops — not a roadmap.\n\nWhat would have to be true for the conversation to feel worth it?`,
  },
  {
    id: "andre", name: "Andre Laurent", co: "Mistral", title: "AI Product Engineer", score: 91, stage: "Replied",
    msg: `Andre —\n\nMistral's agentic work got my attention. We're building agents that actually run the staffing pipeline at PSVIEW — not an AI wrapper.\n\nYou'd be a key early engineer. Curious if this lands?`,
    fu:  `Andre —\n\nThe scope is wider than most AI roles: you'd ship core agent workflows, not contribute to a backlog.\n\n20 minutes?`,
    obj: `Makes sense — real momentum at Mistral.\n\nAt PSVIEW: founding-level impact on actual revenue, not a research metric. Different feedback loop.\n\nWhat's the bigger blocker — stage, scope, or timing?`,
  },
  {
    id: "priya", name: "Priya Shah", co: "Seed-stage startup", title: "Founding Engineer", score: 89, stage: "Interview ready",
    msg: `Priya —\n\nFounding eng background, TypeScript, customer-facing systems — exactly the profile.\n\nPSVIEW is building the autonomous agent layer for staffing. Core engineer, building from scratch, real customers.\n\nWorth a call?`,
    fu:  `Priya —\n\nRole's open. Moving into customers. Need someone who ships across the stack.\n\nInterested?`,
    obj: `You've built in founding-mode before — you know the bar.\n\nReal ownership: agents in production, customers using them, your fingerprints on core architecture.\n\nWhat matters most in your next role?`,
  },
  {
    id: "lucas", name: "Lucas Meyer", co: "Shopify", title: "Staff Frontend Eng.", score: 84, stage: "Matched",
    msg: `Lucas —\n\nShopify frontend architecture stands out. We're React-heavy at PSVIEW but the product is AI agents running staffing pipelines.\n\nFrontend here means agent control interfaces, real-time pipeline views.\n\nWould that scope interest you?`,
    fu:  `Lucas —\n\nAgent dashboards, real-time views, AI workflow design. Broad scope.\n\n15 minutes?`,
    obj: `Shopify is a strong place to be.\n\nAt PSVIEW you'd be the frontend architect. Small team, high ownership, shipping weekly.\n\nWhat would move the needle?`,
  },
  {
    id: "daniel", name: "Daniel Okafor", co: "Scale AI", title: "Full-Stack AI Eng.", score: 82, stage: "Matched",
    msg: `Daniel —\n\nScale AI eval systems and backend infra caught my eye. PSVIEW needs engineers who build reliable AI systems — not just wrap LLMs.\n\nWant to compare notes?`,
    fu:  `Daniel —\n\nAgent orchestration, pipeline reliability, LLM integration — closer to infra-for-AI.\n\nWorth a call?`,
    obj: `Scale AI is a strong signal — you've shipped real AI infra.\n\nAt PSVIEW the backend owns the agent loop running live staffing ops. Correctness and judgment over raw scale.\n\nWould that problem be interesting?`,
  },
];

interface ThreadMsg { from: "agent" | "candidate" | "system"; text: string; time: string; label?: string; guardrail?: boolean }

const THREADS: Record<string, ThreadMsg[]> = {
  maya: [
    { from: "agent",     label: "Outreach Agent",       time: "09:41",  text: "Maya — noticed your work on Vercel's DX layer. We're building autonomous agents that replace the entire manual recruiting loop at PSVIEW. Founding-level scope. Small team. Real customers. Worth 20 minutes?" },
    { from: "candidate",                                 time: "09:44",  text: "Sounds interesting, but I'm not actively looking right now." },
    { from: "system",                                    time: "09:44",  text: "Qualification Agent analyzing intent... objection detected → responding" },
    { from: "agent",     label: "Qualification Agent",  time: "09:44",  text: "Totally fair — not here to pull you away from something good. The reason it may still be worth a look: you'd own the agent layer replacing manual staffing ops, not a roadmap. What would have to be true for this to feel worth it?" },
    { from: "candidate",                                 time: "09:47",  text: "What does the scope actually look like day-to-day?" },
    { from: "agent",     label: "Qualification Agent",  time: "09:47",  text: "Core agent workflows: sourcing, matching, outreach. Full stack. First 6 months is 80% building, 20% talking to customers. Small team, weekly releases." },
    { from: "candidate",                                 time: "09:49",  text: "Ok. Send me some times that work." },
    { from: "system",                                    time: "09:49",  text: "Advancing Maya Chen to interview stage. Preparing client brief..." },
  ],
  andre: [
    { from: "agent",     label: "Outreach Agent",       time: "09:41",  text: "Andre — Mistral's agentic work got my attention. We're building agents that actually run the staffing pipeline at PSVIEW — not an AI wrapper. You'd be a key early engineer. Curious if this lands?" },
    { from: "candidate",                                 time: "09:55",  text: "This is interesting. What stage is the company at?" },
    { from: "system",                                    time: "09:55",  text: "Qualification Agent analyzing... stage question → responding" },
    { from: "agent",     label: "Qualification Agent",  time: "09:55",  text: "Pre-seed, first customers live. Looking for a 2nd engineer alongside the founder to own core agent infrastructure." },
    { from: "candidate",                                 time: "09:57",  text: "What's the comp range?" },
    { from: "system",                                    time: "09:57",  text: "Guardrail triggered — compensation unknown. Flagged for human review.", guardrail: true },
  ],
  priya: [
    { from: "agent",     label: "Outreach Agent",       time: "09:41",  text: "Priya — founding eng background, TypeScript, customer-facing systems. Exactly the profile. PSVIEW is building the autonomous agent layer for staffing. Core engineer from scratch, real customers. Worth a call?" },
    { from: "candidate",                                 time: "09:43",  text: "This sounds interesting. What's the founding team like?" },
    { from: "system",                                    time: "09:43",  text: "Qualification Agent analyzing... team question → responding" },
    { from: "agent",     label: "Qualification Agent",  time: "09:43",  text: "Solo technical founder. Shipped first agent last month. First customers paying. Looking for someone to own the full stack alongside them." },
    { from: "candidate",                                 time: "09:45",  text: "What's the timeline to start?" },
    { from: "agent",     label: "Qualification Agent",  time: "09:45",  text: "ASAP — ideally within 3–4 weeks. Flexible on exact date." },
    { from: "candidate",                                 time: "09:46",  text: "Let's talk. What times work this week?" },
    { from: "system",                                    time: "09:46",  text: "Interview scheduled — Thursday 2pm PT. Client brief sent." },
  ],
  lucas: [
    { from: "agent",     label: "Outreach Agent",       time: "09:41",  text: "Lucas — Shopify frontend architecture stands out. At PSVIEW the product is AI agents running staffing pipelines. Frontend means agent control interfaces and real-time pipeline views. Would that scope interest you?" },
    { from: "system",                                    time: "09:41",  text: "Awaiting reply — sent 2h ago" },
  ],
  daniel: [
    { from: "agent",     label: "Outreach Agent",       time: "09:41",  text: "Daniel — Scale AI eval systems and backend infra caught my eye. PSVIEW needs engineers who build reliable AI systems, not just wrap LLMs. Want to compare notes?" },
    { from: "system",                                    time: "09:41",  text: "Awaiting reply — sent 4h ago" },
  ],
};

const STAGES = ["Role Intake", "Sourcing", "Matching", "Outreach", "Qualification", "Client Shortlist"];
const STAGE_STATUS: ("done" | "active" | "queued")[] = ["done", "done", "done", "active", "active", "queued"];

const CHIPS = ["Founding Engineer · SF", "Healthcare ML Eng. · Boston", "Senior Recruiter · France", "GTM Lead · NYC"];

type Tab = "msg" | "fu" | "obj";

export default function Page() {
  const [phase, setPhase]   = useState<"idle" | "scanning" | "live">("idle");
  const [input, setInput]   = useState("");
  const [visible, setVisible] = useState(0);
  const [sel, setSel]       = useState(CANDIDATES[0]);
  const [tab, setTab]       = useState<Tab>("msg");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function launch(text?: string) {
    if (phase !== "idle") return;
    if (text) setInput(text);
    setVisible(0);
    setPhase("scanning");
  }

  useEffect(() => {
    if (phase !== "scanning") return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    SCAN_LINES.forEach((line, i) => {
      const t = setTimeout(() => setVisible(i + 1), line.delay);
      timers.current.push(t);
    });
    const done = setTimeout(() => setPhase("live"), SCAN_LINES[SCAN_LINES.length - 1].delay + 700);
    timers.current.push(done);
    return () => timers.current.forEach(clearTimeout);
  }, [phase]);

  /* ── SCANNING ── */
  if (phase === "scanning") return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-geist-mono), monospace" }}>
      <div style={{ width: 420, display: "flex", flexDirection: "column" }}>
        <Logo />
        <div style={{ marginTop: 44 }}>
          {SCAN_LINES.slice(0, visible).map((line, i) => {
            if (line.kind === "spacer") return <div key={i} style={{ height: 12 }} />;
            if (line.kind === "url") return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animation: "lineIn 0.2s ease both", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#6b7280" }}>&nbsp;&nbsp;{line.text}</span>
                <span style={{ fontSize: 12, color: "#10b981", fontWeight: 700, marginLeft: 16, whiteSpace: "nowrap" as const }}>✓ {line.score}</span>
              </div>
            );
            if (line.kind === "done") return (
              <div key={i} style={{ animation: "lineIn 0.22s ease both", marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#4f46e5" }}>{line.text}</span>
              </div>
            );
            if (line.kind === "label") return (
              <div key={i} style={{ animation: "lineIn 0.2s ease both", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>{line.text}</span>
              </div>
            );
            return (
              <div key={i} style={{ animation: "lineIn 0.2s ease both", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>{line.text}</span>
              </div>
            );
          })}
          {visible < SCAN_LINES.length && (
            <span style={{ display: "inline-block", width: 7, height: 15, background: "#4f46e5", marginLeft: 2, borderRadius: 2, verticalAlign: "middle", animation: "blink 1s step-end infinite", marginTop: 4 }} />
          )}
        </div>
      </div>
      <style>{`@keyframes lineIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );

  /* ── HERO ── */
  if (phase === "idle") return (
    <div style={hero}>
      <div style={heroInner}>
        <Logo />
        <h1 style={h1}>Describe the role.<br />PSVIEW runs the pipeline.</h1>
        <p style={sub}>Autonomous agents source, engage, qualify, and place talent — end to end.</p>

        <textarea
          rows={3} value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) launch(); }}
          placeholder="Find me 3 senior full-stack engineers in SF with React, TypeScript, and AI agent experience."
          style={inputStyle}
          onFocus={e => { e.currentTarget.style.borderColor = "#4f46e5"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "#e4e4e7"; }}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 12 }}>
          {CHIPS.map(c => (
            <button key={c} onClick={() => launch(c)} style={chipStyle}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#4f46e5"; (e.currentTarget as HTMLButtonElement).style.color = "#4f46e5"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e4e4e7"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; }}>
              {c}
            </button>
          ))}
        </div>

        <button onClick={() => launch()} disabled={!input.trim()} style={{ ...btnStyle, opacity: !input.trim() ? 0.4 : 1 }}>
          Launch agents →
        </button>

        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 16, fontFamily: "var(--font-geist-mono)" }}>
          Simulation only — no real candidates are contacted
        </p>
      </div>
    </div>
  );

  /* ── DASHBOARD ── */
  return (
    <div style={{ background: "#fafafa", minHeight: "100vh", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e4e4e7", position: "sticky", top: 0, zIndex: 30 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 48, display: "flex", alignItems: "center", gap: 16 }}>
          <Logo />
          <div style={{ width: 1, height: 16, background: "#e4e4e7" }} />
          <span style={{ fontSize: 13, color: "#111", fontWeight: 600 }}>Senior Full-Stack Engineer · San Francisco</span>
          <div style={{ flex: 1 }} />
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#10b981" }}>Pipeline live</span>
          </span>
          <button onClick={() => { setPhase("idle"); setInput(""); setVisible(0); }} style={{ fontSize: 12, color: "#9ca3af", background: "none", border: "none", cursor: "pointer" }}>
            ← Start over
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 80px" }}>

        {/* Pipeline */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, padding: "16px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {STAGES.map((s, i) => {
              const st = STAGE_STATUS[i];
              const isLast = i === STAGES.length - 1;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block",
                      background: st === "done" ? "#10b981" : st === "active" ? "#4f46e5" : "#d4d4d8",
                    }} />
                    <span style={{ fontSize: 12, fontWeight: st === "active" ? 600 : 400, color: st === "queued" ? "#a1a1aa" : st === "active" ? "#4f46e5" : "#111" }}>
                      {s}
                    </span>
                  </div>
                  {!isLast && <span style={{ margin: "0 10px", color: "#d4d4d8", fontSize: 12 }}>→</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidates + Outreach */}
        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

          {/* Candidates */}
          <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>
                Top Matches
              </span>
            </div>
            {CANDIDATES.map(c => {
              const isSel = sel.id === c.id;
              const scoreColor = c.score >= 90 ? "#10b981" : c.score >= 85 ? "#4f46e5" : "#f59e0b";
              return (
                <button key={c.id} onClick={() => { setSel(c); setTab("msg"); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: isSel ? "#f5f5ff" : "#fff", border: "none", borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer", textAlign: "left" as const, transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = "#f9f9f9"; }}
                  onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}>
                  {/* Score */}
                  <span style={{ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${scoreColor}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: scoreColor, fontFamily: "var(--font-geist-mono)" }}>{c.score}</span>
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{c.name}</span>
                      <span style={{ fontSize: 10, color: c.stage === "Interview ready" ? "#10b981" : c.stage === "Replied" ? "#4f46e5" : c.stage === "Outreach sent" ? "#f59e0b" : "#9ca3af", fontWeight: 600 }}>
                        {c.stage}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "#6b7280" }}>{c.co}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Outreach */}
          <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Outreach Agent</span>
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>· {sel.name}</span>
              </div>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 4 }}>
                {([["msg","Initial"],["fu","Follow-up"],["obj","Objection"]] as [Tab, string][]).map(([t, label]) => (
                  <button key={t} onClick={() => setTab(t)}
                    style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", background: tab === t ? "#4f46e5" : "transparent", color: tab === t ? "#fff" : "#9ca3af", transition: "all 0.1s" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: "24px 24px 16px" }}>
              <pre style={{ fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", fontFamily: "var(--font-sans), system-ui", color: "#374151", margin: 0 }}>
                {sel[tab]}
              </pre>
            </div>
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 8 }}>
              <button style={{ fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 8, border: "none", background: "#4f46e5", color: "#fff", cursor: "pointer" }}>
                Approve outreach
              </button>
              <button style={{ fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 8, border: "1px solid #e4e4e7", background: "#fff", color: "#6b7280", cursor: "pointer" }}>
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* ── Live Thread ── */}
        <div style={{ background: "#fff", border: "1px solid #e4e4e7", borderRadius: 12, overflow: "hidden", marginTop: 20 }}>
          <div style={{ padding: "12px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 2s infinite", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Live Thread</span>
            <span style={{ fontSize: 12, color: "#6b7280" }}>· {sel.name}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "#9ca3af", fontFamily: "var(--font-geist-mono)" }}>autonomous conversation</span>
          </div>
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12, maxHeight: 360, overflowY: "auto" as const }}>
            {(THREADS[sel.id] ?? []).map((msg, i) => {
              if (msg.from === "system") return (
                <div key={i} style={{ display: "flex", justifyContent: "center" }}>
                  <span style={{
                    fontSize: 11, color: msg.guardrail ? "#ef4444" : "#9ca3af",
                    background: msg.guardrail ? "#fef2f2" : "#f9f9f9",
                    border: `1px solid ${msg.guardrail ? "#fecaca" : "#f0f0f0"}`,
                    borderRadius: 20, padding: "3px 12px",
                    fontFamily: "var(--font-geist-mono)",
                  }}>
                    {msg.guardrail ? "⚠ " : ""}{msg.text}
                  </span>
                </div>
              );
              const isAgent = msg.from === "agent";
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isAgent ? "flex-end" : "flex-start" }}>
                  {msg.label && (
                    <span style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4, marginRight: isAgent ? 4 : 0, marginLeft: isAgent ? 0 : 4, fontFamily: "var(--font-geist-mono)" }}>
                      {msg.label} · {msg.time}
                    </span>
                  )}
                  {!msg.label && (
                    <span style={{ fontSize: 10, color: "#9ca3af", marginBottom: 4, marginLeft: isAgent ? 0 : 4, fontFamily: "var(--font-geist-mono)" }}>
                      {sel.name} · {msg.time}
                    </span>
                  )}
                  <div style={{
                    maxWidth: "72%", padding: "10px 14px", borderRadius: isAgent ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: isAgent ? "#4f46e5" : "#f4f4f5",
                    color: isAgent ? "#fff" : "#111",
                    fontSize: 13, lineHeight: 1.55,
                  }}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        main > * { animation: fadeUp 0.4s ease both; }
        main > *:nth-child(2) { animation-delay: 0.06s; }
        main > *:nth-child(3) { animation-delay: 0.12s; }
      `}</style>
    </div>
  );
}

/* ── Shared styles ── */
const hero: React.CSSProperties = {
  minHeight: "100vh", background: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "var(--font-sans), system-ui, sans-serif",
};
const heroInner: React.CSSProperties = {
  width: "100%", maxWidth: 560, padding: "0 24px", display: "flex", flexDirection: "column",
};
const h1: React.CSSProperties = {
  fontSize: "2.6rem", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1,
  color: "#0f0f10", margin: "28px 0 12px",
};
const sub: React.CSSProperties = {
  fontSize: 15, color: "#6b7280", marginBottom: 28, lineHeight: 1.5,
};
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "14px 16px", borderRadius: 10, border: "1px solid #e4e4e7",
  fontSize: 14, color: "#111", fontFamily: "inherit", resize: "none", outline: "none",
  background: "#fafafa", lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.15s",
};
const chipStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, padding: "5px 12px", borderRadius: 20, border: "1px solid #e4e4e7",
  background: "#fff", color: "#6b7280", cursor: "pointer", transition: "all 0.1s",
};
const btnStyle: React.CSSProperties = {
  marginTop: 16, width: "100%", padding: "13px", borderRadius: 10, border: "none",
  background: "#4f46e5", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
  transition: "opacity 0.15s",
};

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "#fff" }}>P</div>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#374151", letterSpacing: "-0.01em" }}>PSVIEW</span>
    </div>
  );
}
