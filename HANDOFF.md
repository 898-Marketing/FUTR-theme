# HANDOFF: November 2026 Tournament QR Landing Page

Branch: `event-signup-page` (never commit to `main`; `main` is synced to the FUTR-theme/main store theme through Shopify's GitHub integration).
Store: `a36ab9-2.myshopify.com` (FUTR Performance). Read this file at the start of every session.

## Status (2026-11-19)
**Done:** page built, live-tested, merged to `main` (PR #1), then FUTR's edits merged (PR #2: athlete birth year, "event pricing" copy). 2026-11-19 (Carli): first headline smaller so "Parent/Guardian/Coach" stays on one line (PR #3; `.tsu__heading--role`, `.tsu__nowrap` in the section; only matches that exact spelling in the heading setting). Client preview: https://a36ab9-2.myshopify.com/pages/contact?preview_theme_id=183321919775&view=tournament-signup (store password needed).

**FUTR decisions (Suzanne via Carli, 2026-11-19: "we align with your recommendations"), built on branch `athlete-links-consent`:**
1. **Athlete button = links only, nothing collected.** Matches the privacy policy's "Children" section ("only from the parent"). Removed the age step, the teen form, the teen payload and the under-13 device lock. The links screen shows "Ask a parent or guardian to scan this code to unlock event pricing." (setting `athlete_note`).
2. **Consent line** under the parent submit button (settings `consent_text`, `privacy_label`), linking `shop.privacy_policy.url` (`/policies/privacy-policy`).
3. **No phone field for now.** Add it when FUTR launches texting, together with a separate unticked SMS consent checkbox and disclosure, E.164 validation, and a registered Klaviyo texting number (none set up yet; carrier registration can take weeks; plan has a $5/month SMS allowance; the privacy policy's "Text messages" section already covers SMS).
- **"Coach" stays** on the parent button (Carli and Michael, 2026-11-19): coaches are worth marketing to. Coaches still have to fill in the athlete birth month/year fields.

**Also open:** follow-up sync check, test-profile cleanup, NOVEVENT20 settings, retiring Sara's old page (see TODO).

## How to preview
- `shopify theme dev` from the repo root (store is already the CLI default).
- The page `/pages/tournament` exists but is **Hidden**. Shopify returns 404 for hidden pages, even in a dev preview.
- **Preview on any published page instead:** http://127.0.0.1:9292/pages/contact?view=tournament-signup
  - `?view=` swaps in the template for that one request; the data sent is identical.
- **Warning:** submitting the parent form on the preview sends **real** data to Klaviyo.

## Files touched (all new; Sara's event-signup files untouched)
- `sections/tournament-signup.liquid`: markup, CSS, Customizer settings, inline JSON config for the JS.
- `snippets/tournament-signup-sports.liquid`: the 18-sport checkbox grid.
- `snippets/tournament-signup-honeypot.liquid`: hidden spam field.
- `assets/tournament-signup.js`: step logic and Klaviyo calls (vanilla JS).
- `templates/page.tournament-signup.json`: just the one section.
- `HANDOFF.md`

## Data contract (Klaviyo client API, public key `RP33x9`, revision `2026-10-15`)

### Parent / Guardian / Coach
- `POST https://a.klaviyo.com/client/subscriptions/?company_id=RP33x9`
- Email marketing SUBSCRIBED, list `X9rGAu` (single opt-in), `custom_source` "November 2026 Tournament QR".
- Profile: `email`, `first_name`, `last_name`.
- Properties: `signup_source: "november-2026-tournament"`, `signup_role: "parent"`, `athlete_birth_month: "MM"`, `athlete_birth_year: "YYYY"` (added 2026-11-18), `sports_played: [..]`.
- On success, shows the promo code `NOVEVENT20` (a section setting).

### Athlete (any age), since 2026-11-19
- Nothing is collected or sent. Choosing "Athlete" goes straight to the links screen (parent note, social icons, website button).
- The old teen path (profiles endpoint, `teen_*` properties) and the under-13 lock (`localStorage.futr_tourney_u13`) were removed. Old test profiles may still carry `teen_*` properties; a leftover `futr_tourney_u13` key on a device is now ignored.

### Spam
- Hidden honeypot field on the parent form. If it's filled, the page shows the normal success screen and sends nothing.
- Submit is disabled for 2 seconds after each form step appears.

## Edge case: teen enters a parent's email (historical)
No longer possible: the teen path was removed on 2026-11-19. It only ever sent `teen_*` properties, so any parent profile touched during testing kept its parent data.

## Testing log
- **Browser, Klaviyo requests intercepted:** all pass.
  - Parent: correct payload and headers, promo code shown.
  - Error + Retry: works, form values kept.
  - Honeypot: no request.
  - Early submit inside the 2s window: ignored. Submit with no sport selected: blocked.
  - Teen with email: profiles endpoint, only `teen_*` properties (re-checked after the teen_signup_role change), no code shown. Teen without email: no request.
  - Under 13, including the edge month: no request, flag set, lock survives a reload, parent still available.
  - Social links render (Facebook, Instagram); the website button goes to the homepage.
- **Unit tests** for the age rule and payload shapes (8 age cases): pass.
- `shopify theme check`: no issues in the new files.
- **Accidental live request (2026-11-17 22:07 UTC):** `x@example.com` ("Test Parent") was subscribed to `X9rGAu` because a page reload dropped the request interceptor.
  - It confirmed the parent path end to end: SUBSCRIBED, `double_optin: false`, properties correct.
  - Flow is a draft, so no email was sent. **Delete this test profile** along with the others.
- **Live tests by Michael on his phone (2026-11-18), checked through the Klaviyo API:**
  - **Parent `mmerdich+parent@898marketing.com`:**
    - SUBSCRIBED via API, `double_optin: false`, on **only** list `X9rGAu`.
    - Parent properties are correct, and no confirmation email arrived.
    - No NOVEVENT20 email either: expected, because flow `URegZD` is still a **draft** (re-checked 2026-11-18).
  - **Teen `mmerdich+teentest@898marketing.com`:** NEVER_SUBSCRIBED, on no lists, only `teen_*` properties, no `first_name`.
- Fixed the Instagram icon rendering as a filled square (theme icons are stroke outlines).

### Shopify customer sync (Klaviyo setting, not the page)
Both live test emails showed up in **Shopify Customers**: the parent as Subscribed, the teen as Not subscribed. The page never calls Shopify. Klaviyo's Shopify integration copies profiles into Shopify; on the parent this shows up as `Accepts Marketing: true`, added about 30 seconds after signup.
- **Michael's call:** this is OK. Parents subscribed in both systems is expected, and teens stay unsubscribed in both.
- If FUTR ever doesn't want minors' emails in Shopify, change it in Klaviyo → Integrations → Shopify settings.
- **Watch for a loop:** Shopify could send the now-subscribed parent back into Klaviyo's double opt-in newsletter list. See the follow-up check below.

## TODO
- [ ] **Follow-up check (on or after 2026-11-19):** confirm `mmerdich+parent@898marketing.com` is still on **only** `X9rGAu` and never got a double opt-in confirmation email. If it was added to the newsletter list, fix the Shopify → Klaviyo sync before launch.
- [x] Athletes get a links-only screen with a parent note (FUTR agreed 2026-11-19).
- [x] Welcome email test: Michael turned flow `URegZD` live on 2026-11-18. A new parent signup received "Your 20% off code is here" with NOVEVENT20 within a minute.
  - "Added to List" flows only trigger for people added after the flow goes live, so the older test profiles won't get it.
- [ ] After merge and FUTR-theme/main goes live, assign page.tournament-signup to /pages/tournament and set it to Visible.
- [ ] Michael: delete test profiles in Klaviyo (`x@example.com`, `mmerdich+parent@`, `mmerdich+teentest@`, `mmerdich+testparentlive@` — the welcome-email test) **and** the matching Shopify customers, after the follow-up check.
- [x] PR into `main`: Sara OK'd it on 2026-11-18, and Michael merged it. `main` before the merge is tagged `pre-tournament-merge`.

- [x] Old form cleanup (2026-11-18): Michael deleted the Shopify segment "November 2026 Event" (`customer_tags CONTAINS 'november-2026-event'`) and its 4 test customers (`mmerdich+1@`, `mmerdich+2@`, `srogers@`, `srogers+1@`). Verified through the Admin API.
  - These may also exist in Klaviyo through the Shopify sync. Delete them there too if they show up.
- [ ] NOVEVENT20 discount (Shopify):
  - Turn on "Limit to one use per customer". It's currently off, but the welcome email says "One use per customer".
  - Set an end date once FUTR confirms it. It's currently open-ended.
  - The discount applies to all customers and isn't tied to a segment.

- [ ] **Retire Sara's old event landing page** (coordinate with Sara first; it's her work):
  - Remove `sections/event-signup.liquid` and `templates/page.event-signup.json` through a PR.
    - No page uses the template, and it subscribes through Shopify's customer form, the path this project replaced.
    - Recoverable from Git history and the `pre-handoff-2026-11-17` tag.
  - Shopify page "November Event" (`/pages/november-event`) is published on the default page template.
    - Before deleting it, confirm the URL wasn't printed or shared (earlier QR code, flyer, email).
    - If it was, replace it with a URL redirect to `/pages/tournament` instead.

## Form update (2026-11-18, PR #2, merged)
Requested by FUTR through Carli:
- Parent form: required **Athlete's birth year** dropdown next to the birth month. Sent as `athlete_birth_year`.
- Copy: "tournament pricing" → "event pricing" everywhere. "At our table" removed from the parent form intro only; the confirmation page keeps "see our table to purchase!" and the code label "Show this code at the FUTR table".
- **Parent phone number: not added.** Advised holding off: marketing texts need a separate SMS opt-in (TCPA), and SMS isn't set up in Klaviyo (no texting number as of 2026-11-18). If FUTR wants it later: optional field plus an unticked SMS consent checkbox with compliant disclosure, after SMS is set up, with the phone validated to E.164 so a bad number can't fail the email signup.
- Tested (Klaviyo intercepted): payload includes `athlete_birth_year`, the form can't submit without it, new copy renders, unit tests pass, theme check clean.
- Asked Carli/Sara not to edit the tournament page in the Customizer while code changes are in progress, so edits don't collide with the template file.
- If FUTR tests on the preview link, those are real Klaviyo signups (welcome email sends). Get the email and add it to the test-profile cleanup.
- The welcome email in Klaviyo (flow `URegZD`) may still say "tournament"; check its copy.

## Notes and known issues (not caused by this work)
- `snippets/social-meta-tags.liquid` lines 8-9 output "Liquid error: invalid url input" inside meta tags when a page has no image. It's on every page, already existed, and isn't visible.
- **Sara's `sections/event-signup.liquid`:** its hide-chrome CSS doesn't hide the theme's "Join the Roster" popup (`#popup` / `#slide-up`). The tournament section hides it.
- Theme Check baseline before this work: 34 errors and 191 warnings (saved in `~/FUTR-theme-backups/2026-11-17/`).
- The store has about 18 of its 20 allowed themes. No preview theme is connected for this branch yet; Michael is arranging a slot with Sara.
- Klaviyo's on-site embed is enabled sitewide. If any Klaviyo popup forms target all pages, exclude `/pages/tournament` in Klaviyo.

## Athlete links-only + consent line (2026-11-19, branch `athlete-links-consent`)
- Section: removed the `age` and `teen` steps and their settings (`age_*`, `teen_*`, also removed from the template JSON). Added `athlete_note`, `consent_text`, `privacy_label`.
- JS: removed `isUnder13`, `buildTeenPayload`, localStorage helpers and the age/teen submit handling. Only `buildParentPayload` remains.
- Tested in `shopify theme dev` at 390px with Klaviyo intercepted: Athlete → links with **0 requests**; parent signup → 1 request to `client/subscriptions`, same properties as before (incl. `athlete_birth_year`), list `X9rGAu`, code NOVEVENT20 shown; consent line and privacy link render. Unit test passes; theme check has no offenses in the signup files.
- Main was checked first: Sara's 2026-11-19 commit ("Coming soon" instead of "Sold out") doesn't touch these files.
