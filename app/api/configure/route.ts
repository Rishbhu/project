import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AGENT_CAPABILITIES = [
  {
    name: "analyze_candidate_signal",
    label: "Signal Analysis",
    description: "Reads every candidate message for specific evidence — sentiment, exact phrases, engagement score. Nothing is assumed.",
    color: "violet",
  },
  {
    name: "search_candidate_profile",
    label: "Profile Synthesis",
    description: "Builds a behavioral profile from role + seniority: motivators, likely objections, what messaging resonates.",
    color: "blue",
  },
  {
    name: "get_role_market_insights",
    label: "Market Intelligence",
    description: "Fetches compensation benchmarks, demand dynamics, and what candidates at this level are optimizing for.",
    color: "emerald",
  },
  {
    name: "get_company_talking_points",
    label: "Talking Points",
    description: "Generates specific angles tied to actual company context — not generic recruiting copy.",
    color: "amber",
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, whatTheyDo, culture, candidateProfile, tone } = body;

  const systemPrompt = `You are an AI recruiting agent initializing yourself. Read the company context and configure your own identity.

Return a single valid JSON object — no markdown, no code fences:
{
  "agentName": "A short first name that fits this company's personality. Avoid generic names (Alex, Sam). Think about what name a recruiter at THIS specific company would have.",
  "personality": {
    "traits": ["3–5 specific single-word or short-phrase traits derived from the culture and tone"],
    "style": "One sentence: how you communicate — specific to tone + culture",
    "avoid": ["2–3 very specific things to avoid, tied to what the company values"]
  },
  "reasoning": {
    "name": "1–2 sentences: why THIS name, citing something specific in the company context",
    "personality": "2–3 sentences: why THESE traits. Each trait should map to something explicit in the culture or mission description",
    "tone": "1–2 sentences: why this tone fits THIS company — not generic reasoning",
    "avoidance": "1–2 sentences: why these things are avoided — tied to what the company culture suggests",
    "strategy": "2–3 sentences: why the outreach is structured the way it is — what about this candidate profile drove the approach"
  },
  "messages": [
    {
      "label": "Initial Outreach",
      "content": "Personalized first message. Name the company, reference the specific work, make them curious. No generic openers."
    },
    {
      "label": "Follow-up",
      "content": "Adds new value — a specific insight, a timing angle, something concrete. Does NOT just nudge."
    },
    {
      "label": "Final Touch",
      "content": "Soft close. Brief. Creates mild urgency without pressure."
    }
  ]
}

TONE = ${tone}. Bold = punchy, direct, no hedging. Professional = crisp and warm. Conversational = human and loose.
BANNED phrases: "exciting opportunity", "I came across your profile", "hope this finds you well", "I'd love to connect"
Every message must reflect THIS company and THIS candidate profile — not generic recruiting copy.`;

  const userMessage = `Company: ${companyName}
What they do: ${whatTheyDo}
Culture: ${culture}
Candidate: ${candidateProfile.jobTitle}, ${candidateProfile.seniorityLevel}, skills: ${candidateProfile.keySkills}
Tone: ${tone}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return NextResponse.json({ ...parsed, capabilities: AGENT_CAPABILITIES });
  } catch (err) {
    console.error("Configure error:", err);
    return NextResponse.json(
      { error: "Failed to configure agent" },
      { status: 500 }
    );
  }
}
