# HANDOFF: November 2026 Tournament QR Landing Page

Branch: `event-signup-page` (never commit to `main`; `main` is synced to the FUTR-theme/main store theme through Shopify's GitHub integration).
Store: `a36ab9-2.myshopify.com` (FUTR Performance). Read this file at the start of every session.

## Status (2026-11-17)
**Done:** page built, all paths tested in the browser with Klaviyo requests intercepted. Waiting on Michael's review (checkpoint 1) before the live Klaviyo test signups.

## How to preview
- `shopify theme dev` from the repo root (store is already the CLI default).
- The page `/pages/tournament` exists but is **Hidden**. Shopify returns 404 for hidden pages, even in a dev preview.
- **Preview on any published page instead:** http://127.0.0.1:9292/pages/contact?view=tournament-signup
  - `?view=` swaps in the template for that one request; the data sent is identical.
- **Warning:** submitting the parent form or the teen form (with email) on the preview sends **real** data to Klaviyo.

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
- Properties: `signup_source: "november-2026-tournament"`, `signup_role: "parent"`, `athlete_birth_month: "MM"`, `sports_played: [..]`.
- On success, shows the promo code `NOVEVENT20` (a section setting).

### Athlete 13+ who enters an email
- `POST https://a.klaviyo.com/client/profiles/?company_id=RP33x9`: profile only. No list, no consent, never the subscriptions endpoint.
- Profile: `email` only.
- Properties: `teen_profile: true`, `signup_source`, `signup_role: "athlete-teen"`, `teen_first_name`, `teen_birth_month`, `teen_birth_year`, `teen_sports_played`.
- No promo code shown.

### Athlete 13+ with no email
Nothing is sent. Shows the social and website links.

### Athlete under 13
- Nothing is sent. Sets `localStorage.futr_tourney_u13 = "1"`.
- After that, choosing "Athlete" on this device goes straight to the links screen. The Parent path stays available, since FUTR may use a shared device at the table.
- The cutoff is never shown on the page.
- **Age rule:** under 13 by month. If the birth month is the current month and the year is exactly 13 years ago, it counts as under 13, because we can't confirm the day.

### Spam
- Hidden honeypot field on both forms. If it's filled, the page shows the normal success screen and sends nothing.
- Submit is disabled for 2 seconds after each form step appears.

## Edge case: teen enters a parent's email
Klaviyo merges by email, so a teen's profile request would update the parent's existing profile. To protect the parent's data:
- Teen data uses `teen_*` property names and never sends `athlete_birth_month` or `sports_played`.
- The teen's first name goes in the `teen_first_name` property, not the standard `first_name`, so the parent's name isn't overwritten.
  - This differs from the original spec; flagged to Michael.

Still overwritten in that case:
- `signup_role` changes from "parent" to "athlete-teen".
- `teen_profile: true` is added.

List membership and consent are not affected, but any segment filtered on `signup_role = parent` would drop that parent.
- **Open question:** should we skip the teen request when the email already belongs to a parent? (Not possible client-side without a lookup; it would need a different property approach.)

## Testing log
- **Browser, Klaviyo requests intercepted:** all pass.
  - Parent: correct payload and headers, promo code shown.
  - Error + Retry: works, form values kept.
  - Honeypot: no request.
  - Early submit inside the 2s window: ignored. Submit with no sport selected: blocked.
  - Teen with email: profiles endpoint and payload correct, no code shown. Teen without email: no request.
  - Under 13, including the edge month: no request, flag set, lock survives a reload, parent still available.
  - Social links render (Facebook, Instagram); the website button goes to the homepage.
- **Unit tests** for the age rule and payload shapes (8 age cases): pass.
- `shopify theme check`: no issues in the new files.
- **Accidental live request (2026-11-17 22:07 UTC):** `x@example.com` ("Test Parent") was subscribed to `X9rGAu` because a page reload dropped the request interceptor.
  - It confirmed the parent path end to end: SUBSCRIBED, `double_optin: false`, properties correct.
  - Flow is a draft, so no email was sent. **Delete this test profile** along with the others.

## TODO
- [ ] Michael: review the page (checkpoint 1).
- [ ] Live Klaviyo tests with test emails:
  - Parent: on `X9rGAu`, SUBSCRIBED, no confirmation email.
  - Teen: has `teen_*` properties, not on the list, no consent.
  - Under 13: sends nothing.
- [ ] After the flow is turned on, test one more parent signup and confirm the NOVEVENT20 email arrives.
- [ ] After merge and FUTR-theme/main goes live, assign page.tournament-signup to /pages/tournament and set it to Visible.
- [ ] Michael: delete test profiles in Klaviyo (including `x@example.com`).
- [ ] Open a PR into `main` for Sara.

## Notes and known issues (not caused by this work)
- `snippets/social-meta-tags.liquid` lines 8-9 output "Liquid error: invalid url input" inside meta tags when a page has no image. It's on every page, already existed, and isn't visible.
- **Sara's `sections/event-signup.liquid`:** its hide-chrome CSS doesn't hide the theme's "Join the Roster" popup (`#popup` / `#slide-up`). The tournament section hides it.
- Theme Check baseline before this work: 34 errors and 191 warnings (saved in `~/FUTR-theme-backups/2026-11-17/`).
- The store has about 18 of its 20 allowed themes. No preview theme is connected for this branch yet; Michael is arranging a slot with Sara.
- Klaviyo's on-site embed is enabled sitewide. If any Klaviyo popup forms target all pages, exclude `/pages/tournament` in Klaviyo.
