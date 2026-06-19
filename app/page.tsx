"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "Professional" | "Conversational" | "Bold";

const TONES: { value: Tone; label: string; descriptor: string }[] = [
  { value: "Professional", label: "Professional", descriptor: "Crisp, warm, precise." },
  { value: "Conversational", label: "Conversational", descriptor: "Human, loose, real." },
  { value: "Bold", label: "Bold", descriptor: "Direct, no hedging." },
];

const C = {
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
  shadow: "0 1px 4px rgba(15,17,40,0.05), 0 4px 16px rgba(15,17,40,0.04)",
  shadowSm: "0 1px 3px rgba(15,17,40,0.06)",
} as const;

function Section({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
      <div className="flex items-center gap-3 px-5 py-3" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md font-semibold"
          style={{ color: C.indigo, background: C.indigoBg, border: `1px solid ${C.indigoBorder}` }}>
          {num}
        </span>
        <span className="text-xs font-semibold tracking-wide" style={{ color: C.textSub }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Row({ error, children, divider }: { error?: string; children: React.ReactNode; divider?: boolean }) {
  return (
    <>
      {divider && <div className="h-px mx-5" style={{ background: C.borderSoft }} />}
      <div className="px-5 py-3.5">
        {children}
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
      </div>
    </>
  );
}

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "", whatTheyDo: "", culture: "",
    jobTitle: "", seniorityLevel: "", keySkills: "",
    tone: "" as Tone | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.whatTheyDo.trim()) e.whatTheyDo = "Required";
    if (!form.culture.trim()) e.culture = "Required";
    if (!form.jobTitle.trim()) e.jobTitle = "Required";
    if (!form.seniorityLevel.trim()) e.seniorityLevel = "Required";
    if (!form.keySkills.trim()) e.keySkills = "Required";
    if (!form.tone) e.tone = "Select a tone";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    localStorage.setItem("companyContext", JSON.stringify({
      companyName: form.companyName.trim(), whatTheyDo: form.whatTheyDo.trim(),
      culture: form.culture.trim(),
      candidateProfile: { jobTitle: form.jobTitle.trim(), seniorityLevel: form.seniorityLevel.trim(), keySkills: form.keySkills.trim() },
      tone: form.tone,
    }));
    router.push("/agent");
  }

  function field(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  const inp = "w-full bg-transparent text-sm focus:outline-none placeholder-[#c0c6d9]";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">

        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8"
            style={{ background: C.indigoBg, border: `1px solid ${C.indigoBorder}` }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.indigo }} />
            <span className="text-[11px] font-semibold tracking-wide" style={{ color: C.indigo }}>Recruiting Agent</span>
          </div>

          <h1 className="text-[3.5rem] font-extrabold tracking-tight leading-[1.02] mb-3" style={{ color: C.text }}>
            Brief the agent.
          </h1>
          <p className="text-2xl font-bold mb-5 leading-snug"
            style={{ background: "linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            It does the rest.
          </p>
          <p className="text-base leading-relaxed" style={{ color: C.textSub, maxWidth: "26rem" }}>
            Give it your company, culture, and role. It builds its own identity and writes the outreach.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Company */}
          <Section num="01" label="Company">
            <Row error={errors.companyName}>
              <input type="text" placeholder="Company name" className={inp} style={{ color: C.text }}
                value={form.companyName} onChange={(e) => field("companyName", e.target.value)} />
            </Row>
            <Row error={errors.whatTheyDo} divider>
              <textarea rows={3} placeholder="What do they build? Be specific — the agent reads this literally."
                className={`${inp} resize-none leading-relaxed`} style={{ color: C.text }}
                value={form.whatTheyDo} onChange={(e) => field("whatTheyDo", e.target.value)} />
            </Row>
          </Section>

          {/* Culture */}
          <Section num="02" label="Culture">
            <Row error={errors.culture}>
              <input type="text" placeholder="e.g. Fast-paced, remote-first, low ego, high ownership" className={inp} style={{ color: C.text }}
                value={form.culture} onChange={(e) => field("culture", e.target.value)} />
            </Row>
          </Section>

          {/* Role */}
          <Section num="03" label="Hire for">
            {[
              { key: "jobTitle",       ph: "Job title — e.g. Senior Software Engineer" },
              { key: "seniorityLevel", ph: "Seniority — e.g. Senior, Staff, Principal" },
              { key: "keySkills",      ph: "Key skills — e.g. Rust, distributed systems, leadership" },
            ].map(({ key, ph }, i) => (
              <Row key={key} error={errors[key]} divider={i > 0}>
                <input type="text" placeholder={ph} className={inp} style={{ color: C.text }}
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => field(key, e.target.value)} />
              </Row>
            ))}
          </Section>

          {/* Tone */}
          <Section num="04" label="Tone">
            <div className="p-3 grid grid-cols-3 gap-2">
              {TONES.map((t) => {
                const sel = form.tone === t.value;
                return (
                  <button key={t.value} type="button"
                    onClick={() => { setForm((f) => ({ ...f, tone: t.value })); if (errors.tone) setErrors((e) => ({ ...e, tone: "" })); }}
                    className="flex flex-col items-start px-4 py-4 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: sel ? C.indigoBg : C.cardHeader,
                      border: `1px solid ${sel ? C.indigo : C.border}`,
                      boxShadow: sel ? `0 0 0 3px rgba(99,102,241,0.1)` : C.shadowSm,
                    }}>
                    <span className="text-sm font-semibold mb-1" style={{ color: sel ? C.indigo : C.text }}>{t.label}</span>
                    <span className="text-[11px] leading-relaxed" style={{ color: sel ? "#818cf8" : C.textMuted }}>{t.descriptor}</span>
                  </button>
                );
              })}
            </div>
            {errors.tone && <p className="px-5 pb-3 text-xs text-red-500">{errors.tone}</p>}
          </Section>

          {/* CTA */}
          <div className="pt-1 space-y-3">
            <button type="submit"
              className="w-full py-4 rounded-xl font-bold text-white text-sm tracking-wide transition-all duration-200 active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", boxShadow: "0 4px 16px rgba(99,102,241,0.35), 0 1px 4px rgba(99,102,241,0.2)" }}>
              Brief the agent →
            </button>
            <p className="text-center text-xs" style={{ color: C.textMuted }}>
              Configures itself autonomously · takes ~5 seconds
            </p>
          </div>
        </form>

      </div>
    </main>
  );
}
