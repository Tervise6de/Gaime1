# CONCEPTS

Concept portfolio, Stage 2 — generated 2026-07-11 from classified research in
`USER_RESEARCH.md`. 12 concepts. Diversity axes covered: consumer vs
professional, single-use vs recurring, individual vs collaborative,
automation / creation / analysis / decision support / transformation, public
vs private outputs, subscription / credits / one-time / per-event
monetization, and distinct organic loops (recipient, embed, public artifact,
family sharing, trust, cross-vendor, timing wedge).

Evidence classes: VERIFIED FACT / STRONG PROXY / WEAK PROXY / ASSUMPTION /
CREATIVE JUDGMENT / UNKNOWN.

---

## C-1: ChaseList — client document collection for bookkeepers & firms
- Target user: solo bookkeepers and small accounting firms (5–200 clients).
- Problem: chasing clients for receipts/statements across email; requests lost, tracking is mental overhead.
- Current alternative: manual email + generic portals (SmartVault) or expensive practice suites (Karbon, Content Snare).
- Why it matters: hundreds of non-billable hours/yr; blocks month-end close. [STRONG PROXY]
- Core outcome: every open request visible; clients fulfill via a no-login link; reminders automatic.
- First-use journey: create request list → send link → client uploads → checklist auto-ticks.
- Time to first value: <10 min (first request list sent).
- Reason to return: monthly/quarterly close cycles recur by nature.
- Distribution loop: every request is client-facing; clients who run businesses see it monthly ("recipient is the ad"). [ASSUMPTION on conversion]
- Reason to pay: directly recovers billable hours; per-client scale pricing.
- Business model: subscription $29–79/mo by active clients.
- Price range: $29–79/mo. Comparables: Content Snare (~$35+/mo), Keeper, Karbon (enterprise-ish).
- Differentiation: zero-friction recipient side (no login, mobile photo upload), auto-reminder cadence, accountant-specific templates. [CREATIVE JUDGMENT]
- Prototype scope: request list builder + public upload link + status board. Launch scope: + reminders, templates, integrations (QBO), branding.
- Hardest user-value assumption: recipient friction (client behavior) is the real bottleneck, not the sender's tracking.
- Hardest distribution assumption: recipients notice/care enough to convert.
- Hardest monetization assumption: solo bookkeepers pay when Content Snare exists (must undercut or out-focus).
- Hardest technical/operational risk: low — file handling + notifications. Privacy: client financial docs (sensitive; needs encryption, retention policy).
- Cheapest falsification: prototype the full request→upload→track loop; measure friction ourselves; landing test later.

## C-2: DrawDesk — AIA-style pay application builder for subcontractors
- Target user: commercial subcontractors billing progress payments (and small GCs).
- Problem: G702/G703 continuation sheets rebuilt monthly in Excel; retainage/rounding errors get pay apps rejected → ~30-day payment delays. [STRONG PROXY; exact figures WEAK PROXY]
- Current alternative: Excel templates; Procore/Textura at enterprise prices.
- Why it matters: direct cash-flow impact (subcontractor DSO ~96 days).
- Core outcome: mathematically correct, professional pay-app package generated from a schedule of values in minutes.
- First-use journey: import/enter schedule of values → enter this period's progress → get validated G702/G703-style PDF.
- Time to first value: <15 min.
- Reason to return: every billing period (monthly), previous-period values carry forward automatically — natural lock-in.
- Distribution loop: pay app lands on the GC's desk every month; GCs see clean apps and can push it to other subs. [ASSUMPTION]
- Reason to pay: getting paid ~30 days sooner dwarfs the subscription cost.
- Business model: subscription per company, $49–99/mo. Comparables: Siteline (enterprise-leaning), PayEarned, raw AIA doc fees.
- Differentiation: self-serve, Excel-import, priced for the long tail Procore ignores. [CREATIVE JUDGMENT]
- Prototype scope: SOV table + period entry + validated math + PDF output. Launch scope: + multi-project, change orders, GC share links, e-sign.
- Hardest user-value assumption: subs trust a new tool with billing math (vs their known-devil spreadsheet).
- Hardest distribution assumption: GC-side visibility converts (GCs are not the buyer).
- Hardest monetization assumption: long-tail subs buy software at all (many are spreadsheet-native).
- Hardest technical/operational risk: form fidelity — AIA forms are copyrighted; must produce equivalent non-infringing formats (real legal constraint). [VERIFIED FACT that AIA licenses its forms]
- Cheapest falsification: build the SOV→validated PDF path; verify math against published examples; check the copyright boundary.

## C-3: TalkQuote — voice-to-paperwork for trades
- Target user: solo contractors/technicians (plumbing, electrical, landscaping).
- Problem: quotes and invoices don't get written on jobsites; jobs lost or billed late.
- Current alternative: memory + evening typing; heavyweight FSM suites (Jobber, ServiceTitan) that still require typing.
- Why it matters: unsent quote = lost revenue; STRONG PROXY (multiple 2025–26 entrants, none dominant).
- Core outcome: speak the job on-site → structured, priced quote/invoice PDF ready to send before leaving the driveway.
- First-use journey: tap record → talk 60s → review auto-structured quote → send link/PDF.
- Time to first value: <5 min. Transcription cost basis: VERIFIED FACT (~$0.15–0.36/hr).
- Reason to return: every job.
- Distribution loop: quote/invoice link is customer-facing; homeowners forward quotes; footer converts other trades. [ASSUMPTION]
- Reason to pay: revenue attribution (quotes actually sent = jobs won).
- Business model: subscription $19–39/mo, generous trial. Comparables: VoxTrade, Nora, Ari (all early); Jobber ($69+/mo).
- Differentiation: mobile-web (no app install), quote-first (not full FSM), speed. [CREATIVE JUDGMENT]
- Prototype scope: record → transcribe → structured quote → shareable link/PDF. Launch scope: + price books, follow-ups, invoice/payment integration.
- Hardest user-value assumption: LLM structuring is accurate enough that review takes seconds, not minutes (else no better than typing).
- Hardest distribution assumption: tradespeople discover web tools (channel: word of mouth/YouTube; slow).
- Hardest monetization assumption: this audience pays for "just quotes" vs waiting to need full FSM.
- Hardest technical/operational risk: noisy-audio accuracy; mobile browser recording quirks.
- Cheapest falsification: build the record→quote path; test with realistic noisy voice memos; measure edit distance from spoken input to correct quote.

## C-4: InkLine — historical handwriting transcription & shareable family documents
- Target user: family historians/genealogists (large hobbyist market skewing 50+), small archives.
- Problem: inherited letters, wills, parish registers they cannot read; specialist tools (Transkribus) need training effort.
- Current alternative: squinting, Facebook groups, paid human transcribers ($$$), Transkribus.
- Why it matters: emotionally meaningful (family identity); newly possible: LLMs beat specialist HTR — <2% CER, ~1/50th cost. [VERIFIED FACT, peer-reviewed 2025]
- Core outcome: upload a scan → faithful side-by-side transcription with uncertainty highlighting → a beautiful shareable document page for the family.
- First-use journey: drag in one photo of a letter → watch transcription appear beside the original → share the artifact page with relatives.
- Time to first value: <3 min.
- Reason to return: collections come in boxes, not single pages; each document is another session.
- Distribution loop: the shared family artifact page is the ad — relatives are exactly the next users (genealogy is inherently familial/collaborative). [ASSUMPTION, but structurally strong: recipient = target user]
- Reason to pay: per-collection volume; human-priced alternative is expensive; emotional value supports payment.
- Business model: credits (e.g. 5 pages free, packs from $9) + subscription for heavy users/archives.
- Price range: $9–29 packs; $10–20/mo power tier. Comparables: Transkribus, MyHeritage Scribe AI, Ancestry Transcribe (both locked inside their ecosystems), handwritingocr.com.
- Differentiation: standalone (no subscription-ecosystem lock-in), uncertainty-honest transcription (provenance per NGS 2025 AI standards), shareable artifact pages incumbents don't offer. [CREATIVE JUDGMENT + STRONG PROXY that incumbents lock features in-platform]
- Prototype scope: upload → vision-LLM transcription with confidence marking → public artifact page. Launch scope: + collections, PDF/GEDCOM export, batch, archive plan.
- Hardest user-value assumption: transcription quality on real user scans (not benchmark sets) is good enough to delight.
- Hardest distribution assumption: recipients (relatives) convert to users rather than just reading.
- Hardest monetization assumption: hobbyists pay standalone rather than waiting for Ancestry's built-in feature.
- Hardest technical/operational risk: vision-LLM cost/quality on poor scans; incumbent fast-follow. Privacy: family documents (sensitive-ish; consent within families UNKNOWN).
- Cheapest falsification: run 10–20 public-domain handwritten documents through the pipeline; publish artifact pages; inspect quality honestly.

## C-5: Vaultless — browser-local private document toolkit
- Target user: compliance-sensitive professionals (legal, HR, finance ops, EU/GDPR) who won't upload client documents to cloud tools.
- Problem: need statement→CSV extraction, redaction, conversion — but cloud upload is prohibited by policy or trust.
- Current alternative: manual retyping; self-hosted Stirling-PDF (69k stars, 25M+ downloads — mass demand, VERIFIED) which non-technical users can't run.
- Why it matters: privacy is the purchase driver (Plausible pattern: paid, private alternative with NO free-user moral hazard — VERIFIED $3.1M ARR).
- Core outcome: "your file never leaves this tab" — extraction/redaction runs via WASM/WebGPU locally; provably no upload (network tab is empty).
- First-use journey: drop a bank statement → table appears → download CSV; visible "0 bytes uploaded" indicator.
- Time to first value: <2 min.
- Reason to return: recurring document processing (monthly statements, HR docs).
- Distribution loop: weakest of the portfolio — trust-driven word of mouth in compliance communities; "provably local" is discussion-worthy. [WEAK]
- Reason to pay: privacy IS the paid boundary (no free cloud alternative is acceptable to these users); one-time license viable (BYO compute — TypingMind pattern, VERIFIED >$1M).
- Business model: one-time license $49–99 or annual $79; team licenses.
- Comparables: Stirling-PDF (self-host), DocuClipper etc. (cloud — disqualified for this user), desktop tools.
- Differentiation: zero-install + zero-upload simultaneously; auditable client-side claim. [CREATIVE JUDGMENT]
- Prototype scope: in-browser statement→CSV for common formats + redaction. Launch scope: + more doc types, team licensing, offline PWA.
- Hardest user-value assumption: in-browser models are accurate enough for messy real documents (WebGPU models ≪ frontier cloud models).
- Hardest distribution assumption: reaching compliance-sensitive buyers without content marketing spend.
- Hardest monetization assumption: they trust an unknown vendor's "local" claim enough to pay.
- Hardest technical/operational risk: HIGH — client-side extraction quality; device variability; large model downloads.
- Cheapest falsification: technical spike — run in-browser extraction on 5 real statement formats; measure accuracy vs cloud baseline.

## C-6: DuesLedger — treasurer toolkit for self-managed HOAs
- Target user: volunteer treasurers of small self-managed HOAs/condos (long tail below management-company size).
- Problem: matching deposits to units, dues reconciliation in spreadsheets (~11 hrs/mo reported for 60 units), awkward late notices to neighbors. [WEAK PROXY, vendor anecdote]
- Current alternative: spreadsheets + personal banking; AppFolio/Buildium have unit minimums and $298+/mo floors. [STRONG PROXY]
- Core outcome: per-unit ledger that reconciles itself; owners get a payment/statement portal.
- First-use journey: import unit list → record dues schedule → send owner statement links.
- Time to first value: ~30 min (setup-heavy).
- Reason to return: monthly dues cycle; annual budgets.
- Distribution loop: every homeowner touches the portal; board turnover carries it to other HOAs. [ASSUMPTION, slow]
- Reason to pay: recovered dues leakage + volunteer time; association budget exists.
- Business model: $29–79/mo per association (association pays, not the volunteer).
- Comparables: AppFolio/Buildium (too big), PayHOA, Solume (emerging).
- Differentiation: built for volunteers not managers; radical simplicity. [CREATIVE JUDGMENT]
- Prototype scope: unit ledger + dues tracking + owner statement page. Launch scope: + payments (needs processor — money movement!), budgets, docs.
- Hardest user-value assumption: volunteers adopt software mid-tenure (setup energy).
- Hardest distribution assumption: reaching scattered volunteer boards economically.
- Hardest monetization assumption: boards approve spending without procurement pain.
- Hardest technical/operational risk: real payments = money transmission adjacency, support burden; sensitive neighbor finance data.
- Cheapest falsification: prototype ledger + statement page; defer payments entirely.

## C-7: EchoPress — automatic audio editions for newsletters & courses
- Target user: newsletter authors (Substack/Ghost/beehiiv) and course creators.
- Problem: audiences want listenable versions; recording is a production chore; per-episode human narration is uneconomical.
- Current alternative: don't do it; record manually; ElevenLabs DIY pipelines.
- Why it matters: TTS quality-cost inflection ($15/1M chars — VERIFIED) makes auto audio editions ~free; creator WTP for audience growth is proven in adjacent tools. [STRONG PROXY]
- Core outcome: publish post → audio edition + embeddable player + private podcast feed appear automatically.
- First-use journey: paste RSS/post URL → hear your article in 60s → embed the player.
- Time to first value: <5 min.
- Reason to return: automatic per-post; retention is structural once installed.
- Distribution loop: the embedded player on every post is the ad ("Powered by" on free tier — Tally/Senja pattern, VERIFIED for that boundary); private podcast feeds travel to listeners' apps.
- Reason to pay: remove branding, custom voice, feed limits, minutes volume.
- Business model: freemium with hard boundaries, $9–29/mo. Comparables: an existing crowded-ish field (Ad Auris-style tools have come and gone — churn in category is a warning). [WEAK PROXY]
- Differentiation: set-and-forget RSS automation + podcast-feed distribution vs per-article tools. [CREATIVE JUDGMENT]
- Prototype scope: URL→audio→player page. Launch scope: + RSS automation, feeds, voices, publisher analytics.
- Hardest user-value assumption: listeners actually use audio editions (creators buy only if audiences listen — UNKNOWN, and prior entrants' churn suggests weak).
- Hardest distribution assumption: player embeds convert other creators.
- Hardest monetization assumption: freemium boundary strong enough without huge top-of-funnel (Tally needed ~300K free users — VERIFIED warning).
- Hardest technical/operational risk: low technically; TTS licensing terms for redistribution need checking.
- Cheapest falsification: URL→audio→player prototype; measure own listen-through on sample posts (weak signal only).

## C-8: ListingReel — data-to-video generator for real-estate agents
- Target user: residential real-estate agents (solo/small teams) posting on Instagram/TikTok.
- Problem: every listing needs a polished vertical video; editors cost $50–200/video; DIY takes hours.
- Current alternative: Canva templates (manual), hiring editors, not posting.
- Why it matters: agents' marketing spend is habitual and vanity-sensitive; programmatic video is commodity now (Remotion/JSON2Video — VERIFIED).
- Core outcome: paste listing photos + facts → broadcast-quality branded vertical video in minutes.
- First-use journey: upload 8 photos + address/price → 30s video renders → download/post.
- Time to first value: <10 min.
- Reason to return: every new listing.
- Distribution loop: videos are posted publicly with subtle style watermark; other agents ask "what made this" (Screen Studio pattern — STRONG PROXY).
- Reason to pay: direct replacement of editor spend; per-render usage boundary (ScreenshotOne pattern — VERIFIED).
- Business model: $29–59/mo with render limits.
- Comparables: Animoto, Canva, various "AI listing video" entrants — crowded adjacent space. [WEAK PROXY on whitespace]
- Differentiation: fully automatic from listing data (zero timeline editing); distinctive motion style. [CREATIVE JUDGMENT]
- Prototype scope: photos+facts→rendered MP4 via one strong template. Launch scope: + templates, branding kits, MLS import, scheduling.
- Hardest user-value assumption: output quality clears the "proud to post" bar without manual tweaking.
- Hardest distribution assumption: style watermark actually triggers inquiries.
- Hardest monetization assumption: agents pay monthly vs per-listing one-offs.
- Hardest technical/operational risk: render infrastructure cost/time; template quality is the whole product.
- Cheapest falsification: build one excellent template; render 3 sample listings; honestly judge against agent-posted videos.

## C-9: KickoffKit — white-label client onboarding portals for agencies
- Target user: marketing agencies and professional-services teams (2–20 people).
- Problem: kickoff requirements collected piecemeal across email/Slack/forms; projects stall waiting on clients.
- Current alternative: free templates (Asana/Jotform — proliferation is demand STRONG PROXY); Rocketlane/Dock upmarket.
- Core outcome: per-client branded portal: checklist, intake forms, file requests, status — client always knows what's owed.
- First-use journey: pick template → customize → send portal link to client.
- Time to first value: <15 min.
- Reason to return: every new client engagement.
- Distribution loop: strongest structural loop in the portfolio — every onboarding is client-facing by definition; clients are themselves businesses that onboard others. [ASSUMPTION on conversion]
- Reason to pay: fewer stalled projects; white-label/branding as boundary (Tally/Senja pattern — VERIFIED).
- Business model: $39–99/mo by active portals.
- Comparables: Content Snare, Dock, Rocketlane (all priced/positioned upmarket), Moxo.
- Differentiation: agency-sized pricing, minutes-not-days setup. [CREATIVE JUDGMENT]
- Prototype scope: portal builder + client view + file collection + progress. Launch scope: + branding, templates library, e-sign, integrations.
- Hardest user-value assumption: agencies maintain portals instead of regressing to email mid-project.
- Hardest distribution assumption: client-side exposure converts (clients may not be agency-like businesses).
- Hardest monetization assumption: differentiating from Content Snare/Dock enough to win deals.
- Hardest technical/operational risk: low-moderate; overlaps C-1 (could share core).
- Cheapest falsification: prototype portal + client view; walk both sides ourselves.

## C-10: GrantRadar — grant tracking & funder reporting for small nonprofits
- Target user: 1–3 person development teams at small/mid nonprofits.
- Problem: deadlines in spreadsheets, outcomes elsewhere; every funder report is manual reconciliation; missed deadlines jeopardize funding.
- Current alternative: spreadsheets; Instrumentl at ~$200+/mo; GrantHub being discontinued 2026 — a forced-migration wedge. [STRONG PROXY, single source — verify before building]
- Core outcome: one calendar of deadlines + per-grant requirement checklists + report-ready exports.
- First-use journey: import grants list → see unified deadline calendar → get reminder cadence.
- Time to first value: <20 min.
- Reason to return: reporting cycles; new applications.
- Distribution loop: WEAK — nonprofits share tool recommendations in associations/forums, but no artifact loop. Timing wedge substitutes for a loop short-term.
- Reason to pay: missed grant ≫ subscription; budget exists (they paid GrantHub).
- Business model: $29–59/mo (undercut Instrumentl).
- Comparables: Instrumentl, Submittable (adjacent), spreadsheets.
- Differentiation: purpose-built cheap migration target for stranded GrantHub users. [CREATIVE JUDGMENT]
- Prototype scope: grant list + deadlines + checklist + ICS export. Launch scope: + GrantHub import, team, funder report bundles.
- Hardest user-value assumption: tracking alone (without discovery, Instrumentl's moat) is worth paying for.
- Hardest distribution assumption: reaching stranded GrantHub users at migration moment without ads.
- Hardest monetization assumption: nonprofit procurement friction at even $29/mo.
- Hardest technical/operational risk: low tech; the wedge is time-limited — if migration window passes, no loop remains.
- Cheapest falsification: verify GrantHub sunset date/terms and community reaction (one evening of research).

## C-11: VowSuite — one shared coordination hub per wedding (couple + all vendors)
- Target user: engaged couples + their 5–10 vendors (photographer, planner, florist, venue, caterer, DJ).
- Problem: each vendor runs their own CRM (HoneyBook/Dubsado) optimizing their side; the couple juggles 8 fragmented email threads; vendors lack shared timeline/logistics. [STRONG PROXY on vendor-tool client-side pain — practitioner sources]
- Current alternative: email threads, spreadsheets, planner's private docs, group chats.
- Core outcome: one wedding = one hub: shared timeline, contacts, day-of schedule, files — every vendor and the couple aligned.
- First-use journey: couple (or planner) creates wedding → invites vendors by email → shared timeline populates.
- Time to first value: ~20 min, but requires multi-party adoption. [structural risk]
- Reason to return: weekly during planning; intense near the date. Single-event use — retention ends at the wedding by design.
- Distribution loop: DENSE — every wedding exposes 5–10 vendors, who work ~20–50 weddings/yr each and can seed it into every future wedding; vendors are the recurring node. [ASSUMPTION, but structurally unusual: cross-vendor exposure per event is higher than almost any B2B category]
- Reason to pay: vendors pay for a professional client-facing presence + fewer coordination emails; couples free.
- Business model: vendor subscriptions $15–39/mo; weddings free — vendor-seeded growth.
- Comparables: Aisle Planner/HoneyBook (vendor-side only), The Knot (directory/planning, not multi-vendor ops), group chats.
- Differentiation: the ONLY multi-vendor shared surface; everyone else optimizes one vendor's silo. [CREATIVE JUDGMENT — this is the unconventional high-conviction slot]
- Prototype scope: wedding hub + shared timeline + vendor invite flow (no auth beyond magic links). Launch scope: + day-of schedule runsheets, files, vendor profiles, planner tier.
- Hardest user-value assumption: enough value single-player (one vendor + couple) before all vendors join — multi-party cold-start.
- Hardest distribution assumption: vendors seed new weddings rather than treating it as one-off.
- Hardest monetization assumption: vendors pay for coordination (vs their CRM "good enough").
- Hardest technical/operational risk: moderate; seasonal usage; consumer support.
- Cheapest falsification: prototype hub + timeline; walk a realistic wedding scenario for one vendor + couple; judge single-player value honestly.

## C-12: QuoteCompare — normalize and compare contractor quotes for homeowners
- Target user: homeowners collecting 2–5 quotes for renovations/repairs.
- Problem: quotes arrive as inconsistent PDFs (lump sums vs line items, exclusions buried); comparing is guesswork on 4–5 figure decisions.
- Current alternative: spreadsheets, gut feel, asking friends.
- Why it matters: high-stakes infrequent decision; emotionally stressful. [ASSUMPTION — no direct demand evidence gathered]
- Core outcome: upload quote PDFs → normalized side-by-side comparison + "questions to ask each contractor" + red flags.
- First-use journey: drag 3 PDFs → comparison table appears → share link with spouse.
- Time to first value: <5 min. Extraction cost basis VERIFIED (~$0.0002/page).
- Reason to return: WEAK by design — single project; maybe years between uses.
- Distribution loop: shared comparison link (spouse/family); word of mouth after renovations (people discuss renovations naturally — STRONG PROXY of discussion, ASSUMPTION of referral).
- Reason to pay: one-time $9–19 per project (impulse-priced against a $20k decision).
- Business model: single-purchase per project; no subscription pretense.
- Comparables: none direct (novelty is real); indirect: Angi (leads, misaligned incentives), forums.
- Differentiation: consumer-side advocate; incumbents monetize contractors, not homeowners. [CREATIVE JUDGMENT]
- Prototype scope: multi-PDF extraction → normalized table + generated questions. Launch scope: + share pages, category templates, contractor-response flow.
- Hardest user-value assumption: extraction from wildly heterogeneous quote formats is reliable enough to trust on a big decision.
- Hardest distribution assumption: reach at the exact decision moment without paid acquisition (SEO is slow; no recurring users to compound).
- Hardest monetization assumption: consumers pay before seeing the comparison (paywall placement).
- Hardest technical/operational risk: extraction variance; liability tone (advice on big purchases — needs careful framing, not "recommendations").
- Cheapest falsification: run 6–9 real-world sample quotes through extraction; inspect table quality.

---

## Portfolio notes

- Structural overlap: C-1 and C-9 share a "request/collect via client-facing
  portal" core; at most one should reach the finalist round.
- Unconventional high-conviction candidates (protect from scoring): C-11
  (VowSuite — multi-vendor density) and C-4 (InkLine — emotional consumer +
  verified capability inflection + recipient-is-the-target-user loop).
- Weakest distribution loops: C-5, C-10, C-12 — each compensates elsewhere
  (privacy WTP, timing wedge, novelty).
- Status: all CANDIDATE. Finalist selection pending specialist evaluation.
