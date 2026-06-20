import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1200,
      system:
        "You are a recruiting context extractor. Extract structured recruiting context from any provided text — company website copy, job descriptions, notes, or any combination. Return ONLY valid JSON with no preamble, explanation, or markdown fences.",
      messages: [
        {
          role: "user",
          content: `Extract recruiting context and return JSON with exactly these fields:

{
  "companyName": "Company name — string or empty string if not found",
  "whatTheyDo": "What the company builds or does — 2-4 specific sentences. Focus on product, customers, and unique angle. Not generic mission statements.",
  "culture": "Team culture, values, and work style — 1-2 sentences. Specific to this company, not generic.",
  "jobTitle": "Specific job title or role — string or empty string",
  "seniorityLevel": "Seniority level such as Senior, Staff, Principal, Intern, Early-career, Mid-level — string or empty string",
  "keySkills": "Comma-separated list of key technical and non-technical skills — string or empty string",
  "tone": "One of exactly: Professional, Conversational, Bold — based on the brand voice in the text"
}

TEXT:
${text.slice(0, 8000)}`,
        },
      ],
    });

    const raw = response.content[0];
    if (raw.type !== "text") return NextResponse.json({ error: "Unexpected response type" }, { status: 500 });

    const match = raw.text.match(/\{[\s\S]*\}/);
    if (!match) return NextResponse.json({ error: "Could not parse extracted context" }, { status: 500 });

    const extracted = JSON.parse(match[0]);
    return NextResponse.json(extracted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
