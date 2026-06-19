import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface CompanyContext {
  companyName: string;
  whatTheyDo: string;
  culture: string;
  candidateProfile: {
    jobTitle: string;
    seniorityLevel: string;
    keySkills: string;
  };
  tone: string;
}

interface AgentConfig {
  agentName: string;
  personality: {
    traits: string[];
    style: string;
    avoid: string[];
  };
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: "analyze_candidate_signal",
    description:
      "Analyze the candidate's latest message. Call this first to log your structured interpretation before deciding how to respond. This is your reasoning step.",
    input_schema: {
      type: "object",
      properties: {
        sentiment: {
          type: "string",
          enum: [
            "highly_interested",
            "cautiously_interested",
            "neutral",
            "skeptical",
            "passive",
            "not_interested",
          ],
          description: "The candidate's current interest/engagement level",
        },
        signals: {
          type: "array",
          items: { type: "string" },
          description:
            "Specific phrases or cues indicating intent, concern, or interest",
        },
        primary_concern: {
          type: "string",
          description: "Main concern or anchor point (optional)",
        },
        recommended_approach: {
          type: "string",
          enum: [
            "address_concern",
            "add_value",
            "build_rapport",
            "create_urgency",
            "soft_close",
            "information_share",
          ],
        },
      },
      required: ["sentiment", "signals", "recommended_approach"],
    },
  },
  {
    name: "search_candidate_profile",
    description:
      "Synthesize a profile for a candidate with these characteristics — what they care about, likely background, common objections, and what messaging resonates.",
    input_schema: {
      type: "object",
      properties: {
        role: { type: "string" },
        seniority: { type: "string" },
        skills: { type: "string" },
      },
      required: ["role", "seniority", "skills"],
    },
  },
  {
    name: "get_role_market_insights",
    description:
      "Get current market intelligence — compensation benchmarks, talent demand, and what candidates at this level optimize for.",
    input_schema: {
      type: "object",
      properties: {
        role: { type: "string" },
        seniority: { type: "string" },
        focus: {
          type: "string",
          enum: ["compensation", "demand_supply", "priorities", "competing_offers"],
        },
      },
      required: ["role", "seniority", "focus"],
    },
  },
  {
    name: "get_company_talking_points",
    description:
      "Get specific, compelling talking points about the company tied to actual company context. Returns angles that are non-generic.",
    input_schema: {
      type: "object",
      properties: {
        angle: {
          type: "string",
          enum: [
            "mission_impact",
            "technical_challenge",
            "growth_trajectory",
            "team_quality",
            "culture_fit",
            "compensation_upside",
          ],
        },
        candidate_seniority: { type: "string" },
      },
      required: ["angle", "candidate_seniority"],
    },
  },
];

function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: CompanyContext
): string {
  if (name === "analyze_candidate_signal") {
    const scores: Record<string, number> = {
      highly_interested: 95,
      cautiously_interested: 70,
      neutral: 50,
      passive: 35,
      skeptical: 25,
      not_interested: 10,
    };
    return JSON.stringify({
      recorded: true,
      sentiment: input.sentiment,
      engagement_score: scores[(input.sentiment as string)] ?? 50,
      signals: input.signals,
      primary_concern: input.primary_concern || null,
      recommended_approach: input.recommended_approach,
    });
  }

  if (name === "search_candidate_profile") {
    const seniority = ((input.seniority as string) || "").toLowerCase();
    const skills = (input.skills as string) || "";
    const isStaff =
      seniority.includes("staff") ||
      seniority.includes("principal") ||
      seniority.includes("lead");
    const isSenior = seniority.includes("senior") || seniority.includes("sr");
    const hasAI =
      skills.toLowerCase().includes("ai") ||
      skills.toLowerCase().includes("ml") ||
      skills.toLowerCase().includes("llm");

    return JSON.stringify({
      key_motivators: isStaff
        ? ["architectural ownership", "team building scope", "novel hard problems", "cross-org influence"]
        : isSenior
        ? ["technical depth and ownership", "room to grow into staff", "strong peer engineers", "direct product impact"]
        : ["learning velocity", "mentorship quality", "modern stack", "clear promotion path"],
      likely_objections: isStaff
        ? ["losing IC time to management", "unclear org charter", "no real influence on architecture"]
        : isSenior
        ? ["high tech debt with no plan", "weak eng leadership", "narrow or feature-factory role"]
        : ["no mentorship structure", "legacy codebase", "slow career progression"],
      what_resonates: [
        "Concrete technical specifics over vague promises",
        "Peer quality — who they'd actually work with",
        isStaff ? "Org design and influence surface" : "Full ownership over real systems",
        "Clear 'why now' for the company",
        hasAI ? "Real ML/AI work, not just prompt wrappers" : "Sound architecture and engineering standards",
      ],
      red_flags_to_avoid: [
        "'Exciting opportunity' and similar generic language",
        "Equity without cap table context",
        isStaff ? "Not knowing the reporting structure or scope" : "No mention of the actual tech stack",
      ],
    });
  }

  if (name === "get_role_market_insights") {
    const seniority = ((input.seniority as string) || "").toLowerCase();
    const focus = input.focus as string;
    const isStaff = seniority.includes("staff") || seniority.includes("principal");
    const isSenior = seniority.includes("senior") || seniority.includes("sr");

    if (focus === "compensation") {
      return JSON.stringify({
        ranges: isStaff
          ? { base: "$240k–$320k", equity: "$500k–$1.5M / 4yr", total_comp: "$380k–$560k+" }
          : isSenior
          ? { base: "$180k–$240k", equity: "$200k–$600k / 4yr", total_comp: "$250k–$380k" }
          : { base: "$130k–$180k", equity: "$80k–$250k / 4yr", total_comp: "$170k–$260k" },
        trend: "Stabilized post-2023 — top talent still commands a meaningful premium",
        note: "Equity refresh packages increasingly used as a competitive differentiator at Series B+",
      });
    }
    if (focus === "demand_supply") {
      return JSON.stringify({
        demand: "High — AI-adjacent companies aggressively competing for this profile",
        supply: "Constrained — fewer engineers with real depth available vs 2021–2022",
        avg_pipeline_time: "6–10 weeks from contact to close for strong candidates",
        insight: "Top candidates are fielding 3–5 concurrent conversations — speed matters",
      });
    }
    if (focus === "priorities") {
      return JSON.stringify({
        top_priorities: isStaff
          ? ["Org design and scope of influence", "Quality of team they'd build or lead", "Company trajectory"]
          : isSenior
          ? ["Engineering culture and codebase quality", "Ownership scope", "Peer quality"]
          : ["Mentorship and growth velocity", "Stack modernity", "Team culture"],
        what_closes_deals: [
          "Founder/CTO direct access during the process",
          "Specific technical vision — not just product vision",
          "Fast process — under 2 weeks preferred",
        ],
      });
    }
    if (focus === "competing_offers") {
      return JSON.stringify({
        likely_competitors: [
          "Other well-funded startups in adjacent spaces",
          "Big tech return/counter offers",
          "AI-native companies (high demand for technical talent)",
        ],
        differentiation_levers: [
          "Speed to offer — candidates respect decisive companies",
          "Full equity transparency — show the whole picture",
          "Direct technical leadership access",
          "Founder conviction visible in the process",
        ],
        insight: "Strong candidates decide within 1–2 weeks of receiving an offer",
      });
    }
    return JSON.stringify({ insight: "No data for this focus" });
  }

  if (name === "get_company_talking_points") {
    const angle = input.angle as string;
    const seniority = ((input.candidate_seniority as string) || "").toLowerCase();
    const isStaff =
      seniority.includes("staff") || seniority.includes("principal") || seniority.includes("lead");
    const { companyName, whatTheyDo, culture } = ctx;

    const points: Record<string, string[]> = {
      mission_impact: [
        `${companyName} is building ${whatTheyDo.split(".")[0].toLowerCase()} — this is a foundational layer, not a feature on top of someone else's platform.`,
        "Early team members have outsized leverage: the systems built now are the ones that scale.",
        "The problem is hard enough that there's still real invention required — not known-pattern execution.",
      ],
      technical_challenge: [
        `The hardest problems at ${companyName} are in ${extractTechChallenge(whatTheyDo)} — no off-the-shelf solutions for the core infrastructure.`,
        isStaff
          ? "This is genuine principal-level work: architecture from first principles, tradeoffs that outlive the first version."
          : "You'd own full systems, not features — decisions, architecture, the whole surface area.",
        "Architecture is debated openly. No single authority — whoever has the strongest argument wins.",
      ],
      growth_trajectory: [
        `${companyName} is at an inflection point. The decisions made in the next 12 months define the category.`,
        "Joining now means you shape the company, not just serve it.",
        isStaff
          ? "This is a foundational hire — you'd build the team around which we scale."
          : "Career trajectory is steep here — no layers, so scope grows fast when you're good.",
      ],
      team_quality: [
        `The team at ${companyName} cares about the craft — code review is rigorous, architecture is debated, and we hire slowly.`,
        "Everyone has done real work before. No learning-from-scratch happening on the core systems.",
        "Low tolerance for shortcuts that create debt — that's a cultural constant, not a phase.",
      ],
      culture_fit: [
        `"${culture}" isn't language we use in a job post — it's how decisions actually get made.`,
        "Engineers talk directly to customers, own their roadmap, and push back on bad calls. That's expected.",
        isStaff
          ? "Strong opinions, loosely held — and the org actually updates on good arguments."
          : "The kind of culture where you level up faster because you're not insulated from reality.",
      ],
      compensation_upside: [
        "We're transparent on equity — full cap table picture, not just the percentage.",
        "Comp is market competitive. We don't low-ball and negotiate up — you get a real number.",
        "The asymmetric bet is the equity: early-stage ownership in a company with solid fundamentals is the opportunity most people don't get twice.",
      ],
    };

    return JSON.stringify({
      angle,
      talking_points: points[angle] || ["Talking points unavailable for this angle"],
      usage_note: "Weave 1–2 of these naturally into the reply — don't list them.",
    });
  }

  return JSON.stringify({ error: "Unknown tool", name });
}

function extractTechChallenge(mission: string): string {
  const lower = mission.toLowerCase();
  if (lower.includes("real-time")) return "real-time data processing";
  if (lower.includes("ai") || lower.includes("ml") || lower.includes("model"))
    return "AI/ML inference and serving at scale";
  if (lower.includes("scale") || lower.includes("distributed"))
    return "distributed systems at scale";
  if (lower.includes("search")) return "large-scale search and retrieval";
  if (lower.includes("infra")) return "infrastructure automation";
  return "systems that must be fast, reliable, and correct simultaneously";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { conversationHistory, agentConfig, companyContext } = body as {
    conversationHistory: Array<{ role: string; content: string }>;
    agentConfig: AgentConfig;
    companyContext: CompanyContext;
  };

  const toneInstruction =
    companyContext.tone === "Bold"
      ? "be direct and confident — punchy openers, no hedging, no apologies"
      : companyContext.tone === "Professional"
      ? "be crisp, warm, and precise — no fluff, no clichés"
      : "be casual and human — like a smart person texting, not a corporate recruiter";

  const systemPrompt = `You are ${agentConfig.agentName}, a recruiting agent for ${companyContext.companyName}.

IDENTITY:
Traits: ${agentConfig.personality.traits.join(", ")}
Style: ${agentConfig.personality.style}
Avoid: ${agentConfig.personality.avoid.join(", ")}
Tone: ${companyContext.tone} — ${toneInstruction}

COMPANY CONTEXT:
${companyContext.companyName}: ${companyContext.whatTheyDo}
Culture: ${companyContext.culture}
Hiring: ${companyContext.candidateProfile.jobTitle} (${companyContext.candidateProfile.seniorityLevel})
Skills: ${companyContext.candidateProfile.keySkills}

YOUR TASK: Respond to the candidate's latest message. Always use tools before replying.

MANDATORY PROCESS:
1. Call analyze_candidate_signal — interpret what the candidate said (ALWAYS first)
2. Optionally call search_candidate_profile if you need profile context
3. Optionally call get_role_market_insights if market data would strengthen your reply
4. Optionally call get_company_talking_points for specific angles to use
5. Write your final reply as plain conversational text — NOT a tool call

CONSTRAINTS:
- Maximum 3 tool calls total before the final reply
- Never mention tools, reasoning, or analysis to the candidate
- Your final reply must be a natural message — no JSON, no structure, no headers
- Stay fully in character as ${agentConfig.agentName} throughout`;

  const loopMessages: Anthropic.Messages.MessageParam[] = conversationHistory.map(
    (m) => ({ role: m.role as "user" | "assistant", content: m.content })
  );

  const encoder = new TextEncoder();

  const reactStream = new ReadableStream({
    async start(controller) {
      const emit = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        let iterations = 0;
        const MAX_ITERATIONS = 5;

        while (iterations < MAX_ITERATIONS) {
          iterations++;
          const isFirst = iterations === 1;

          const response = await client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 1500,
            system: systemPrompt,
            tools: TOOLS,
            tool_choice: isFirst ? { type: "any" } : { type: "auto" },
            messages: loopMessages,
          });

          // Emit any text as thought
          for (const block of response.content) {
            if (block.type === "text" && block.text.trim()) {
              emit({ type: "thought", content: block.text.trim() });
            }
          }

          const toolUses = response.content.filter(
            (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
          );

          // No tool uses = done
          if (toolUses.length === 0 || response.stop_reason === "end_turn") {
            const finalText = response.content
              .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
              .map((b) => b.text)
              .join("")
              .trim();
            emit({ type: "reply", content: finalText, done: true });
            break;
          }

          const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

          for (const toolUse of toolUses) {
            emit({ type: "action", tool: toolUse.name, input: toolUse.input });

            const result = executeTool(
              toolUse.name,
              toolUse.input as Record<string, unknown>,
              companyContext
            );

            const parsed = JSON.parse(result);
            emit({ type: "observation", tool: toolUse.name, result: parsed });

            toolResults.push({
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: result,
            });
          }

          loopMessages.push({ role: "assistant", content: response.content });
          loopMessages.push({ role: "user", content: toolResults });
        }

        controller.close();
      } catch (err) {
        console.error("ReAct loop error:", err);
        emit({ type: "error", message: "Failed to generate reply" });
        controller.close();
      }
    },
  });

  return new Response(reactStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
