"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "Professional" | "Conversational" | "Bold";

const TONES: { value: Tone; label: string; descriptor: string }[] = [
  { value: "Professional", label: "Professional", descriptor: "Crisp, warm, precise." },
  { value: "Conversational", label: "Conversational", descriptor: "Human, loose, real." },
  { value: "Bold", label: "Bold", descriptor: "Direct, no hedging." },
];

/* ── shared tokens ── */
const C = {
  card: "#0d1020",
  cardHeader: "#090c1a",
  border: "#1c2238",
  borderSoft: "#131828",
  input: "#0a0c18",
  textSecondary: "#6b7a9c",
  textMuted: "#2e3650",
  indigo: "#6366f1",
  indigoLight: "#818cf8",
} as const;

function Section({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3 px-5 py-3" style={{ background: C.cardHeader, borderBottom: `1px solid ${C.borderSoft}` }}>
        <span
          className="text-[10px] font-mono tabular-nums px-2 py-0.5 rounded-md"
          style={{ color: C.indigoLight, background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.15)" }}
        >
          {num}
        </span>
        <span className="text-xs font-medium tracking-wide" style={{ color: C.textSecondary }}>{label}</span>
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
        {error && <p className="mt-1.5 text-xs" style={{ color: "#f87171aa" }}>{error}</p>}
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

  const inp = `w-full bg-transparent text-sm text-[#eef0ff] placeholder-[#252e48] focus:outline-none`;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">

        {/* ── Hero ── */}
        <div className="mb-12">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.22)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: C.indigoLight }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: "#818cf8aa" }}>
              Recruiting Agent
            </span>
          </div>
          <h1
            className="text-[3.25rem] font-bold tracking-tight leading-[1.05] mb-2"
            style={{ background: "linear-gradient(140deg,#ffffff 20%,#c7d2fe 65%,#a5b4fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            Brief the agent.
          </h1>
          <p
            className="text-2xl font-semibold mb-5 leading-snug"
            style={{ background: "linear-gradient(135deg,#818cf8 0%,#6366f1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            It does the rest.
          </p>
          <p className="text-[15px] leading-relaxed max-w-md" style={{ color: "#4a5580" }}>
            Give it your company context, the role, and a tone. It picks a name, builds its personality, and writes the outreach.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2.5">

          {/* Company */}
          <Section num="01" label="Company">
            <Row error={errors.companyName}>
              <input type="text" placeholder="Company name" className={inp}
                value={form.companyName} onChange={(e) => field("companyName", e.target.value)} />
            </Row>
            <Row error={errors.whatTheyDo} divider>
              <textarea rows={3} placeholder="What do they build? The agent reads this literally — be specific about the product and market."
                className={`${inp} resize-none leading-relaxed`}
                value={form.whatTheyDo} onChange={(e) => field("whatTheyDo", e.target.value)} />
            </Row>
          </Section>

          {/* Culture */}
          <Section num="02" label="Culture">
            <Row error={errors.culture}>
              <input type="text" placeholder="e.g. Fast-paced, remote-first, low ego, high ownership" className={inp}
                value={form.culture} onChange={(e) => field("culture", e.target.value)} />
            </Row>
          </Section>

          {/* Role */}
          <Section num="03" label="Hire for">
            {[
              { key: "jobTitle",      ph: "Job title — e.g. Senior Software Engineer" },
              { key: "seniorityLevel", ph: "Seniority — e.g. Senior, Staff, Principal" },
              { key: "keySkills",     ph: "Key skills — e.g. Rust, distributed systems, team leadership" },
            ].map(({ key, ph }, i) => (
              <Row key={key} error={errors[key]} divider={i > 0}>
                <input type="text" placeholder={ph} className={inp}
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
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => { setForm((f) => ({ ...f, tone: t.value })); if (errors.tone) setErrors((e) => ({ ...e, tone: "" })); }}
                    className="flex flex-col items-start px-4 py-4 rounded-xl text-left transition-all duration-150"
                    style={{
                      background: sel ? "rgba(99,102,241,0.12)" : C.input,
                      border: `1px solid ${sel ? "rgba(99,102,241,0.5)" : C.border}`,
                      boxShadow: sel ? "0 0 24px rgba(99,102,241,0.14), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    <span className="text-sm font-semibold mb-1.5" style={{ color: sel ? "#a5b4fc" : "#4a5580" }}>
                      {t.label}
                    </span>
                    <span className="text-[11px] leading-relaxed" style={{ color: sel ? "rgba(129,140,248,0.6)" : "#252e48" }}>
                      {t.descriptor}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.tone && <p className="px-5 pb-3 text-xs" style={{ color: "#f87171aa" }}>Select a tone</p>}
          </Section>

          {/* CTA */}
          <div className="pt-2 space-y-3">
            <button
              type="submit"
              className="w-full py-4 rounded-xl font-semibold text-white text-sm tracking-wide transition-all duration-200 active:scale-[0.99]"
              style={{
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)",
                boxShadow: "0 0 0 1px rgba(99,102,241,0.5), 0 8px 32px rgba(99,102,241,0.28)",
              }}
            >
              Brief the agent →
            </button>
            <p className="text-center text-[11px] font-mono" style={{ color: "#252e48" }}>
              Configures itself autonomously. Takes about 5 seconds.
            </p>
          </div>

        </form>
      </div>
    </main>
  );
}
