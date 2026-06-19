"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Tone = "Professional" | "Conversational" | "Bold";

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
    "w-full bg-[#111111] border border-[#222222] rounded-lg px-4 py-3 text-sm text-[#ededed] placeholder-[#4b5563] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all duration-200";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6] animate-pulse" />
            <span className="text-xs font-mono text-[#3b82f6] uppercase tracking-widest">
              Recruiting Agent
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Configure your agent
          </h1>
          <p className="text-sm text-[#6b7280]">
            Give the agent company context. It will figure out the rest.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
              Company Name
            </label>
            <input
              type="text"
              placeholder="Acme Corp"
              className={`${inputBase} ${errors.companyName ? "border-red-500/50" : ""}`}
              value={form.companyName}
              onChange={(e) => field("companyName", e.target.value)}
            />
            {errors.companyName && (
              <p className="mt-1 text-xs text-red-400">{errors.companyName}</p>
            )}
          </div>

          {/* What They Do */}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
              What the company does
            </label>
            <textarea
              rows={3}
              placeholder="We build AI-native developer tools that help engineering teams ship 10x faster. Our core product is a real-time code review agent that integrates into CI/CD pipelines."
              className={`${inputBase} resize-none leading-relaxed ${errors.whatTheyDo ? "border-red-500/50" : ""}`}
              value={form.whatTheyDo}
              onChange={(e) => field("whatTheyDo", e.target.value)}
            />
            {errors.whatTheyDo && (
              <p className="mt-1 text-xs text-red-400">{errors.whatTheyDo}</p>
            )}
          </div>

          {/* Culture */}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
              Company culture
            </label>
            <input
              type="text"
              placeholder="Fast-paced, remote-first, low ego, high ownership"
              className={`${inputBase} ${errors.culture ? "border-red-500/50" : ""}`}
              value={form.culture}
              onChange={(e) => field("culture", e.target.value)}
            />
            {errors.culture && (
              <p className="mt-1 text-xs text-red-400">{errors.culture}</p>
            )}
          </div>

          {/* Candidate Profile */}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-2">
              Candidate profile
            </label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Job title (e.g. Senior Software Engineer)"
                className={`${inputBase} ${errors.jobTitle ? "border-red-500/50" : ""}`}
                value={form.jobTitle}
                onChange={(e) => field("jobTitle", e.target.value)}
              />
              {errors.jobTitle && (
                <p className="-mt-2 text-xs text-red-400">{errors.jobTitle}</p>
              )}
              <input
                type="text"
                placeholder="Seniority level (e.g. Senior, Lead, Principal)"
                className={`${inputBase} ${errors.seniorityLevel ? "border-red-500/50" : ""}`}
                value={form.seniorityLevel}
                onChange={(e) => field("seniorityLevel", e.target.value)}
              />
              {errors.seniorityLevel && (
                <p className="-mt-2 text-xs text-red-400">
                  {errors.seniorityLevel}
                </p>
              )}
              <input
                type="text"
                placeholder="Key skills (e.g. Rust, distributed systems, technical leadership)"
                className={`${inputBase} ${errors.keySkills ? "border-red-500/50" : ""}`}
                value={form.keySkills}
                onChange={(e) => field("keySkills", e.target.value)}
              />
              {errors.keySkills && (
                <p className="-mt-2 text-xs text-red-400">{errors.keySkills}</p>
              )}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="block text-xs font-medium text-[#9ca3af] uppercase tracking-wider mb-3">
              Tone preference
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(["Professional", "Conversational", "Bold"] as Tone[]).map(
                (t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, tone: t }));
                      if (errors.tone) setErrors((e) => ({ ...e, tone: "" }));
                    }}
                    className={`py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                      form.tone === t
                        ? "bg-[#3b82f6]/10 border-[#3b82f6] text-[#3b82f6]"
                        : "bg-[#111111] border-[#222222] text-[#6b7280] hover:border-[#333333] hover:text-[#9ca3af]"
                    }`}
                  >
                    {t}
                  </button>
                )
              )}
            </div>
            {errors.tone && (
              <p className="mt-2 text-xs text-red-400">{errors.tone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-2 py-3.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-[#3b82f6]/20 active:scale-[0.99]"
          >
            Configure Agent →
          </button>
        </form>
      </div>
    </main>
  );
}
