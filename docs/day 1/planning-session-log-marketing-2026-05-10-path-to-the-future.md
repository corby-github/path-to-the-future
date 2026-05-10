# I designed a game in 90 minutes that would have taken my team a week.

I sat down to start building a small Zelda-style narrative game called *Path to the Future: A Career of Choices*. Ninety minutes later I had a working movement engine, a complete design document, a 13-day build plan, and a reusable skill for documenting future sessions like this one. Here's what actually happened.

## What we built

In one continuous session with Claude, I produced:

- A **v1.0 design document** covering 18 sections — premise, room generator, state model, decision schema, random event system, mini-games, save architecture, visual style, the works.
- A **working Day 1 code spike** in TypeScript: movement engine, input hook, game loop, player SVG, demo room. Frame-rate-independent, ~150 lines.
- A **revised 13-day build plan** with save/load pulled forward, mini-games deferred, and a dedicated content-pass day.
- A **reusable skill** that documents sessions like this one — generic, not specific to this project, available in every future conversation.

## The numbers

- **Time spent:** ~91 minutes, continuous.
- **Traditional-team equivalent:** 3–5 working days for the same scope (1 PM, 1 engineer, 1 designer).
- **Compression ratio:** roughly **25–40× on the work that was actually done**, with the honest caveat that several real-world steps (stakeholder reviews, user research, visual mocks, performance spikes) were not in scope here.

## What surprised me

**The pushback was the value.** I went in expecting Claude to write code. Instead, the most useful moments were the ones where Claude refused to. When I said "make a generator that randomizes rooms" and also "room 1 always looks like room 1," Claude stopped and said: those are opposite goals. We resolved it (deterministic procedural — same seed, same room) in under a minute. In a team setting that would have been a week of building the wrong thing.

**Architecture mistakes got caught at the speed of typing them.** "Redux for everything" — flagged as a re-render trap before I even committed. "All 8 character classes for v1" — flagged as a content explosion. "Reproduce Kentucky Route Zero's aesthetic" — Claude was honest that we couldn't (it's 3D, custom shaders) but the *emotional register* was achievable in flat SVG. Each of these is a real bug that survives into real codebases because nobody on the team has done this specific shape before.

**The most valuable single move was mine, not Claude's.** After Claude wrote a perfectly good movement engine, I said: *"i hit enter early — there are things we missed, and that's okay."* That message redirected the entire session away from code and into design discovery. Without it, we'd have built a great engine for the wrong game.

## The catch

This was design discovery and a code spike, not a shipped feature. We did not do stakeholder interviews. We did not do user research. We did not produce visual design mocks. We did not run a performance spike to verify our SVG assumptions. We did not write any of the actual content (the 120 months of decisions). All of that is still real work.

What we did do — the architectural decisions, the scope conversations, the boundary-setting between systems, the build plan — is the part that usually takes the most calendar time in product work because it requires the most alignment. That's the part that compressed.

If you're a solo builder, the headline is: AI is a senior collaborator for the design conversation, not just a code generator. If you're on a team, the headline is more nuanced: you still need the team for the parts AI doesn't replace — but the design discussions that used to fill a week of meetings can now happen in an afternoon with a transcript.

## What's next

We're scaffolding the Vite project and going to code. Movement engine ports in, dev server comes up, Day 2 begins: collision and virtual coordinate system. I'll log that session too.

---

*A working session with Claude, 2026-05-10.*
