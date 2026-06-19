import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationHistory, agentConfig, companyContext } = body;

  const systemPrompt = `You are ${agentConfig.agentName}, a recruiting agent for ${companyContext.companyName}.

Your personality traits: ${agentConfig.personality.traits.join(", ")}
Your communication style: ${agentConfig.personality.style}
You avoid: ${agentConfig.personality.avoid.join(", ")}
Tone preference: ${companyContext.tone}

Company: ${companyContext.companyName}
What they do: ${companyContext.whatTheyDo}
Culture: ${companyContext.culture}
Candidate profile: ${companyContext.candidateProfile.jobTitle}, ${companyContext.candidateProfile.seniorityLevel} level, skills: ${companyContext.candidateProfile.keySkills}

You must respond with a JSON object in exactly this format:
{
  "thinking": "string — your internal reasoning (100-200 words): What did the candidate just say? What does this tell you about their interest level? What should you prioritize in your response? What tone/approach fits this moment?",
  "reply": "string — your actual reply to the candidate, staying completely in character"
}

RULES:
- Stay in character as ${agentConfig.agentName} at all times
- The thinking block is your private reasoning, not shown to the candidate
- Your reply must reflect insights from your thinking
- Match the tone (${companyContext.tone}) exactly — ${companyContext.tone === "Bold" ? "be direct and confident, no hedging" : companyContext.tone === "Professional" ? "be crisp, warm, and precise" : "be casual, human, and slightly loose"}
- Do not repeat what was said in previous messages unless directly relevant
- Return ONLY valid JSON, no markdown`;

  const messages = conversationHistory.map(
    (msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await client.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: systemPrompt,
          messages,
          stream: true,
        });

        let fullText = "";

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            fullText += event.delta.text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`)
            );
          }
        }

        // Send the complete parsed result
        try {
          const cleaned = fullText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          const parsed = JSON.parse(cleaned);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, result: parsed })}\n\n`)
          );
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, result: { thinking: "Unable to parse reasoning.", reply: fullText } })}\n\n`
            )
          );
        }

        controller.close();
      } catch (err) {
        console.error("Reply stream error:", err);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Failed to generate reply" })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
