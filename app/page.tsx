"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "Professional" | "Conversational" | "Bold";

const TONE_META: Record<Tone, string> = {
  Professional: "Measured. Precise. Warm.",
  Conversational: "Human. Loose. Direct.",
  Bold: "Punchy. Confident. No fluff.",
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
    "w-full bg-[#0d0d0d] border border-[#1c1c1c] rounded-lg px-4 py-3 text-sm text-[#e0e0e0] placeholder-[#333333] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]/30 transition-all duration-150 font-mono";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">

        {/* Badge + Hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-[#0d0d0d] border border-[#1c1c1c] rounded-full px-3 py-1.5 mb-7">
            <span className="text-[#3b82f6] text-xs">●</span>
            <span className="text-xs font-mono text-[#555555] tracking-widest uppercase">Recruiting Agent / v2</span>
          </div>
          <h1 className="text-[2.5rem] font-bold tracking-tight text-white leading-none mb-2">
            Brief the agent.
          </h1>
          <p className="text-base text-[#555555]">It configures itself.</p>
          <div className="mt-6 h-px bg-[#1c1c1c]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* COMPANY section */}
          <div>
            <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-3">Company</p>
            <div className="border-l-2 border-[#3b82f6]/30 pl-4 space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Company name"
                  className={`${inputBase} ${errors.companyName ? "border-red-500/40" : ""}`}
                  value={form.companyName}
                  onChange={(e) => field("companyName", e.target.value)}
                />
                {errors.companyName && (
                  <p className="mt-1 text-xs font-mono text-red-400/80">↳ {errors.companyName}</p>
                )}
              </div>
              <div>
                <textarea
                  rows={3}
                  placeholder="What does the company do? Be specific — the agent reads this."
                  className={`${inputBase} resize-none leading-relaxed ${errors.whatTheyDo ? "border-red-500/40" : ""}`}
                  value={form.whatTheyDo}
                  onChange={(e) => field("whatTheyDo", e.target.value)}
                />
                {errors.whatTheyDo && (
                  <p className="mt-1 text-xs font-mono text-red-400/80">↳ {errors.whatTheyDo}</p>
                )}
              </div>
            </div>
          </div>

          {/* CULTURE section */}
          <div>
            <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-3">Culture</p>
            <div>
              <input
                type="text"
                placeholder="e.g. Fast-paced, remote-first, low ego, high ownership"
                className={`${inputBase} ${errors.culture ? "border-red-500/40" : ""}`}
                value={form.culture}
                onChange={(e) => field("culture", e.target.value)}
              />
              {errors.culture && (
                <p className="mt-1 text-xs font-mono text-red-400/80">↳ {errors.culture}</p>
              )}
            </div>
          </div>

          {/* HIRE FOR section */}
          <div>
            <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-3">Hire For</p>
            <div className="border border-[#1c1c1c] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-[#0d0d0d]">
                <input
                  type="text"
                  placeholder="Job title — e.g. Senior Software Engineer"
                  className="w-full bg-transparent text-sm text-[#e0e0e0] placeholder-[#333333] font-mono focus:outline-none"
                  value={form.jobTitle}
                  onChange={(e) => field("jobTitle", e.target.value)}
                />
                {errors.jobTitle && (
                  <p className="mt-1 text-xs font-mono text-red-400/80">↳ {errors.jobTitle}</p>
                )}
              </div>
              <div className="h-px bg-[#1c1c1c]" />
              <div className="px-4 py-3 bg-[#0d0d0d]">
                <input
                  type="text"
                  placeholder="Seniority — e.g. Senior, Lead, Principal"
                  className="w-full bg-transparent text-sm text-[#e0e0e0] placeholder-[#333333] font-mono focus:outline-none"
                  value={form.seniorityLevel}
                  onChange={(e) => field("seniorityLevel", e.target.value)}
                />
                {errors.seniorityLevel && (
                  <p className="mt-1 text-xs font-mono text-red-400/80">↳ {errors.seniorityLevel}</p>
                )}
              </div>
              <div className="h-px bg-[#1c1c1c]" />
              <div className="px-4 py-3 bg-[#0d0d0d]">
                <input
                  type="text"
                  placeholder="Key skills — e.g. Rust, distributed systems, leadership"
                  className="w-full bg-transparent text-sm text-[#e0e0e0] placeholder-[#333333] font-mono focus:outline-none"
                  value={form.keySkills}
                  onChange={(e) => field("keySkills", e.target.value)}
                />
                {errors.keySkills && (
                  <p className="mt-1 text-xs font-mono text-red-400/80">↳ {errors.keySkills}</p>
                )}
              </div>
            </div>
          </div>

          {/* TONE section */}
          <div>
            <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-3">Tone</p>
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
                      ? "bg-[#3b82f6]/10 border-[#3b82f6] "
                      : "bg-[#0d0d0d] border-[#1c1c1c] hover:border-[#2a2a2a]"
                  }`}
                >
                  <span className={`text-sm font-semibold mb-1.5 ${form.tone === t ? "text-[#3b82f6]" : "text-[#888888]"}`}>
                    {t}
                  </span>
                  <span className={`text-xs font-mono leading-relaxed ${form.tone === t ? "text-[#3b82f6]/70" : "text-[#444444]"}`}>
                    {TONE_META[t]}
                  </span>
                </button>
              ))}
            </div>
            {errors.tone && (
              <p className="mt-2 text-xs font-mono text-red-400/80">↳ {errors.tone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-4 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm transition-all duration-150 hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.99] tracking-wide"
          >
            Brief the agent →
          </button>
        </form>
      </div>
    </main>
  );
}
