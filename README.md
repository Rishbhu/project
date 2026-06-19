# RecruiterAI — Intelligent Recruiting Agent Demo

A Next.js app that lets you configure an AI recruiting agent from company context, watch it define its own identity and outreach strategy, then simulate candidate conversations with visible agent reasoning.

## What was built

**3 pages:**
- `/` — Company setup form: company name, mission, culture, candidate profile, tone preference
- `/agent` — Agent self-configuration: the agent reads context, names itself, defines personality, and generates a 3-message outreach sequence with a collapsible reasoning block showing *why* it made each choice
- `/sandbox` — Conversation simulator: split layout with the agent's profile/sequence on the left and a live chat on the right, where each reply shows an "Agent thinking..." block revealing the agent's internal reasoning before it responds

**2 API routes:**
- `POST /api/configure` — Uses Claude to generate the agent's identity and outreach sequence from company context
- `POST /api/reply` — Streaming SSE endpoint; the agent reads conversation history + its own config + company context and reasons before every reply

## Setup

```bash
npm install
# Add your key to .env.local:
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

## Key decisions

- **Streaming for replies** — The `/api/reply` route uses `stream: true` with the Anthropic SDK and sends SSE chunks so thinking and replies appear progressively rather than after a long wait
- **All state in localStorage** — Company context and agent config persist across page navigations without a backend, keeping the demo self-contained
- **JSON-only system prompts** — Both API routes instruct the model to return raw JSON with no markdown fences, then strip any that slip through, avoiding parsing brittleness
- **Personality bleeds into every message** — The reply API sends the agent's `avoid` list and `style` back with every request so the personality is reinforced across the full conversation, not just at config time

## What makes this agent intelligent and not just an LLM call?

The agent maintains a persistent self-model — it names itself, defines its own personality constraints, and re-reads those constraints on every reply. When responding, it explicitly reasons about what the candidate's message signals about interest level and adjusts tone accordingly. This makes the conversation adaptive: a skeptical reply gets a different response than an enthusiastic one, and the reasoning is visible, not hidden.
