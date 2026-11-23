# M-0004 — Melody's Crystal Shop

| | |
|---|---|
| Tier | 2 (Squad) + `polish` |
| Domain / playbook | interactive-web |
| Output | `projects/melody-crystal-shop` |
| Dossier | `bureau/missions/M-0004-melody-crystal-shop` |
| Opened | 2026-11-23 |
| Program | — |

## The ask (verbatim)
> Open a new repo branch for my sister Melody so she can have a webpage for selling her crystals. Here is her telling you what she wants.
>
> A screen that shows the title and explains what kind of crystals there are and their meaning/what they stand for and how they can help people, make it clickable on the pictures of the crystals, the names of the certain crystal being shown, it should be able to scroll down and see the crystals and prices, what I need is for it to be able to press on whatever crystal there is and have something similar to an Amazon page, to show how much it is for a bag of quarts, a big crystal, or a jar with many big crystals, not to mention I want it to be for all the crystals that are listed, they should also have a button I can use to pay for, it'll ask for card information. The options are card, gift card, debit, credit, see in person and pay, and it should have delivery, shipping, in person (so they come to us) and they can pay over time or over the website.
>
> Acquire all assets and make sure it's a lot of high quality full webpage for her give me the GitHub link

## What the Owner actually wants
A real-feeling small-business storefront Melody is proud to send people to. Visitors land, understand what each crystal traditionally stands for, browse a grid with photos, names and "from" prices, and open any crystal to a product page that works like a familiar marketplace listing: gallery, three size options with prices, quantity, add to bag / buy now. Checkout gathers the fulfilment choice and the payment choice and asks for card details when a card method is chosen.

## Definition of exceptional
1. The first screen reads as a boutique brand (not a template): a title, a one-line promise, real crystal photography, and a clear path to "Shop crystals" within 5 s.
2. Every crystal (12) has real photography, a meaning, "how it can help" copy, and its own product page reachable from both its picture and its name.
3. Each product page offers exactly the three formats — **Tumbled bag**, **Big crystal**, **Jar of big crystals** — with distinct prices, and the price, savings line and button update instantly on selection.
4. Checkout offers all five payment options (card, debit, credit, gift card, pay in person) and all three fulfilment options (local delivery, shipping, in-person pickup), plus **pay in full** or **pay over time (4 payments)**, with the totals math visibly correct.
5. Card fields validate like a real checkout (Luhn, expiry in the future, CVC length, brand detection), with human error copy, and never leave the browser.
6. Works and looks finished at 375 px to 1920 px, keyboard-only, in light and dark, with reduced motion respected.
7. Honest: wellness copy is framed as tradition, not medical claims, and the checkout clearly says it is a preview until a payment processor is connected.

## Scope
- **In:** home (hero, meanings explainer, shop grid with filter by intention, how buying works, FAQ, footer), product page per crystal, bag drawer, checkout with order confirmation, photo credits page, README with run/verify and "going live with payments".
- **Out (and why):** a real payment processor (needs Melody's merchant account and the Owner's go-ahead; documented as a one-file swap), hosting/deploy (outward action), inventory backend.

## Constraints & assumptions
- [A1] Static site, no build step required to view (plain HTML/CSS/ES modules), so Melody can host it anywhere free.
- [A2] Photos come from Wikimedia Commons under free licences, credited on a credits page; no paid generation (spending needs the Owner).
- [A3] Prices are placeholders set in one data file (`site/data/crystals.js`) that Melody edits.
- [A4] "Debit" and "credit" are both card types; they share the card form, labelled per choice. Gift card takes a 16-digit code + PIN.
- [A5] "Pay in person" pairs naturally with pickup or delivery; with shipping it is disabled with a reason.

## Success criteria
1. `npm run verify` green: static checks, e2e of browse → product → option → bag → checkout (every payment × fulfilment combination legal), axe scan with zero serious/critical violations, screenshots at 375/768/1440.
2. All 12 crystals render with photo + three priced formats.
3. No console errors; no network requests other than same-origin assets and Google Fonts.

## Lessons in force
- L-0001: a single site is tier 2 + levers, not tier 3.
- L-0003: spend the spec on frame tables.

## Risks known at intake
- Image licences: must record author + licence for every photo.
- Card forms that don't charge can mislead buyers → visible preview notice; no card data stored or transmitted.
