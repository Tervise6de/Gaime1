# USER_RESEARCH

Research notes and validation planning. Classify every claim (VERIFIED FACT /
STRONG PROXY / WEAK PROXY / ASSUMPTION / CREATIVE JUDGMENT / UNKNOWN).

**Never invent interviews or user feedback.** No real users have been
consulted; everything below is desk research from public sources
(2026-07-11, four parallel research passes, ~45 searches total).

## Target-user assumptions

- Professionals who repeatedly **request documents/inputs from external
  parties** (bookkeepers, accountants, agencies, subcontractors) lose real
  billable time to chasing — STRONG PROXY (paid category exists: Content
  Snare, Keeper; pain still cited as top blocker).
- **Compliance/privacy-sensitive users** avoid uploading documents to cloud
  tools; self-hosted privacy tooling has mass demand (Stirling-PDF: 69k
  GitHub stars, 25M+ downloads) but self-hosting friction excludes
  non-technical users — STRONG PROXY for demand, ASSUMPTION that
  browser-local removes the friction for them.
- **Trades/field workers** avoid typing on jobsites; paperwork (quotes,
  invoices, job records) gets delayed or skipped — STRONG PROXY (multiple
  new 2025–26 voice-to-paperwork entrants, none dominant).
- **Family historians/genealogists** hold handwritten documents they cannot
  read; incumbents require training effort — VERIFIED FACT that LLMs now
  beat specialist HTR tools (<2% CER vs ~8% for Transkribus, ~50x faster,
  ~1/50th cost; peer-reviewed 2025); STRONG PROXY of demand (MyHeritage and
  Ancestry both shipped AI transcription betas 2025–26).

## Known user problems (top signals)

| Problem | Who | Severity signal | Class |
|---|---|---|---|
| Chasing clients for documents across email/portals | Bookkeepers, small accounting firms | Paid tools exist yet pain cited as #1 blocker | STRONG PROXY |
| AIA G702/G703 pay apps hand-built in Excel; errors delay payment ~30 days | Commercial subcontractors | Subcontractor DSO ~96 days (vendor figure); niche tools funded | STRONG PROXY (WEAK on exact figures) |
| Practice admin overpriced/insurance-centric for cash-pay solo clinicians | Solo therapists/coaches | SimplePractice Starter $29→$49/mo Mar 2025 (+69%), visible switching | VERIFIED FACT (price), STRONG PROXY (switching) |
| Dues/ledger chaos in self-managed HOAs | Volunteer treasurers | Enterprise tools have unit minimums, $298+/mo floors | STRONG PROXY |
| Client onboarding intake scattered across email/Slack/forms | Agencies, prof. services | Template proliferation; Rocketlane/Dock funded | STRONG PROXY (demand), ASSUMPTION (SMB WTP) |
| Unreadable handwritten family documents | Genealogists, small archives | Incumbents scrambling to ship AI transcription | STRONG PROXY |
| Paperwork avoidance on jobsites | Contractors/technicians | Fragmented early entrants (VoxTrade, Nora, Ari) | STRONG PROXY |
| Grant deadlines/reporting in spreadsheets | Small nonprofits | GrantHub discontinuation 2026 strands users | STRONG PROXY (single source) |

## Current alternatives

Spreadsheets + email (dominant everywhere above); enterprise tools priced
out of reach (Procore, AppFolio, Instrumentl); hated-but-paid incumbents
(SimplePractice, Dubsado — setup burden; HoneyBook — client-side UX);
crude thin converters (bank-statement converters — crowding is itself
STRONG PROXY of demand); self-hosted FOSS requiring technical skill
(Stirling-PDF).

## Distribution patterns (from growth case studies)

**Works (STRONG PROXY–VERIFIED across Loom, Gamma, Granola, Lovable,
Excalidraw, Screen Studio):**
- The artifact IS the ad: hosted link/deck/video/app sent to a recipient
  who must view it; every use is a demo.
- Recipient gets value before signup, then one-click path to become a
  creator ("Make a Loom", "Edit with Lovable", "Ask Granola").
- Visually distinctive output as passive watermark (Excalidraw style).
- Single-player value first; sharing formalizes word-of-mouth already
  happening.
- Magic-moment demo-ability: value provable in a <30s recording.

**Fails (VERIFIED/STRONG PROXY — Venmo feed, Evernote Work Chat, B2B
referral widgets):** sharing bolted onto a private job; referral prompts
before first value; viral spikes without activation capacity.

## Monetization patterns

- Proven paid boundaries: usage volume (ScreenshotOne $200K ARR —
  VERIFIED), branding removal + custom domain (Tally $5M ARR, Senja $1M
  ARR — VERIFIED/STRONG PROXY), privacy itself with no free tier
  (Plausible $3.1M ARR — VERIFIED), one-time license with BYO-API-key
  (TypingMind >$1M cumulative — VERIFIED).
- Freemium needs enormous top-of-funnel (Tally: ~300K free users) —
  VERIFIED. Do not assume freemium = monetization.
- ~70% of micro-SaaS never pass $1K MRR; category selection and a hard
  paid boundary matter more than build quality — WEAK PROXY (aggregators)
  but consistent.

## Categories to avoid (evidence-backed)

Generic AI writing/wrapper tools (commoditized); task trackers/PM tools
(~300 near-identical entrants); ad-monetized Chrome extensions; free-tool
SEO plays without a hard paid boundary; categories clustered at $5–15/mo
(race to the bottom). All STRONG PROXY.

## Newly-possible capabilities (2024–26 inflections, all VERIFIED FACT)

1. Vision-LLM document extraction at ~$0.0002/page (~6,000 pages/$1).
2. WebGPU default in all major browsers; 3–7B models + Whisper run in-tab
   ("file never leaves your browser" now practical for non-technical users).
3. Transcription at $0.15–0.36/hr with strong noisy-environment accuracy.
4. LLMs beat specialist HTR on historical handwriting (peer-reviewed).
5. Template-to-video via API is commodity (JSON2Video, Remotion).
6. Quality TTS at $15/1M chars (20–50x price spread vs premium).
7. Sync engines (ElectricSQL, Zero) make local-first collaboration a
   library import.

## Evidence sources

Primary URLs are embedded in the research summaries above and in
`CONCEPTS.md` entries; retrieved 2026-07-11. Reliability noted per claim.
Vendor-published figures are always downgraded to WEAK/STRONG PROXY.

## Unanswered questions

1. Will non-technical, compliance-sensitive users trust a browser-local
   tool enough to switch from manual work? (UNKNOWN — the key Vaultless-
   style assumption.)
2. Real revenue traction of voice-to-paperwork entrants? (UNKNOWN.)
3. Genealogists' willingness to pay per-document vs subscription? (UNKNOWN.)
4. SMB-tier willingness to pay for onboarding/document-collection portals
   below Content Snare's price point? (ASSUMPTION.)
5. How much of the "request-and-collect" pain is recipient-side (client
   friction) vs sender-side (tracking)? (UNKNOWN — shapes product design.)

## Interview questions

(For future founder-approved external validation.)
- Walk me through the last time you had to get documents/inputs from a
  client. What did you use? Where did it stall?
- What do you currently pay for, and what almost made you switch away?
- Show me the last quote/pay-app/report you produced. How long did it take?
- Would you upload this document to a cloud tool? Why / why not?

## Run 2 research (pivot — hands-off commerce loops), 2026-07-11

**Loop mechanics (how standalone commerce tools grow hands-off):**
- Proven pattern = badge/recipient/embed loop where the artifact is public
  and the viewer is the ICP: Senja ($1M ARR, testimonial-widget badge —
  STRONG PROXY), Calendly (~25% of signups from the booking-page badge —
  STRONG PROXY), Carrd (~$1.5–2M ARR solo, "Made with Carrd" is the primary
  engine — STRONG PROXY), Tally/Typeform (form badge; branding-removal
  paywall — VERIFIED pricing).
- Ingredients that make it work: output public by default & seen by the
  buyer persona; badge on an artifact the recipient must engage with (not a
  passive footer); single-player value first (no cold start); badge-removal
  as the primary paywall; frictionless recipient path.
- **Timeline honesty (STRONG PROXY):** badge loops are slow to ignite then
  compound — Senja ~1 year to ~$5k MRR; Calendly/Carrd compounded over
  years. Fast indie $1k-in-weeks stories came from LAUNCH SPIKES, not
  badges. Pure hands-off badge growth to $1–2k in 3 months is unusual; a
  tight, dense, fast-copying niche can ignite faster than a broad market.
- **Avoid (saturated):** link-in-bio, generic form builders, generic
  scheduling, generic creator storefronts.
- **$1–2k/mo math:** price $19–29/mo → 50–90 paying customers clears target.

**Fresh gaps (customer-facing commerce artifacts, underserved):**
- Wedding day-of timeline / shot-list as a shared live link (today: static
  Etsy/Canva PDFs) — dense peer loop (planner, DJ, videographer, 2nd
  shooter, venue, couple all see it; most are vendors). Paid templates prove
  WTP (STRONG PROXY); shared-link product is unbuilt (ASSUMPTION).
- Permanent-jewelry pop-up page + walk-in waitlist — 2024–26 boom niche
  (VERIFIED trend), owners spend $2.5–7.5k on gear (STRONG PROXY WTP),
  peer loop at host boutiques/markets, tight fast-copying community.
- Mobile/pop-up food-vendor daily menu (changes daily; restaurant QR tools
  assume fixed location) — peer loop at markets. WEAK PROXY on gap size.
- Cottage-food compliant labels — real "why now" (FDA 2025 allergen
  guidance, sesame = 9th allergen, VERIFIED) but WEAK loop (label isn't
  peer-facing) — noted, deprioritized on the hands-off filter.
- Adjacent pop-up services (lash/brow/piercing/tattoo-flash) share the pop-up
  page loop; tattoo tooling (Venue Ink) proves service-artists pay (STRONG
  PROXY, adjacent).
- Explicitly saturated / avoid: pet-groomer report cards, auto DVI, funeral
  memorial pages, youth-sports team pages, single-property real-estate sites.

## External validation plan

Once a winner exists (founder approval required before any publishing):
landing + waitlist test with concrete before/after screenshots; 5–8
problem interviews from the target niche; usability test of the core
journey; measure activation (first completed artifact) and one
distribution event (artifact opened by a recipient).
