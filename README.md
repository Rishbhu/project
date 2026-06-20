# Autonomous Recruiting AI Agent

Built by Rishul :)

A mini web app for configuring, previewing, and testing autonomous recruiting agents from company context.

## Overview

This project was built for the PSVIEW Founding Engineer technical test.

The app lets a user enter company context — what the company does, its culture, the candidate profile, and the preferred tone — then generates a recruiting agent that configures itself from that context.

The agent creates its own identity, personality, communication style, outreach plan, and candidate engagement strategy. Users can then test the agent in a sandbox by manually simulating candidate replies.

This is a simulator only. It does not send real emails, LinkedIn messages, or outreach.

## What I Built

* Company context setup form
* Self-configuring recruiting agent
* Agent identity and personality generation
* 3-message outreach sequence
* Conversation sandbox for candidate replies
* ReAct-based agent reasoning loop
* Dynamic candidate state classification
* Agent Brain panel showing intent, stage, next action, risk, and fit signal
* Guardrails for hallucination, prompt injection, missing facts, and bad-fit candidates
* Server-Sent Events streaming for live reasoning updates
* Company context importer — paste any brief and extract structured fields via LLM
* Known / Unknown Facts Registry — what the agent may state vs. fields it must never invent
* Agent Audit — automatically runs adversarial test cases and returns a 0–100 readiness score

## Why This Is Not Just an LLM Wrapper

The agent does not simply take a prompt and generate a reply.

It uses a ReAct-style reasoning loop — Reason, Act, Observe, Respond — to analyze each candidate message before writing a final response. Instead of blindly generating copy, the agent first classifies the candidate’s intent, updates conversation state, selects a next best action, applies factuality guardrails, and then produces a grounded candidate-facing message.

The outreach sequence is only the initial plan. Once the candidate replies, the conversation becomes dynamic.

## Agent Reasoning Flow

Each candidate reply goes through a structured ReAct pipeline:

1. `analyze_candidate_signal`
   Extracts evidence from the candidate message, classifies intent, sentiment, candidate stage, fit signal, missing facts, hallucination risk, and next best action.

2. `plan_next_moves`
   Builds a conversation plan from the full conversation history, including current phase, tactic, next move, unresolved objections, and contingency.

3. Optional tools
   The agent can use additional context tools for candidate profile signals, role market context, or company talking points.

4. Final reply
   The agent writes a grounded candidate-facing response with one question max and no invented facts.

This makes the agent adaptive instead of sequence-driven. It responds based on candidate state and context, not hardcoded message order.

## Guardrails

The agent follows four core principles:

* Evidence only: candidate signals come from the actual candidate message
* No hallucinated facts: missing salary, remote policy, visa, benefits, equity, or process details are flagged instead of invented
* Prompt injection resistance: off-task instructions are ignored
* Honest qualification: the agent can identify poor fit and avoid overselling

## Agent Audit

The app includes an Agent Audit system that stress-tests the configured agent against adversarial and realistic candidate replies.

The audit checks whether the agent can:

* Avoid hallucinating compensation
* Avoid guessing remote or visa policy
* Resist prompt injection
* Qualify bad-fit candidates honestly
* Move interested candidates toward scheduling
* Use company context instead of generic recruiting copy

Each audit returns a readiness score from 0–100.

## Tech Stack

* Next.js 16 App Router
* React 19
* TypeScript
* Tailwind CSS v3
* Next.js API Routes
* Anthropic SDK
* Claude Sonnet
* ReAct-style reasoning loop
* Server-Sent Events with `ReadableStream`
* `localStorage` for client-side state

## Architecture

Pages:

* `/` — setup page for company context
* `/agent` — agent self-configuration and audit page
* `/sandbox` — conversation simulator

API routes:

* `POST /api/configure`
  One-shot LLM call that generates the agent identity, personality, reasoning block, capabilities, and outreach sequence.

* `POST /api/reply`
  Runs the ReAct conversation loop and streams reasoning events back to the UI.

* `POST /api/audit`
  Runs adversarial test cases against the configured agent, streams results via SSE, and returns a 0–100 readiness score.

* `POST /api/extract`
  Accepts pasted company or job-description text and extracts structured company context fields.

## Running Locally

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

Run the app:

```bash
npm run dev
```

Open:

```bash
http://localhost:3000
```

## Personal Note

I built this to feel less like a message generator and more like the kind of agent I would want to trust before letting it touch real candidates.

The interesting part is not just the final message. It is what happens before the message: understanding intent, deciding whether to answer, clarify, qualify, or disengage, and avoiding unsafe guesses when important facts are missing.

That is why I focused on the Agent Brain, dynamic next actions, guardrails, and the audit system.

— Rishul

## One-Line Summary

A company-aware recruiting agent that configures itself from context, runs dynamic candidate conversations through a ReAct-style reasoning loop, explains its decisions through an Agent Brain UI, avoids hallucinated facts, and audits itself against adversarial scenarios before deployment.
