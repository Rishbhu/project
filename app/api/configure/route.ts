import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const AGENT_CAPABILITIES = [
  {
    name: "analyze_candidate_signal",
    label: "Signal Analysis",
    description: "Interprets what each candidate message reveals — sentiment, intent, engagement score, and optimal response strategy.",
    color: "violet",
  },
  {
    name: "search_candidate_profile",
    label: "Profile Synthesis",
    description: "Builds a behavioral profile for this candidate archetype: motivators, objections, what messaging will land vs. fall flat.",
    color: "blue",
  },
  {
    name: "get_role_market_insights",
    label: "Market Intelligence",
    description: "Fetches live market data: compensation benchmarks, demand/supply dynamics, and what candidates at this level are optimizing for.",
    color: "emerald",
  },
  {
    name: "get_company_talking_points",
    label: "Talking Points",
    description: "Generates specific, non-generic talking points from real company context — mission, technical challenge, culture, growth trajectory.",
    color: "amber",
  },
];

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, whatTheyDo, culture, candidateProfile, tone } = body;

  const systemPrompt = `You are an AI recruiting agent initializing yourself from company context. Your job is to read the company, form an identity, and generate a 3-message outreach sequence.

Return a JSON object with this exact structure (no markdown, no code fences):
{
  "agentName": "A short, single first name that fits the company's vibe. Avoid generic names like 'Alex'. Think about what name a recruiter at THIS company would have.",
  "personality": {
    "traits": ["3–5 specific single-word or short-phrase traits that reflect this company's personality"],
    "style": "One sentence describing communication style — specific to tone + culture",
    "avoid": ["2–3 very specific things to avoid in messaging, based on the company culture"]
  },
  "reasoning": "150–250 words. Explain specifically: why THIS name, why THESE traits, and what in the company context drove each choice. Be concrete — reference actual words from the company description.",
  "messages": [
    {
      "label": "Initial Outreach",
      "content": "Personalized hook based on candidate profile + company mission. No generic openers. Name the company, reference something specific about the work. Make them curious."
    },
    {
      "label": "Follow-up",
      "content": "Adds genuinely NEW value — a specific insight about the role, a timing angle, something concrete about the problem. Does NOT just nudge or check in."
    },
    {
      "label": "Final Touch",
      "content": "Soft close. Creates mild urgency without pressure. Brief. Leaves the door open."
    }
  ]
}

HARD RULES:
- Tone is ${tone}. Bold = direct, punchy, no corporate speak. Professional = crisp and warm. Conversational = human and loose.
- Messages must feel structurally different from each other — different hook, different value prop, different ask
- BANNED phrases: "exciting opportunity", "I came across your profile", "hope this finds you well", "I'd love to connect"
- Every message must feel written for THIS specific company and THIS specific candidate profile
- Return ONLY valid JSON`;

  const userMessage = `Company: ${companyName}
What they do: ${whatTheyDo}
Culture: ${culture}
Candidate: ${candidateProfile.jobTitle}, ${candidateProfile.seniorityLevel} level, skills: ${candidateProfile.keySkills}
Tone: ${tone}

Configure yourself as their recruiting agent. Generate the outreach sequence.`;

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
