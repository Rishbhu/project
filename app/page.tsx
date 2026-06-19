"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "Professional" | "Conversational" | "Bold";

const TONE_META: Record<Tone, { descriptor: string; sub: string }> = {
  Professional: { descriptor: "Measured", sub: "Precise. Warm. No noise." },
  Conversational: { descriptor: "Human", sub: "Loose. Direct. Real." },
  Bold: { descriptor: "Punchy", sub: "Confident. No fluff." },
};

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    whatTheyDo: "",
    culture: "",
    jobTitle: "",
    seniorityLevel: "",
    keySkills: "",
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
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const context = {
      companyName: form.companyName.trim(),
      whatTheyDo: form.whatTheyDo.trim(),
      culture: form.culture.trim(),
      candidateProfile: {
        jobTitle: form.jobTitle.trim(),
        seniorityLevel: form.seniorityLevel.trim(),
        keySkills: form.keySkills.trim(),
      },
      tone: form.tone,
    };

    localStorage.setItem("companyContext", JSON.stringify(context));
    router.push("/agent");
  }

  function field(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  const inputBase =
    "w-full bg-[#0d0d0d] border border-[#1c1c1c] rounded-lg px-4 py-3 text-sm text-[#e0e0e0] placeholder-[#2e2e2e] focus:outline-none focus:border-[#3b82f6]/60 focus:ring-1 focus:ring-[#3b82f6]/20 transition-all duration-150";

  const sectionLabel = "text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-3";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0d0d0d] border border-[#1c1c1c] rounded-full px-3 py-1.5 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] inline-block" />
            <span className="text-xs font-mono text-[#555555] tracking-widest uppercase">Recruiting Agent</span>
          </div>
          <h1 className="text-[2.75rem] font-bold tracking-tight text-white leading-none mb-3">
            Brief the agent.
          </h1>
          <p className="text-base text-[#555555] leading-relaxed">
            It reads the context, builds its own identity,<br />
            and writes the outreach.
          </p>
          <div className="mt-7 h-px bg-[#1a1a1a]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">

          {/* Company */}
          <div>
            <p className={sectionLabel}>Company</p>
            <div className="border-l-2 border-[#6366f1]/25 pl-4 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Company name"
                  className={`${inputBase} ${errors.companyName ? "border-red-500/30" : ""}`}
                  value={form.companyName}
                  onChange={(e) => field("companyName", e.target.value)}
                />
                {errors.companyName && (
                  <p className="mt-1.5 text-xs text-red-400/70">↳ {errors.companyName}</p>
                )}
              </div>
              <div>
                <textarea
                  rows={3}
                  placeholder="What does the company do? Be specific — the agent reads this literally."
                  className={`${inputBase} resize-none leading-relaxed ${errors.whatTheyDo ? "border-red-500/30" : ""}`}
                  value={form.whatTheyDo}
                  onChange={(e) => field("whatTheyDo", e.target.value)}
                />
                {errors.whatTheyDo && (
                  <p className="mt-1.5 text-xs text-red-400/70">↳ {errors.whatTheyDo}</p>
                )}
              </div>
            </div>
          </div>

          {/* Culture */}
          <div>
            <p className={sectionLabel}>Culture</p>
            <div>
              <input
                type="text"
                placeholder="e.g. Fast-paced, remote-first, low ego, high ownership"
                className={`${inputBase} ${errors.culture ? "border-red-500/30" : ""}`}
                value={form.culture}
                onChange={(e) => field("culture", e.target.value)}
              />
              {errors.culture && (
                <p className="mt-1.5 text-xs text-red-400/70">↳ {errors.culture}</p>
              )}
            </div>
          </div>

          {/* Hire For */}
          <div>
            <p className={sectionLabel}>Hire for</p>
            <div className="border border-[#1c1c1c] rounded-xl overflow-hidden">
              {[
                { key: "jobTitle", placeholder: "Job title — e.g. Senior Software Engineer" },
                { key: "seniorityLevel", placeholder: "Seniority — e.g. Senior, Lead, Principal" },
                { key: "keySkills", placeholder: "Key skills — e.g. Rust, distributed systems, leadership" },
              ].map(({ key, placeholder }, i) => (
                <div key={key}>
                  {i > 0 && <div className="h-px bg-[#1a1a1a]" />}
                  <div className="px-4 py-3 bg-[#0d0d0d]">
                    <input
                      type="text"
                      placeholder={placeholder}
                      className="w-full bg-transparent text-sm text-[#e0e0e0] placeholder-[#2e2e2e] focus:outline-none"
                      value={form[key as keyof typeof form] as string}
                      onChange={(e) => field(key, e.target.value)}
                    />
                    {errors[key] && (
                      <p className="mt-1 text-xs text-red-400/70">↳ {errors[key]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <p className={sectionLabel}>Tone</p>
            <div className="grid grid-cols-3 gap-2">
              {(["Professional", "Conversational", "Bold"] as Tone[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setForm((f) => ({ ...f, tone: t }));
                    if (errors.tone) setErrors((e) => ({ ...e, tone: "" }));
                  }}
                  className={`flex flex-col items-start px-4 py-4 rounded-xl border text-left transition-all duration-150 ${
                    form.tone === t
                      ? "bg-[#6366f1]/8 border-[#6366f1]/50"
                      : "bg-[#0d0d0d] border-[#1c1c1c] hover:border-[#2a2a2a]"
                  }`}
                >
                  <span className={`text-sm font-semibold mb-1 ${form.tone === t ? "text-[#818cf8]" : "text-[#888888]"}`}>
                    {TONE_META[t].descriptor}
                  </span>
                  <span className={`text-xs leading-snug ${form.tone === t ? "text-[#818cf8]/60" : "text-[#444444]"}`}>
                    {TONE_META[t].sub}
                  </span>
                </button>
              ))}
            </div>
            {errors.tone && (
              <p className="mt-2 text-xs text-red-400/70">↳ {errors.tone}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full mt-1 py-4 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm transition-all duration-150 hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.99] tracking-wide"
          >
            Brief the agent →
          </button>
        </form>
      </div>
    </main>
  );
}
