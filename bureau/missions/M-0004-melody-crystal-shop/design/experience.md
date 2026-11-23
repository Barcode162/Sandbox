# Experience spec — M-0004 Melody's Crystals

## 1. North star
**A warm, hand-labelled shop counter: every screen shows real stones on the same cream mat, says plainly what each traditionally means, and makes buying as familiar as any big marketplace.**

Brand **Melody's Crystals**: wordmark "Melody's" (Fraunces italic) over "CRYSTALS" (Figtree caps, tracking 0.24em). Mood: specimen drawer meets apothecary label.

## 2. References (craft only)
- **Aesop pages:** one object per frame on a flat warm field; labels in small caps.
- **Marketplace listings:** gallery left, sticky buy box right, price inside each option tile.
- **Shop Pay sheet:** one-column checkout, summary always visible, errors inline.
- **Specimen labels:** name plus one line; hairline rules.

## 3. Tokens
**Colour** (light / dark; text pairs ≥ 4.5:1)
- `--paper` #F7F1E8 / #1A1613 page
- `--mat` #EDE2D2 / #27211C photo mat, cards
- `--ink` #2A2420 / #F3EADD text; `--ink-soft` #5E544B / #BFB2A2
- `--clay` #9A4324 / #E8916A primary, links, prices; `--clay-ink` #FFF8F0 / #1A1613 text on clay
- `--moss` #3F5A45 / #94B89B tags, success
- `--brass` #B08A4A / #C9A465 rules, numerals ≥ 24 px, ornaments
- `--line` #DDD0BE / #3A322B; `--err` #A3242B / #F29A9A; `--focus` #1F5F8B / #8CC3EA

**Type** (Google Fonts, `display=swap`): Fraunces 400/600 + italic 400 (display); Figtree 400/500/600 (UI). Scale (rem): 0.8125 label · 0.9375 small · 1 body (lh 1.6) · 1.25 h4 · 1.625 h3 · 2.25 h2 · clamp(2.75, 6vw, 5) h1 (lh 1.05, 600, −0.02em). Prices Figtree 600, `tabular-nums`.

**Space** 4·8·12·16·24·32·48·72·112 px (`--s1`…`--s9`). Container 1200 px; gutters 20/32/48 at 375/768/1440. **Radii** 6 inputs · 14 photos · 20 cards · 999 pills. **Shadows** `--sh-1 0 1px 2px #2a24201a`; `--sh-2 0 8px 24px -8px #2a242033`; `--sh-3 0 0 48px #2a242040` (drawer). Dark: shadows off, `--line` borders carry depth.

**Motion** `--fast 120ms` · `--base 220ms` · `--slow 380ms`; `--ease-out cubic-bezier(.2,.7,.2,1)`; `--ease-spring cubic-bezier(.34,1.4,.5,1)` (bag badge only). Reduced motion: transforms off; opacity fades at `--fast`.

**Photo treatment (unifies white, black and natural backgrounds).** Each photo sits in a `--mat` card, 10 px padding; inner frame 4:5, radius 14, `object-fit: cover`, `object-position` from per-crystal `focus`, `filter: saturate(.94) contrast(1.03)`; `::after` = `box-shadow: inset 0 0 0 1px #2a242014, inset 0 0 60px #2a242026` (soft vignette). Hover: image scale 1.04 over `--slow`.

## 4. IA and flows
`index.html` (hero · #meanings · #shop · #how · #faq · footer) → `product.html?c=<slug>` → `checkout.html` → in-page confirmation; `credits.html` from footer. Header everywhere: wordmark, Shop, Meanings, FAQ, theme toggle, bag button with count. Drawer on every page.

1. **Browse → buy:** "Shop crystals" → grid → card → pick format → Add to bag → drawer → Checkout → confirmation.
2. **Learn first:** meanings list → tap a stone (photo or name) → product page.
3. **By intention:** chip "Sleep" → 3 stones → product.
4. **Pickup, pay in person:** In-person pickup → Pay in person → Pay in full → Place order.

## 5. The moments
- **0–5 s:** wordmark, H1, promise, real photo trio and "Shop crystals" above the fold at 375×812 and 1440×900. No spinner, no carousel.
- **Hook:** the meanings list, 12 stones readable in one scroll.
- **Peak:** choosing "Jar of big crystals": photo, price, per-piece line and button change in one frame.
- **Ending:** confirmation with order number and "With love, Melody".

## 6. Home frames
**Hero.** ≥1024: text 5/12, photos 7/12; stacked below. Trio: Amethyst large (4:5, 60% width); Rose Quartz and Citrine small, overlapping it by 24 px, rotated −2° / +1.5°, mat cards with `--sh-2`. Brass hairline 64 px wide under the eyebrow.
| Moment | On screen | Why |
|---|---|---|
| Load | Eyebrow "SMALL-BATCH · HAND-PICKED". H1 "Crystals, chosen by hand and explained simply." Promise "Twelve stones I love, what they've traditionally stood for, and three ways to take them home." Buttons "Shop crystals" (clay), "What do they mean?" (ghost). Trust row "Cleansed & wrapped · Local delivery · Pickup welcome". | Name, promise, product and path in one glance; the tilted trio reads as a real table, not stock. |
| 375 | H1 2.75rem; buttons full-width; trio below, height ≤ 46vh. | CTA never below the fold. |
| 0–380 ms | Photos fade in, 8 px rise, 60 ms stagger. | Settles once. |

**Meanings (#meanings).** H2 "What each stone is known for". Lede "For centuries people have kept stones close for comfort and focus. Here's what each is traditionally associated with. Think of it as folklore, not medicine." 12 rows: 72 px round thumb (4 px mat ring), name (1.25rem), meaning line, chevron. Columns 1/2/3 at 375/768/1200.
| Moment | On screen | Why |
|---|---|---|
| Default | 4×3 specimen rows, `--line` hairlines between. | A drawer you scan in 10 s. |
| Hover/focus | Row fills `--mat`; chevron moves 4 px right, `--fast`. Whole row is one link. | Picture and name both click through. |

**Shop grid (#shop).** H2 "Shop crystals". Chips (pills, 36 px): All, Calm, Love, Focus, Protection, Energy, Clarity, Abundance, Sleep, Confidence, Creativity, each with count ("Calm 6"). Card: photo, name (Fraunces 1.25), meaning (2-line clamp), tags (moss, small), "From $12" (clay), "View options". Columns 2/3/4 at 375/768/≥1200; gap 24.
| Moment | On screen | Why |
|---|---|---|
| Default | 12 cards; "All" `aria-pressed`; "Showing all 12 crystals". | Equal heights; prices share a baseline. |
| Filter Sleep | Non-matches fade `--fast`; rest reflow 220 ms FLIP; "3 crystals for Sleep"; hash `#shop?i=sleep`. | Instant, shareable, no jump. |
| Hover | Lift 2 px, `--sh-2`, photo 1.04. | Tactile, quiet. |
| Photo fails | Mat shows the name in Fraunces italic with a brass outline gem glyph. | Never a broken icon. |

**How buying works (#how).** Three steps, brass Fraunces numerals 2.25rem: "Pick your stone. Tumbled bag, one big crystal, or a whole jar." · "Choose how it reaches you. Local delivery, shipping, or pick up from me." · "Pay your way. Card, gift card or in person, in full or in 4 payments."

**FAQ (#faq).** Native `<details>`, chevron rotates 180° in `--base`.
- "Do crystals actually heal?" "I share what stones are traditionally associated with. They're no substitute for medical care, and I make no health claims."
- "What's in a tumbled bag?" "8–10 polished stones, about 2–3 cm each, in a cotton drawstring pouch."
- "How does paying over time work?" "Your total splits into 4 equal payments: one today, then one every 2 weeks. No fees."
- "Can I pay in person?" "Yes, for pickup or local delivery, not for shipped orders."
- "Will mine match the photo?" "No two stones are identical. I pick yours by hand to match its size and colour."

**Footer:** wordmark, "Hand-picked by Melody.", Shop · Meanings · FAQ · Photo credits, "© 2026 Melody's Crystals".

## 7. Product page
≥1024: gallery 7/12, buy box 5/12 sticky `top: 96px`; below, stacked. Breadcrumb "Shop / Amethyst". Title "Amethyst · Melody's Crystals".

**Gallery:** main 4:5 frame; 3 × 64 px thumbs, one per format; a format without its own photo reuses the crystal photo with a mat badge ("Jar"). Swaps crossfade 160 ms.

**Buy box:** H1 (Fraunces 2.25), meaning in italic, trust lines "Hand-picked by Melody" · "Cleansed & wrapped" · "Pickup or local delivery available". Format tiles (native radios; stacked at 375, 3-across ≥768): title, size, price. Per-piece line. Stepper 1–10. "Add to bag" (clay, 52 px), "Buy now" (outline). No stars, no review counts.

Formats: **Tumbled bag** "8–10 stones · 2–3 cm" (pieces 9) · **Big crystal** "One piece · 6–9 cm" (1) · **Jar of big crystals** "About 6 pieces · 3–5 cm · 500 ml glass jar" (6).
| Moment | On screen | Why |
|---|---|---|
| Default | Bag selected; "$16"; "About $1.78 per stone"; qty 1. | Matches grid "From". |
| Select Jar | Tile 2 px clay border + check; price → "$95" (220 ms count, none if reduced motion); "About $15.83 per piece · a full display"; main image → jar; button "Add to bag · $95". | Every number changes together, within one frame of input. |
| Qty 3 | Button "Add to bag · $285". Minus disabled at 1; at 10: "Need more? Message Melody." | Price where the decision happens. |
| Add | Press 1 px/90 ms; label "Added ✓" 1200 ms; badge 1→1.25→1 spring 380 ms; drawer opens. | Confirmed in three places. |
| Buy now | Adds, goes to checkout. | Marketplace shortcut. |
| Bad slug | "We couldn't find that crystal." + "Back to the shop". | No blank page. |

Below: Meaning · How it can help · Intentions (tags link to `index.html#shop?i=…`) · Chakra · Care ("Rinse gently with water. Keep selenite dry.") · "You might also like" (4 sharing a tag). At 375 a bottom bar (price + "Add to bag") appears once the buy box scrolls off.

## 8. Bag drawer
Right panel 420 px (100% at 375), slides in `--slow`; scrim `#1a161380` `--base`. Focus trapped; Esc/scrim close; focus returns to opener. `localStorage` `mc.bag.v1`.
| Moment | On screen | Why |
|---|---|---|
| Items | "Your bag (3)". Rows: 56 px thumb, name, format, stepper, line total, "Remove". Sticky footer: Subtotal, "Delivery and payment options at checkout.", "Checkout", "Keep shopping". | Only what decides. |
| Just added | New row tinted `--mat` 1200 ms. | Shows the change. |
| Remove | Row collapses 220 ms; "Removed Amethyst · Undo" 5 s. | Forgiving. |
| Empty | Gem glyph, "Your bag is empty.", "Find a stone that speaks to you.", "Shop crystals". | Next step. |
| No storage | Works for the session; "Your bag won't be saved after you close this tab." | Degrades gently. |

## 9. Checkout
≥1024: form 7/12, sticky summary 5/12; below, a top bar "Show order summary · $112.00". Above the form, moss-edged `--mat` notice: "**Preview checkout.** No card will be charged until Melody connects payments. Your details stay in this browser." Empty bag: "Your bag is empty." + "Shop crystals".

Fees: Local delivery $5 (free over $75); Shipping $8 (free over $100); Pickup free. No tax line; footnote "No sales tax is added in this preview." Money in integer cents.
| Step / moment | On screen | Why |
|---|---|---|
| 1 Contact | Name, Email, Phone ("Optional, for pickup or delivery questions"). | Minimal. |
| 2 Fulfilment | Radio cards: "Local delivery · within about 15 miles · $5" / "Shipping · 3–5 business days · $8" / "In-person pickup · I'll text you when it's ready · Free". Delivery/Shipping reveal address (240 ms); Pickup shows "Pickup is by appointment. I'll message you to arrange a time." | Cost on the choice. |
| 3 Payment | Credit card · Debit card · Gift card · Pay in person. With Shipping, Pay in person is disabled (60% opacity) with visible "Not available for shipped orders". If chosen then Shipping picked: cleared, live message "Pay in person isn't available for shipping. Choose another way to pay." | Rule explained, never hidden. |
| 3a Card | Legend "Credit card details" / "Debit card details". Number (4-4-4-4; Amex 4-6-5; brand badge after 1–2 digits), Name on card, Expiry MM / YY, CVC (3; Amex 4), ZIP. Correct `autocomplete`. | Real-checkout behaviour. |
| 3b Gift card | Code 4-4-4-4 + 4-digit PIN. | A4. |
| 3c In person | "Pay cash or card when you collect, or when I deliver." | Clear expectation. |
| 4 Plan | "Pay in full · $112.00 today" / "Pay over time · 4 payments of $28.00". Over time reveals "Today $28.00 · Dec 7 $28.00 · Dec 21 $28.00 · Jan 4 $28.00" (today + 14n days; remainder cents on payment 1). | Math shown. |
| Summary | Items, Subtotal, Delivery ("Free" in moss, fee struck through), Total, "Due today $28.00". | Always reconciles. |
| Submit | "Place order · $112.00" or "Place order · $28.00 today"; 600 ms "Placing your order…". | Honest button. |
| Errors | Top summary "Please fix 2 things before placing your order" with links; focus moves there. Inline `--err` text + icon, `aria-describedby`; validate on blur, then on input. | Fix in place. |
| Confirmed | Brass check; "Thank you, Ava!"; "Order MC-7K4Q2P" (6 chars from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`); recap of fulfilment, payment, plan, items; "This was a preview, so nothing was charged. Melody will be in touch at ava@example.com."; Fraunces italic "With love, Melody"; bag cleared; "Back to the shop". | An ending worth screenshotting. |

**Error copy:** "Please add your name." · "That email looks incomplete. Try name@example.com." · "We need a street address to deliver." · "Please add a city." · "ZIP codes are 5 digits." · "Choose how you'd like your order." · "Choose a way to pay." · "That card number doesn't look right. Check the digits." · "We accept Visa, Mastercard, Amex and Discover." · "Use MM / YY." · "That card has expired." · "Enter the 3-digit code on the back." (Amex: "Enter the 4-digit code on the front.") · "Gift card codes are 16 digits." · "PINs are 4 digits."

## 10. Crystal copy and prices
Format: **Name** · Bag/Big/Jar USD (`site/data/crystals.js`) · tags · chakra. Meaning. *How it can help.*
- **Clear Quartz** · 12/28/65 · Clarity, Focus, Energy · Crown. The all-purpose stone of clarity. *Traditionally called the "master healer," it's kept nearby for a clear head. Many pair it with other stones to amplify an intention.*
- **Amethyst** · 16/42/95 · Calm, Sleep, Clarity · Third eye. A quiet stone for rest. *Long associated with calm and sober thinking, it's often kept by the bed. People reach for it to wind down.*
- **Rose Quartz** · 14/36/85 · Love, Calm, Confidence · Heart. The stone of love and kindness. *Traditionally linked with love of every kind, including for yourself. A soft reminder to be gentle with your heart.*
- **Citrine** · 22/68/150 · Abundance, Energy, Confidence · Solar plexus. A sunny stone of plenty. *Called the "merchant's stone," it's kept in shops and wallets for abundance. Its warm colour is associated with optimism.*
- **Smoky Quartz** · 16/40/95 · Calm, Protection, Sleep · Root. A grounding stone for heavy days. *Traditionally used for grounding and letting go of stress. People keep it close to feel steady.*
- **Black Tourmaline** · 15/38/90 · Protection, Calm, Confidence · Root. The classic protection stone. *Long associated with protection, it's often placed by the front door. Many keep one as a shield against negativity.*
- **Selenite** · 12/30/70 · Calm, Sleep, Clarity · Crown. Soft light for a peaceful space. *Traditionally used to cleanse a room and other crystals. Its glow is associated with peace and quiet evenings.*
- **Tiger's Eye** · 14/34/80 · Confidence, Focus, Abundance · Solar plexus. A golden stone of courage. *Traditionally carried for courage and good judgement. Its shifting stripes are associated with drive and luck.*
- **Labradorite** · 20/58/135 · Creativity, Protection, Clarity · Third eye. The stone of change. *Its flash of colour is traditionally associated with intuition and transformation. People keep it close through new beginnings.*
- **Carnelian** · 15/36/85 · Energy, Creativity, Love · Sacral. A bright spark of motivation. *Traditionally associated with vitality and creative fire. Often kept on a desk to get projects moving.*
- **Lapis Lazuli** · 22/75/160 · Focus, Clarity, Confidence · Throat. A royal-blue stone of wisdom. *Prized since ancient Egypt, it's associated with truth and wisdom. People keep it near for honest conversations.*
- **Fluorite** · 18/48/110 · Focus, Clarity, Calm · Third eye. The tidy-mind stone. *Traditionally linked with focus and order, it's a favourite for study desks. Its colour bands are associated with clear thinking.*

Chip counts (computed): Calm 6, Clarity 6, Confidence 5, Focus 4, Protection 3, Energy 3, Sleep 3, Creativity 2, Love 2, Abundance 2. Alt text: "Purple amethyst cluster on a dark background".

## 11. Voice
Melody, first person, warm, short sentences. Never "heals", "cures", "treats". Buttons are verbs. "Every order is packed by me, with a little card about your stone."

## 12. Responsive
- **375:** header = wordmark, bag, menu (sheet); grid 2-up; tiles stacked; product bottom bar; checkout single column.
- **768:** grid 3; meanings 2; product stacked, gallery 70% centred.
- **1024–1440:** two-column hero, product, checkout; sticky buy box and summary; grid 4 at ≥1200.
- **1920:** container stays 1200; hero photo ≤ 640 px tall.
- 200% zoom: no horizontal scroll; sticky elements unstick when viewport height < 640.

## 13. Accessibility
WCAG 2.2 AA; targets ≥ 44 px; option tiles, chips-as-toggles and payment cards are native inputs; price and filter changes in `aria-live="polite"`; drawer `role="dialog" aria-modal`; theme follows `prefers-color-scheme`, toggle stored as `mc.theme`; reduced motion honoured.

## 14. Polish list
1. Grid prices share a baseline across each row.
2. Every photo has the same mat, radius and vignette; no white or black photo edge touches the card.
3. "Shop crystals" visible unscrolled at 375×812 and 1440×900.
4. Primary buttons depress 1 px over 90 ms ease-out; hover darkens clay 6%.
5. 3 px `--focus` ring, 2 px offset, never clipped.
6. Chips show counts; the hash restores the filter on reload.
7. Format change updates price, per-piece line, image and button in one frame.
8. Add to bag: "Added ✓", badge bump, drawer opens.
9. Badge never shifts the header (20 px min-width, tabular figures).
10. Drawer returns focus to its opener.
11. Remove offers Undo for 5 s.
12. Disabled Pay in person states its reason in visible text.
13. Card number auto-spaces without jumping the caret mid-edit.
14. Brand badge appears as soon as the brand is known.
15. Expiry inserts " / " after 2 digits; backspace removes it cleanly.
16. Over-time schedule uses real dates and sums exactly to the total.
17. Waived delivery shows "Free" in moss with the fee struck through.
18. Error-summary links focus their field.
19. Order numbers avoid 0/O and 1/I.
20. Dark mode keeps mats and vignette; page is never pure black.
21. Font fallback uses `size-adjust`; CLS ≤ 0.05.
22. Broken images fall back to the named mat card.
23. Whole dollars in grid and tiles; cents only in drawer and checkout.
24. Every page title is specific ("Amethyst · Melody's Crystals").
25. Preview notice appears at checkout top and on confirmation.

## 15. Anti-goals
No purple gradients, galaxies, sparkles; no fake stars, reviews, scarcity or timers; no health claims.

## 16. Acceptance by eye
At 375×812, 768×1024, 1440×900, light and dark: home top; #meanings; #shop default and Sleep; product default and Jar; drawer full and empty; checkout with Shipping (Pay in person disabled), card errors, over-time schedule; confirmation. Check: photos read as one set; numbers reconcile; no layout shift.
