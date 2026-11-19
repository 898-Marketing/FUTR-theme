# HANDOFF: November 2026 Tournament QR Landing Page

Work on a new branch per change and open a PR (never commit to `main`; `main` is synced to the FUTR-theme/main store theme (`#183321919775`) through Shopify's GitHub integration, and Theme Editor edits on that theme commit back to `main` as shopify[bot]). Always `git fetch` and check `main` for Sara's/Customizer edits before branching.
Store: `a36ab9-2.myshopify.com` (FUTR Performance). Read this file at the start of every session.

## Status (2026-11-19): published, password still on
**Page is finished and approved.** All changes merged to `main` (PRs #1–#6) and synced to FUTR-theme/main. Michael is publishing FUTR-theme/main as the live theme on 2026-11-19 (replacing "Coming Soon Dark Revised" `#183332831519`, which stays as the rollback; don't delete it).

What the page does now:
- **Parent / Guardian / Coach:** first and last name, email, athlete birth month and year (**optional**, for coaches), sports. Subscribed to Klaviyo list `X9rGAu` (single opt-in), welcome flow `URegZD` (live) emails HOOPS20, and the page shows the code. Consent line + privacy policy link under the submit button.
- **Athlete:** links only (parent note, social icons, website button). **Nothing is collected.**
- No phone field.

PR history:
- #1 page build · #2 athlete birth year, "event pricing" copy (Carli) · #3 role headline smaller, "Parent/Guardian/Coach" on one line · #4 athlete links-only + consent line (FUTR approved) · #5 birth date optional (coaches) · #6 desktop: birth month/year boxes level when a label wraps (`align-items: end` on `.tsu__row`).

FUTR decisions (Suzanne via Carli, 2026-11-19: "we align with your recommendations"):
1. **Athlete button = links only.** Matches the privacy policy's "Children" section (event info "only from the parent").
2. **Consent line** under the parent button (settings `consent_text`, `privacy_label`), linking `shop.privacy_policy.url`.
3. **No phone field for now.** When FUTR launches texting: optional phone field + separate unticked SMS consent checkbox and disclosure, E.164 validation, and a registered Klaviyo texting number (none set up as of 2026-11-19; carrier registration can take weeks; plan has a $5/month SMS allowance; the privacy policy's "Text messages" section already covers SMS).
- **"Coach" stays** on the button (Carli + Michael): coaches are worth marketing to; that's why the birth date is optional.

## Launch state (updated 2026-11-19, verified via API)
- **FUTR-theme/main is the live (published) theme.** Every merge to `main` and every Theme Editor edit now changes the live site. Rollback: republish "Coming Soon Dark Revised" (`#183332831519`).
- **Store password is ON on purpose:** FUTR and 898 are testing checkout first. Visitors see Sara's "Our Site is Coming Soon" password page. The QR page only works for visitors once the password is turned off; people with the password can use https://futrperformance.com/pages/tournament now.
- Done: page `/pages/tournament` on template `tournament-signup` and Visible; HOOPS20 one use per customer; QR code confirmed by Michael.
- Still open: turn the password off before the event; HOOPS20 end date (waiting on FUTR); one real phone signup test, then delete that profile; consider a separate staging theme for future previews (18 of 20 theme slots used).

## Post-launch plan (from QA on 2026-11-19; nothing here is built yet)
QA was run on the local dev server (same code as the live theme). Checkout, payment and the cookie banner were not covered (live-store only; Michael tests those).

**Fix soon (visible to shoppers)**
1. **Placeholder content on the default product template** (`templates/product.json`), used by 7 products: Fuel the Game Performance Tee, Miami Tip Off Tee, FUTR Compression Tee, FUTR Logo Towel, Stainless Steel Shaker, FUTR Shipper Display, Test Product. Shows an empty grey `image_with_text_overlay_JH64Gc` (no image; also prints a Liquid error in its CSS) and `featured_collection_gi6QWq` "Mix and Match!" with no collection, so it renders fake "Product title $19.99" cards linking to `/admin/products`. Fix: pick a collection (or remove the section) and add an image (or remove the section), via Theme Editor or a PR.
2. **"Join the Roster" popup opens over the cart drawer** on mobile (12s after load) and covers Checkout. Options: turn it off, lengthen the delay, or change code so it doesn't open while the cart drawer is open. Michael to pick.
3. **Social share tags:** PR #10 fixes the Liquid error in `og:image` and the `x:` → `twitter:` tag names. Share image and homepage meta description are now set in Preferences (2026-11-19).

**Product URLs (agreed approach, waiting on Michael's go)**
4. Product links render as `/collections/products/products/gametime` because the main collection's handle is `products` and the theme uses `| within: collection`. Plan: drop `within:` in the 8 product-link spots (`sections/featured-product.liquid`, `sections/template--cart.liquid`, `snippets/grid-view-item.liquid` ×3, `snippets/product-grid-item-price.liquid`, `snippets/quick-view-modal.liquid` ×2) so every link is `/products/<handle>`.
   - No broken links: Shopify still serves the old collection-style URLs, and canonical tags already point to `/products/<handle>`, so SEO is unaffected. Breadcrumbs (the only thing using collection context) are switched off.
   - Test: crawl confirms clean 200 product links; quick view and add-to-cart from collections; cart image link. Revert = one PR.
   - Skip renaming the `products` collection handle (needs menu updates + redirect, and still leaves a long URL).

**Cleanup**
5. Test Product: Draft/Archive after the test order (shows in All products and search; also listed on Facebook, TikTok and Google channels).
6. Stainless Steel Shaker has no product images.
7. Homepage title shows "FUTR | … – FUTR Performance" because the theme appends the shop name; shorten the Preferences title to "Youth Sports Nutrition for Young Athletes".

**Questions for FUTR**
8. FUTR Merch collection only has the Logo Tee and Logo Crop (not Miami Tip Off Tee, Fuel the Game Tee, Compression Tee, Towel, Shaker). Intentional?
9. Cart drawer shows unit price per line (e.g. $34.99 at qty 2), not the line total; subtotal is correct. Theme design, FYI.

**Minor SEO**
10. No H1 on collection pages, About, Our Standard or Contact; the blog's H1 is the newsletter "Sign up here!".

**Before ads launch**
11. Consent: Shopify's built-in cookie banner (Michael setting up 2026-11-19), GPC/state opt-outs; keep ad pixels off `/pages/tournament`; don't build ad audiences from athlete data (privacy policy promise); FUTR's lawyer to decide on Washington (My Health My Data). Osano not needed at FUTR's size.

## Free FUTR tee offer (2026-11-19, branch `free-tee-cart-prompt`)
FUTR's rule (Suzanne via Carli): buy any 2 full-size products, get 1 FUTR Logo Tee **or** Logo Crop free, one per order, no end date. A % code (HOOPS20, EMAIL20, SUZIE20) can be used on top, but % codes never stack with each other.

**Shopify discounts (done via Admin API 2026-11-19)**
- New automatic Buy X Get Y **"Free FUTR Tee (2+ full-size products)"** (`gid://shopify/DiscountAutomaticNode/2083923296543`): buy 2 of these 10 variants (any mix) → 1 of products `t-shirt` / `futr-logo-crop` at 100% off, `usesPerOrderLimit` 1, combines with **order** discounts only.
  - Qualifying = Pregame and Gametime **Stick Pack Box** + **Tub** (all flavors) and Recover+ **Tub** (both flavors). The single **"Stick Pack"** variants ($0, not for sale) are excluded on purpose (FUTR: single sticks aren't full-size).
  - **New flavors/sizes must be added to the discount by hand** (Discounts → the tee discount → "Customer buys"), and the snippet rule below must still match.
- Deactivated (not deleted) the two old broken ones: "Free T-Shirt" (min qty 3 counted only tees) and "Free T-Shirt with Bundle" (bundles are Draft products).
- HOOPS20, EMAIL20, SUZIE20 (all **order**-class 20% codes): `combinesWith` = product discounts only, so each stacks with the tee but not with each other.

**Theme (cart drawer prompt)**
- `snippets/cart-free-tee.liquid`, rendered in the cart drawer header (re-rendered on every cart change): 0–1 qualifying items → "Add N more Pregame, Gametime or Recover+ to get a free FUTR tee"; 2+ → "You've earned a free FUTR tee!" with a Logo Tee/Logo Crop size picker + "Add free tee"; tee in cart with the discount applied → "Your free FUTR tee is in your cart."
  - Rule mirrors the discount: products `pregame`, `gametime`, `recover`, option1 not `Stick Pack`; tees `t-shirt`, `futr-logo-crop`; minimum 2. Change these together with the discount.
- `assets/cart-free-tee.js`: delegated submit → `/cart/add.js` with `sections: cart-drawer`, then emits the theme's `update:cart:drawer` and updates the header count.
- Theme setting **Theme settings → Cart → "Show free tee offer in cart drawer"** (`free_tee_enabled`, default on).
- **To end the offer: deactivate the discount AND uncheck that setting** (two switches; Liquid can't see whether an automatic discount is active before the tee is added).
- Also: cart drawer and cart page no longer show $0 discount badges (BXGY tags the qualifying items with a $0 allocation).
- Tested on the dev server (mobile + desktop): 1 item → "Add 1 more"; 2 items (same or mixed products) → picker lists all in-stock tee/crop sizes; adding a Logo Crop → $0.00 with the discount, count updates; dropping back to 1 → tee returns to $12.99 and message says "to make your tee free". Checkout + HOOPS20 stacking not yet tested (needs a real checkout).

## Promo code renamed (2026-11-19)
FUTR asked to rename the event code **NOVEVENT20 → HOOPS20** everywhere (same discount, same settings: 20% off all products, one use per customer, no combinations). Changed: the Shopify discount's code and title, the page's `promo_code` setting (template + schema default), and the Klaviyo welcome email (code box, plain text, preview text, message name). Older notes below that mention the code now read HOOPS20.

## Go-live checklist (2026-11-19)
Checked through the APIs right before launch:
- **Store password is ON** (`onlineStore.passwordProtection.enabled: true`). While it's on, QR visitors hit the password page and **can't reach `/pages/tournament`**. Publishing the theme does not turn it off. Turn it off (Online Store → Preferences) when FUTR is ready, or the QR code won't work. FUTR-theme/main's own password page is Sara's "Our Site is Coming Soon" version.
- **Page `/pages/tournament`** ("November 2026 Tournament", `gid://shopify/Page/167214252319`): still **Hidden** with **no template**. After publishing: assign template `tournament-signup` and set it Visible. Then open https://futrperformance.com/pages/tournament on a phone.
- **QR code** must point to https://futrperformance.com/pages/tournament (primary domain). Confirm with whoever made it.
- **HOOPS20** ("November 2026 Event - 20% Off"): active, 0 uses, **"one use per customer" is still OFF** (the welcome email says one use per customer) and **no end date**. Fix both in Shopify Discounts.
- **Klaviyo sync check (done 2026-11-19):** `mmerdich+parent@` is on **only** `X9rGAu`, consent `email`, not on the newsletter list. Passed.
- **After launch, one real test:** sign up as a parent on a phone with a new `+` address; confirm the code shows, the profile is on `X9rGAu`, and the welcome email arrives. Tap Athlete and confirm it only shows links. Then delete that test profile.
- Klaviyo on-site embed is sitewide: if any Klaviyo popup targets all pages, exclude `/pages/tournament`.

## How to preview
- `shopify theme dev` from the repo root (store is already the CLI default).
- The page `/pages/tournament` exists but is **Hidden**. Shopify returns 404 for hidden pages, even in a dev preview.
- **Preview on any published page instead:** http://127.0.0.1:9292/pages/contact?view=tournament-signup
  - `?view=` swaps in the template for that one request; the data sent is identical.
- **Warning:** submitting the parent form on the preview sends **real** data to Klaviyo.

## Files touched (all new)
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
- Properties: `signup_source: "november-2026-tournament"`, `signup_role: "parent"`, `athlete_birth_month: "MM"`, `athlete_birth_year: "YYYY"` (added 2026-11-18; **optional** since 2026-11-19 and left out of the payload when blank, so a returning parent's saved values are never erased), `sports_played: [..]`.
- On success, shows the promo code `HOOPS20` (a section setting).

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
    - No HOOPS20 email either: expected, because flow `URegZD` is still a **draft** (re-checked 2026-11-18).
  - **Teen `mmerdich+teentest@898marketing.com`:** NEVER_SUBSCRIBED, on no lists, only `teen_*` properties, no `first_name`.
- Fixed the Instagram icon rendering as a filled square (theme icons are stroke outlines).

### Shopify customer sync (Klaviyo setting, not the page)
Both live test emails showed up in **Shopify Customers**: the parent as Subscribed, the teen as Not subscribed. The page never calls Shopify. Klaviyo's Shopify integration copies profiles into Shopify; on the parent this shows up as `Accepts Marketing: true`, added about 30 seconds after signup.
- **Michael's call:** this is OK. Parents subscribed in both systems is expected, and teens stay unsubscribed in both.
- If FUTR ever doesn't want minors' emails in Shopify, change it in Klaviyo → Integrations → Shopify settings.
- **Watch for a loop:** Shopify could send the now-subscribed parent back into Klaviyo's double opt-in newsletter list. See the follow-up check below.

## TODO
- [x] Follow-up sync check (2026-11-19): `mmerdich+parent@` is on only `X9rGAu`.
- [x] Athletes get a links-only screen with a parent note (FUTR agreed 2026-11-19).
- [x] Welcome email test: Michael turned flow `URegZD` live on 2026-11-18. A new parent signup received "Your 20% off code is here" with HOOPS20 within a minute.
  - "Added to List" flows only trigger for people added after the flow goes live, so the older test profiles won't get it.
- [ ] After FUTR-theme/main goes live: assign `tournament-signup` to /pages/tournament, set it Visible, and turn off the store password when FUTR is ready (see Go-live checklist).
- [ ] Michael: delete test profiles in Klaviyo (`x@example.com`, `mmerdich+parent@`, `mmerdich+teentest@`, `mmerdich+testparentlive@` — the welcome-email test) **and** the matching Shopify customers, (the follow-up check is done, so this can happen now). `mmerdich+teentest@` and any old test profiles may still carry `teen_*` properties.
- [x] PR into `main`: Sara OK'd it on 2026-11-18, and Michael merged it. `main` before the merge is tagged `pre-tournament-merge`.

- [x] Old form cleanup (2026-11-18): Michael deleted the Shopify segment "November 2026 Event" (`customer_tags CONTAINS 'november-2026-event'`) and its 4 test customers (`mmerdich+1@`, `mmerdich+2@`, `srogers@`, `srogers+1@`). Verified through the Admin API.
  - These may also exist in Klaviyo through the Shopify sync. Delete them there too if they show up.
- [ ] HOOPS20 discount (Shopify):
  - Turn on "Limit to one use per customer". It's currently off, but the welcome email says "One use per customer".
  - Set an end date once FUTR confirms it. It's currently open-ended.
  - The discount applies to all customers and isn't tied to a segment.

- [x] **Retired Sara's old event landing page** (Michael, 2026-11-19): removed `sections/event-signup.liquid` and `templates/page.event-signup.json` (unused by any page; recoverable from Git history and the `pre-handoff-2026-11-17` tag). The Shopify page "November Event" (`/pages/november-event`) was empty and in no menu; Michael deleted it on 2026-11-19, with no redirect (the old URL now 404s).
- [ ] Shopify page "November Event": proposed to delete it and add a URL redirect `/pages/november-event` → `/pages/tournament` (in case the old URL was shared). Waiting on Michael's OK.

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
- Theme Check baseline before this work: 34 errors and 191 warnings (saved in `~/FUTR-theme-backups/2026-11-17/`).
- The store has 18 themes (limit 20), including the dev theme `#186089242911` from `shopify theme dev`. Don't delete themes; Michael/Sara manage that.
- Klaviyo's on-site embed is enabled sitewide. If any Klaviyo popup forms target all pages, exclude `/pages/tournament` in Klaviyo.

## Athlete links-only + consent line (2026-11-19, branch `athlete-links-consent`)
- Section: removed the `age` and `teen` steps and their settings (`age_*`, `teen_*`, also removed from the template JSON). Added `athlete_note`, `consent_text`, `privacy_label`.
- JS: removed `isUnder13`, `buildTeenPayload`, localStorage helpers and the age/teen submit handling. Only `buildParentPayload` remains.
- Tested in `shopify theme dev` at 390px with Klaviyo intercepted: Athlete → links with **0 requests**; parent signup → 1 request to `client/subscriptions`, same properties as before (incl. `athlete_birth_year`), list `X9rGAu`, code HOOPS20 shown; consent line and privacy link render. Unit test passes; theme check has no offenses in the signup files.
- Main was checked first: Sara's 2026-11-19 commit ("Coming soon" instead of "Sold out") doesn't touch these files.

## Optional athlete birth date (2026-11-19, branch `optional-birth-date`)
- Parent form: birth month and year are no longer required; labels say "(optional)". Blank values are omitted from the Klaviyo payload (not sent as empty strings).
- Section header comment updated to the current steps (it still described the removed age/teen steps).
- Tested with Klaviyo intercepted: blank → form submits, properties are only `signup_source`, `signup_role`, `sports_played`; filled → both birth properties sent as before. Unit tests cover blank, month-only and filled.
