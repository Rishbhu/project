# Recruiting AI Agent

A full-stack demo of an autonomous recruiting agent built with Next.js and Claude.

## What it does

1. You fill out a brief: company name, what they build, culture, role, and tone.
2. The agent configures itself — it derives its own name, personality, and opening messages from your context.
3. You simulate a candidate conversation in the sandbox. The agent responds using a ReAct loop: it reasons, calls tools, and writes a grounded reply.

## What makes the agent intelligent

It converts company context into a persistent recruiting operating profile, then uses that profile plus conversation state to classify candidate intent, identify missing facts, avoid hallucination, choose the next best action, and explain its decision in the Agent Brain.

Every response is governed by four principles:
- **Evidence only** — signals must be verbatim quotes from the candidate's message, never paraphrases
- **No hallucinated facts** — only states what is explicitly in the company context; flags missing info rather than inventing it
- **Prompt injection resistance** — ignores off-task instructions and stays in recruiting mode
- **Honest qualification** — acknowledges potential mismatches directly instead of overselling

## Agent Brain

The sandbox displays a live Agent Brain panel for each agent response, showing:

| Field | What it means |
|---|---|
| candidateIntent | What the candidate is trying to learn or accomplish |
| sentiment | Engagement level, grounded in quoted phrases |
| knownFactsUsed | Facts from company context actually used in the response |
| missingFacts | High-risk fields asked about with no context available |
| hallucinationRisk | Low / Medium / High — triggers guardrails UI |
| strategy | The agent's planned approach for this response |
| nextGoal | What the response is designed to achieve |
| confidence | 0–100 confidence in the analysis |
| shouldContinueConversation | Whether it makes sense to keep pursuing this candidate |
| candidateFitSignal | Strong / Neutral / Weak / Potential mismatch / Off-task |

## How the agent handles any message

The agent does not have a fixed list of supported scenarios. Every candidate reply — no matter what it says — goes through the same classification pipeline before a response is written:

1. **Evidence extraction** — verbatim quotes are pulled from the message
2. **Candidate state classification** — the message is placed into one of 10 stages (Curious, Interested, Skeptical, Objection/Concern, Needs factual detail, Bad fit/mismatch, Ready to schedule, Not interested, Off-topic/prompt injection, Unclear/ambiguous)
3. **Action selection** — the agent picks the single best action from 9 options based on the candidate's stage, fit, and what facts are known vs. unknown
4. **Hallucination check** — any high-risk field mentioned (compensation, remote policy, visa, benefits, equity, team size, funding, interview process, start date, etc.) is flagged if it is not in the provided company context
5. **Response generation** — the reply is written to execute the chosen action, grounded only in known facts

The outreach sequence is only the agent's initial plan. The live conversation is dynamic: every candidate reply is classified into a candidate state, and the agent chooses the next best action instead of blindly advancing through a fixed sequence.

## Quick reply chips

The sandbox includes 28 chips organized by scenario type. These are representative examples — the agent handles any free-text message the same way.

**Missing context** (triggers hallucination guardrails): Salary, Remote, Visa, Benefits, Equity, Team size, Interview process, Start date

**Positive signals**: Interested, Next steps

**Role and company questions**: Company, Why me, Day to day, More info

**Objections**: Startup risk, Job security, Too senior, Remote only

**Bad fit / mismatch**: Chill role, No culture

**Disengagement**: Not interested, Happy here, Got an offer

**Ambiguous / passive**: Maybe, Need time, Tell me more

**Off-task / adversarial**: Inject, Wrong AI

## What to verify in the Agent Brain for any message

For every reply, expand the Agent Brain trace and check:

- **Candidate stage** — correct classification of what the message signals
- **Dynamic next action** — action chosen based on stage, not message order
- **Known facts used** (green chips) — only facts present in the company brief
- **Missing facts** (red/amber chips + guardrails banner) — shown when a high-risk field was requested but not provided
- **Hallucination risk** — High triggers the guardrails banner; agent reply must not contain invented details
- **Candidate fit signal** — Strong / Neutral / Weak / Potential mismatch / Off-task
- **Status footer** — Continuing / Scheduling / Qualifying out / Disengaging / Flagging missing info

## Stack

- Next.js 15 App Router
- Anthropic SDK (claude-sonnet-4-6)
- ReAct loop with SSE streaming
- Tailwind CSS v3
- Plus Jakarta Sans

## Setup

```bash
npm install
# add ANTHROPIC_API_KEY to .env.local
npm run dev
```
