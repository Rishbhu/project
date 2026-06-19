import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { companyName, whatTheyDo, culture, candidateProfile, tone } = body;

  const systemPrompt = `You are an AI recruiting agent being initialized. You will read company context and configure yourself — choosing your own identity, personality, and outreach strategy.

You must return a JSON object with exactly this structure:
{
  "agentName": "string — a short, memorable first name for yourself that fits the company vibe",
  "personality": {
    "traits": ["array", "of", "3-5", "single-word", "or", "short-phrase", "traits"],
    "style": "one sentence describing your communication style",
    "avoid": ["array", "of", "2-3", "things", "you", "avoid", "in", "messaging"]
  },
  "reasoning": "string — 150-250 words explaining WHY you chose this name, these traits, and this approach. Be specific about what in the company context drove each decision.",
  "messages": [
    {
      "label": "Initial Outreach",
      "content": "string — the full first message you'd send to this candidate"
    },
    {
      "label": "Follow-up",
      "content": "string — a follow-up that adds NEW value, not just a nudge. Mention something specific about timing, the role, or a concrete insight."
    },
    {
      "label": "Final Touch",
      "content": "string — a soft close that creates mild urgency without pressure. Keep it brief."
    }
  ]
}

CRITICAL RULES:
- Messages must feel DIFFERENT from each other structurally and in what they offer
- All messages must feel real — use the company name, role, and context specifically
- Your personality must match the tone preference exactly: ${tone}
- Bold = direct, no hedging, confident openers. Professional = crisp, formal but warm. Conversational = casual, human, a bit loose.
- No generic phrases like "I came across your profile" or "excited opportunity" — these are banned
- Return ONLY valid JSON, no markdown code blocks`;

  const userMessage = `Company: ${companyName}
What they do: ${whatTheyDo}
Culture: ${culture}
Candidate profile: ${candidateProfile.jobTitle}, ${candidateProfile.seniorityLevel} level, skills: ${candidateProfile.keySkills}
Tone preference: ${tone}

Configure yourself as a recruiting agent for this company and generate the 3-message outreach sequence for this candidate profile.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Strip markdown code fences if present
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Configure error:", err);
    return NextResponse.json(
      { error: "Failed to configure agent" },
      { status: 500 }
    );
  }
}
