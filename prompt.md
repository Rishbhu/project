You are building a production-quality Next.js web app from scratch. This is a take-home assessment for a founding engineer role at an AI recruiting startup. It needs to be impressive.

## SETUP
1. Run: npx create-next-app@latest . --typescript --tailwind --app --yes
2. Run: npm install @anthropic-ai/sdk
3. Create .env.local with: ANTHROPIC_API_KEY=your_key_here
4. Use App Router (not pages/)

## WHAT YOU'RE BUILDING
A recruiting AI agent demo with 3 pages. The agent configures itself from company context and autonomously engages candidates — no human driving it step by step. Dark mode throughout, techy and minimal, not generic SaaS.

---

## PAGE 1: / (Company Setup Form)
A sleek dark form that captures:
- Company name
- What the company does (textarea, 2-3 sentences)
- Company culture (e.g. fast-paced, remote-first, low ego)
- Candidate profile they hire (job title, seniority level, key skills)
- Tone preference (three buttons to select: Professional / Conversational / Bold)

On submit, store all this in localStorage and route to /agent

---

## PAGE 2: /agent (Agent Self-Configuration)
This page is the money shot — show the agent's intelligence visibly.

Call POST /api/configure with the company context. This endpoint uses the Anthropic SDK to:
1. Give the agent a name and a personality (derived from the company tone + culture)
2. Generate a structured 3-message outreach sequence the agent WOULD send to a candidate
3. Return a reasoning block explaining WHY it made these choices

Display on the page:
- Agent identity card: name, personality traits, communication style
- A "How I configured myself" reasoning block (collapsible, monospace font, shows the agent's actual reasoning)
- The 3-message sequence displayed as chat bubbles with labels: "Initial Outreach", "Follow-up", "Final Touch"
- Each message should reflect the REAL company context — not generic recruiting copy
- A "Test this agent" button that routes to /sandbox

The 3 messages must feel genuinely different from each other:
- Message 1: Personalized hook based on candidate profile + company mission
- Message 2: Adds new value (a specific reason why NOW, a insight about the role), doesn't just nudge
- Message 3: Soft close, creates mild urgency without being pushy

---

## PAGE 3: /sandbox (Conversation Simulator)
Split layout:
- Left panel: shows the message sequence, candidate profile, agent identity
- Right panel: live conversation

The conversation starts with Message 1 already shown as sent.
Below it, a text input: "Simulate candidate reply..." with a Send button.

When the user sends a reply:
1. Show a collapsible "Agent thinking..." block FIRST with the agent's internal reasoning:
   - What did the candidate say?
   - What does this tell me about their interest level?
   - What should I prioritize in my response?
   - What tone should I use?
2. Then show the agent's actual reply beneath it
3. Conversation continues — agent maintains its personality and context across the whole thread

The agent must stay in character the entire time. If configured as bold, it stays bold. If professional, stays professional. Personality should feel DIFFERENT depending on what company context was entered.

---

## API ROUTES

### POST /api/configure
Input: { companyName, whatTheyDo, culture, candidateProfile, tone }

Use Anthropic SDK with claude-sonnet-4-6.

System prompt should instruct the agent to:
- Read the full company context
- Decide its own name, personality, and communication style
- Generate the 3-message sequence
- Output a reasoning block explaining its choices

Return JSON:
{
  agentName: string,
  personality: { traits: string[], style: string, avoid: string[] },
  reasoning: string,
  messages: [
    { label: string, content: string },
    { label: string, content: string },
    { label: string, content: string }
  ]
}

### POST /api/reply
Input: { conversationHistory: [], agentConfig: {}, companyContext: {} }

The agent reads the full conversation history + its own config + company context and reasons before replying.

Return JSON:
{
  thinking: string,
  reply: string
}

Use streaming if possible so the thinking block and reply appear progressively.

---

## DESIGN
- Dark mode only: background #0a0a0a, cards #111111, borders #222222
- Accent color: a single bold color (suggest electric blue #3b82f6 or violet #7c3aed)
- Font: Inter or Geist
- Smooth transitions between pages
- The "Agent thinking..." blocks should look distinct — monospace font, slightly different background, like a terminal
- No generic SaaS UI. This should look like something a founding engineer built with taste.
- Mobile responsive

## IMPORTANT
- ANTHROPIC_API_KEY comes from process.env.ANTHROPIC_API_KEY
- Model is claude-sonnet-4-6
- No real emails or LinkedIn messages are sent — this is a simulator only
- Store company context and agent config in localStorage to pass between pages
- Make sure the app runs with npm run dev before finishing
- Add a simple README.md explaining: what was built, key decisions, and one line answering "what makes your agent intelligent and not just an LLM call?"