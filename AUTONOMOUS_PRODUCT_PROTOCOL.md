# Autonomous Product Protocol

Permanent operating rules for the Gaime1 autonomous product studio. Read only
the section relevant to the current stage in `PROJECT_STATE.md`.

## Mission (highest priority)

Find and validate a compelling digital product — not a game — that solves a
meaningful problem, communicates its value quickly, has a credible acquisition
or sharing loop, and can support a commercially valuable software business.

The objective is not the smallest finished app, another generic AI wrapper, a
basic dashboard or a trivial single-purpose tool. The objective is to discover
whether there is a distinctive, useful, shareable and potentially monetizable
product concept worth continuing. The full commercial product may eventually
need human developers, designers, marketers, financing or partnerships — but
the key user-value, distribution and commercial assumptions must be testable
through economical prototypes.

## Non-negotiable principles

- Do not optimize for making the smallest completed app.
- Do not select the first technically viable concept.
- Do not confuse "easy to build" with "worth using".
- Do not create a generic AI chat interface with a thin prompt layer.
- Do not create a generic productivity dashboard without a strong
  differentiated workflow.
- Do not create a trivial calculator, checklist, link collection, note-taking
  tool or CRUD application unless it introduces a genuinely valuable new behavior.
- Do not assume "uses AI" is sufficient differentiation.
- Do not assume adding social sharing creates virality.
- Do not assume freemium creates monetization.
- Do not assume users will change behavior without strong value or reduced friction.
- Do not confuse documentation with progress.
- Do not claim market validation from AI judgment alone.
- Separate verified facts, strong proxies, weak proxies, assumptions,
  creative judgments and unknowns (see Evidence classifications).
- Test the hardest important assumption, not merely the easiest feature.
- Preserve the last known good runnable build.
- Keep all third-party services, dependencies and licences documented in
  `THIRD_PARTY_SERVICES.md`.
- Never add secrets to the repository.
- Do not connect unrelated services.
- Do not ask the founder for normal product, design or technical decisions.
- When blocked on one task, continue another independent task.
- Do not create meaningless filler merely to consume tokens.
- Do not publish publicly, spend money, contact users, send email, create
  advertisements or activate paid services without explicit founder approval.
- Do not implement deceptive growth mechanisms, spam, dark patterns or
  manipulative monetization.
- Respect privacy, data minimization and user consent.

## Primary decision hierarchy

When objectives conflict, prioritize in this order:

1. Strength and urgency of the user problem
2. Clarity and magnitude of user value
3. Speed with which a user can experience value
4. Strength of the product's distribution or sharing mechanism
5. Credible willingness to pay
6. Frequency of use or repeat value
7. Differentiation and defensibility
8. Feasible route to prototype and launch
9. Technical polish
10. Documentation

Documentation is useful only when it improves decisions or preserves continuity.

## What "viral potential" means

Do not use the word "viral" loosely. A product has credible organic-growth
potential only when one or more of these mechanisms are naturally part of the
user value:

- users create outputs they genuinely want to publish;
- users benefit when they invite other people;
- recipients of a shared output can become users;
- the product creates useful public pages or artefacts;
- collaboration improves the experience;
- usage creates visible social proof;
- users repeatedly show the result to others;
- the product solves a problem users naturally discuss;
- templates, embeds, exports or integrations distribute the product;
- the product improves as relevant users or data are added.

The product must not rely on: spam invitations; forced contact access; fake
scarcity; misleading sharing; manipulative referral rewards; posting without
explicit user action; growth loops that reduce trust.

For every proposed concept, identify **separately** (do not conflate them):

- the user-value loop;
- the retention loop;
- the distribution loop;
- the monetization loop.

## Evidence classifications

Every important product or commercial conclusion must be classified as one of:

- `VERIFIED FACT` — supported by a reliable current source or direct
  implementation evidence
- `STRONG PROXY` — indirect evidence that materially supports the conclusion
- `WEAK PROXY` — suggestive but unreliable evidence
- `ASSUMPTION` — currently untested
- `CREATIVE JUDGMENT` — a taste-based product or design decision
- `UNKNOWN` — insufficient evidence

Do not present assumptions as validation. Do not claim an overnight prototype
proves: market demand; retention; willingness to pay; virality; product-market
fit; revenue potential; scalable user acquisition.

## Stage 1: Brief opportunity research

Use current public evidence where internet access permits. Research:

- painful or inefficient existing workflows;
- underserved user groups;
- fast-growing or changing behaviours;
- newly possible products created by technology changes;
- existing products with visible user frustration;
- products with weak user experience despite meaningful demand;
- manual workflows people repeatedly perform;
- products with natural sharing or collaboration;
- categories with credible monetization;
- categories where distribution is especially difficult;
- legal, privacy or operational barriers.

Research informs decisions but must not consume more than ~20% of the first
autonomous run. Do not conduct endless broad research. Record findings in
`USER_RESEARCH.md` with evidence classifications.

## Stage 2: Generate concepts

Generate at least 10 meaningfully different non-game digital product concepts
in `CONCEPTS.md`. Ensure diversity across: target user; problem category;
business model; usage frequency; individual vs team; consumer vs professional;
creation vs analysis vs automation; public vs private outputs; standalone vs
integration; immediate utility vs recurring workflow; organic distribution
mechanism; technical complexity.

Evaluate each concept concisely against the full checklist in `CONCEPTS.md`
(target user through cheapest falsification experiment). Do not produce ten
superficial variations of the same AI tool.

## Stage 3: Select two finalists

Do not choose the final product only from written scoring. Choose two
**substantially different** finalists. Preserve at least one unconventional
high-conviction concept even if conventional scoring is weaker.

Each finalist must have: a clearly identifiable target user; a specific
problem; a concrete user outcome; a plausible first-use journey; a measurable
activation event; a plausible distribution mechanism; a plausible monetization
mechanism; an economical prototype path.

Reject concepts that depend primarily on: vague future network effects; large
user volumes before becoming useful; expensive proprietary data; regulated
activities without a realistic compliance route; broad two-sided marketplaces;
behaviour change unsupported by immediate value; substantial manual operations
disguised as software; unclear ownership of generated content; unlicensed
external data; unrealistic infrastructure costs.

Record the selection and rationale in `DECISION_LOG.md`.

## Stage 4: Build two competing prototypes

Create a small functional prototype for **both** finalists. Each prototype
must test the most important uncertain assumption behind its concept, and let
a user experience the central product value. Do not build only a landing page
unless the experiment is specifically about demand messaging.

Examples: if the concept depends on transforming user input into a valuable
result, build that transformation; if on collaboration, test the collaboration
workflow; if on a shareable output, create the output and the recipient
experience; if on automation, execute a real safe automation; if on analysing
files or data, implement the real analysis path; if on personalization, test
whether personalization materially changes the result; if on repeated use,
implement at least one meaningful returning-user loop.

Do not spend early time on: elaborate authentication; billing infrastructure;
extensive settings; admin dashboards; broad role systems; complex design
systems; large integration libraries; notification systems; production
analytics; full mobile apps; large databases; decorative marketing pages;
general architecture unrelated to the core proof. Minimal authentication is
acceptable only if necessary to test the actual product value.

## Stage 5: Compare using implementation evidence

Run and inspect both prototypes. Compare: time to first value; clarity of the
user journey; strength of the result; usefulness without explanation;
repeat-use potential; organic distribution potential; monetization
credibility; technical feasibility; operational burden; privacy and legal
risk; infrastructure cost; differentiation; whether the core promise is
actually present.

Choose one winner and preserve the other as fallback. Record in
`DECISION_LOG.md`: why the winner was selected; what evidence supports the
decision; what remains unknown; what could invalidate the decision; why the
fallback lost.

## Stage 6: Develop the winner

Develop through repeated loops:

1. Identify the highest-value unresolved assumption.
2. Define a measurable experiment or implementation task.
3. Implement the smallest meaningful version.
4. Run the application.
5. Complete the intended user journey.
6. Inspect the actual result.
7. Record evidence and weaknesses (`EXPERIMENT_LOG.md`).
8. Improve, remove or replace weak work.
9. Commit the verified state.
10. Update project state and backlog.
11. Immediately begin the next valuable task.

One completed task, one prototype, one successful deployment or three passing
tests do not mean the session is complete. Continue while meaningful work and
runtime remain.

Prioritize: 1. core user outcome; 2. time to first value; 3. clarity of
onboarding; 4. quality of the generated or delivered result; 5. repeat-use
value; 6. distribution or sharing loop; 7. trust and transparency;
8. monetization fit; 9. visual polish; 10. technical scalability.

## Stage 7: Morning assessment

Write `MORNING_REPORT.md`, beginning with the line:

> Use the product before reading the analysis.

Prepare: a runnable application; exact local setup instructions; a deployed
preview where feasible and safe; test credentials only when necessary and
never committed as secrets; at least three useful screenshots; one image
clearly demonstrating the core value; a short walkthrough or GIF where
technically possible; explanation of both prototypes; why the winner was
selected; what was actually proven; what remains assumed; target user; core
user journey; activation event; retention hypothesis; distribution
hypothesis; monetization hypothesis; likely business model and price range;
prototype scope vs launch scope; likely staffing and production requirements;
key legal, privacy and operational risks; strongest evidence for continuing;
strongest evidence against continuing; next validation experiment; and a
recommendation: `CONTINUE` / `CONTINUE WITH CONDITIONS` / `PIVOT` / `KILL`.

## Product validation principles

The autonomous system may internally test: technical correctness; workflow
completion; time to result; usability problems; broken states; clarity of
copy; whether sharing works; whether outputs are internally coherent; whether
repeat-use mechanics exist; whether intended integrations function.

It **cannot** independently prove: that real users care; that users will pay;
that users will return; that users will share; that the product is
emotionally compelling; that the market is large enough; that acquisition
will be economical. Record these limits honestly.

Prepare future external-validation materials where useful: concise product
explanation; screenshots; shareable demo; landing-page copy; waitlist page;
pricing hypothesis; interview questions; usability-test script; measurable
activation event; funnel hypotheses. Do not publish or contact users without
founder approval.

## Technology selection

Select the stack based on: suitability for the selected product; speed to a
functional prototype; autonomous build reliability; ease of testing;
deployment simplicity; security; operating cost; availability of maintained
libraries; maintainability; compatibility with likely integrations; ability
to create a polished web experience.

Prefer a web application unless the product clearly requires desktop, mobile,
browser extension, command-line or another platform. Do not build unnecessary
custom infrastructure. Do not choose a stack only because it is familiar.
Document the decision briefly in `DECISION_LOG.md` and record build/run/test
commands in `CLAUDE.md`.

## Privacy, legal and trust requirements

For every concept consider: what user data is collected; whether it is
sensitive; whether the product can work with less data; whether external APIs
receive user data; whether user content is stored; whether deletion is
possible; whether the user understands what the system is doing; whether
outputs could cause harm; whether human review is required; whether the
product enters a regulated category; whether terms, consent or disclaimers
may be needed.

Avoid high-risk concepts involving: medical diagnosis; autonomous financial
trading; legal decision-making; surveillance; deceptive impersonation;
non-consensual data collection; illegal scraping; unsafe automation;
unrestricted autonomous external actions. A useful product in a sensitive
area is not automatically prohibited, but the concept must include a
realistic safety and compliance route.

## Third-party services and licences

Document every dependency or service in `THIRD_PARTY_SERVICES.md` (purpose,
source, licence, data sent, cost, free-tier limits, lock-in risk,
replacements). Do not add paid services without founder approval. Do not use
unknown or unmaintained packages when a reliable alternative exists. Do not
use copyrighted, scraped or proprietary data without a clear legal basis.

## Supply-chain and security rules

- No secrets in the repository; no hardcoded API keys; use `.env.example`.
- Avoid obscure or unnecessary packages; prefer official SDKs and established
  dependencies; inspect package names and installation scripts before use.
- Do not execute untrusted downloaded binaries.
- Do not enable public write access.
- Do not deploy an unauthenticated product that creates meaningful abuse risk.
- Do not connect the repository to production systems.

## Session safety

Every session must check whether another session appears to be modifying the
repository before writing (mechanism in `CLAUDE.md`: fetch, inspect the last
commit's timestamp and origin; if another session was active within ~30
minutes, do read-only work or exit safely). Never force-push. Create a Git
checkpoint before risky changes. If the build is broken and cannot be
repaired efficiently, return to the last known good commit.
