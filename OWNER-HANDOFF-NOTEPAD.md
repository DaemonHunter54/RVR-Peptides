# RVR Peptides — Owner Handoff Notepad

**Last updated:** June 9, 2026  
**Live site:** https://rvr-peptides-production.up.railway.app  
**Admin:** `/admin` → Products  

This file is the running checklist for the site owner. Work top to bottom. When something is done, check it off here (or tell your developer to update this file).

---

## How to finish product research (do this for each product below)

1. Log in to **Admin → Products**.
2. Products with incomplete research show a **Missing Info** link next to the name. Use **Show missing only** to filter the list.
3. Click the product name (or **Missing Info**) to open the editor.
4. Scroll to **Published Research Content**.
5. Click **Pull Reference Research**:
   - If the product name matches the reference catalog, content loads automatically.
   - If not, paste a reference URL in **Reference product URL** (must end in `/peptides/product-slug/`), then click **Pull Reference Research** again.
6. Review **Overview**, **Chemical Makeup**, **Research Content**, and **Citations**. Edit dose, SKU, and specs to match **your** RVR listing (not the reference site).
7. Click **Save Research Content** at the bottom of the research section.
8. Click **Save Product** at the top of the page.

Optional (manual only — nothing runs automatically):
- **Fetch Sources** — PubChem / PubMed citations
- **Generate Draft Copy** — AI rewrite using your Product Brief (requires OpenAI API key in server env)

---

## Site & business setup (not product research)

- [ ] Add business address (footer / contact / legal pages as needed)
- [ ] Add business phone number
- [ ] Finalize custom domain (DNS pointed to Railway)
- [ ] Set up email forwarding for orders/support
- [ ] Complete **PaymentCloud** merchant setup and test a live payment
- [ ] Review Terms, Privacy, and research-use disclaimers with your lawyer

---

## Products — likely need a reference URL (no automatic catalog match)

These did **not** auto-match the reference peptide catalog. Paste the closest reference product URL, pull research, then customize for RVR.

| Product | Slug | Category | Notes |
|---------|------|----------|-------|
| Cagrilintide 5mg | `cagrilintide-5mg` | Peptides | Write from scratch or find closest GLP reference URL |
| Cagrilintide/Semaglutide 5mg/5mg | `cagrilintide-semaglutide-5mg-5mg` | Blends | Blend — paste closest blend URL |
| GLP-1 Semaglutide 5mg | `glp-1-semaglutide-5mg` | Peptides | |
| GLP-1 Semaglutide 10mg | `glp-1-semaglutide-10mg` | Peptides | |
| Mazdutide 5mg | `mazdutide-5mg` | Peptides | |
| Retatrutide 5mg | `retatrutide-5mg` | Peptides | |
| Retatrutide 15mg | `retatrutide-15mg` | Peptides | |
| SS-31 30mg | `ss-31-30mg` | Peptides | |
| Survodutide 5mg | `survodutide-5mg` | Peptides | |
| Tirzepatide 5mg | `tirzepatide-5mg` | Peptides | |
| Tirzepatide 15mg | `tirzepatide-15mg` | Peptides | |
| 5-Amino-1MQ 50mg | `5-amino-1mq-50mg` | Peptides | |
| Bacteriostatic Water 10ml | `bacteriostatic-water-10ml` | Reconstitution | Short utility copy — may not need full research |
| Bacteriostatic Water 30ml | `bacteriostatic-water-30ml` | Reconstitution | |
| Hospira Bacteriostatic Water 30ml | `hospira-bacteriostatic-water-30ml` | Reconstitution | |
| Reconstitution Kit | `reconstitution-kit` | Reconstitution | |
| Glutathione 1200mg | `glutathione-1200mg` | Wellness | |
| L-Carnitine 300mg/ml 30ml | `l-carnitine-300mg-ml-30ml` | Wellness | |
| Vitamin B Complex | `vitamin-b-complex` | Wellness | |
| Vitamin D 100,000 IU/ml | `vitamin-d-100-000-iu-ml` | Wellness | |
| Curenex Daily Care Rejuvenating Cream | `curenex-daily-care-rejuvenating-cream` | Skin Care | |
| Curenex Daily Care Skin Booster | `curenex-daily-care-skin-booster` | Skin Care | |
| Curenex Hydrating Cleanser | `curenex-hydrating-cleanser` | Skin Care | |
| Curenex Sheer Sunscreen 50 SPF | `curenex-sheer-sunscreen-50-spf` | Skin Care | |
| RM Repair Moisturizing Cream | `rm-repair-moisturizing-cream` | Skin Care | |
| Urea Cream Skin Softener | `urea-cream-skin-softener` | Skin Care | |

**Custom / renamed products** (e.g. “Glow” and other listings you added manually): use **Missing Info** in admin — if flagged, follow the same steps above.

---

## Products — try Pull Reference Research first (catalog match available)

These names matched the reference catalog. Open each product, click **Pull Reference Research**, review, and save. Still check **Missing Info** in admin — some may already be filled; some may still be empty if bulk import never ran.

| Product | Slug |
|---------|------|
| BPC-157 5mg | `bpc-157-5mg` |
| BPC-157 10mg | `bpc-157-10mg` |
| BPC-157 Capsules 500mcg (30) | `bpc-157-capsules-500mcg-30` |
| TB-500 | `tb-500` |
| CJC-1295 No DAC/Ipamorelin 5mg/5mg | `cjc-1295-no-dac-ipamorelin-5mg-5mg` |
| DSIP 5mg | `dsip-5mg` |
| Epithalon 10mg | `epithalon-10mg` |
| GHK-Cu 50mg | `ghk-cu-50mg` |
| Kisspeptin 10mg | `kisspeptin-10mg` |
| KPV 10mg | `kpv-10mg` |
| Melanotan 1 10mg | `melanotan-1-10mg` |
| Melanotan 2 10mg | `melanotan-2-10mg` |
| MOTS-c 5mg | `mots-c-5mg` |
| MOTS-c 10mg | `mots-c-10mg` |
| NAD+ 500mg | `nad-500mg` |
| NAD+ 1000mg | `nad-1000mg` |
| Oxytocin Acetate 5mg | `oxytocin-acetate-5mg` |
| PE-22-28 10mg | `pe-22-28-10mg` |
| Pinealon 20mg | `pinealon-20mg` |
| PT-141 10mg | `pt-141-10mg` |
| Selank 10mg | `selank-10mg` |
| Selank/Semax Blend 10mg/10mg | `selank-semax-blend-10mg-10mg` |
| Semax 10mg | `semax-10mg` |
| Sermorelin 10mg | `sermorelin-10mg` |
| Super Wolf 10mg/10mg/10mg | `super-wolf-10mg-10mg-10mg` |
| Tesamorelin 10mg | `tesamorelin-10mg` |
| Thymosin Alpha-1 10mg | `thymosin-alpha-1-10mg` |
| Wolverine Blend 20mg | `wolverine-blend-20mg` |

---

## After all products are complete

Ask your developer to remove (temporary admin tools):

- [ ] **Missing Info** links and filter on the product list
- [ ] **Pull Reference Research** / reference catalog integration (if you no longer want it)
- [ ] This handoff notepad can be archived or deleted

---

## Quick reference — what was removed (June 2026)

To prevent accidental overwrites, these **automatic** features were removed:

- Bulk **Import Research Templates** button on the product list
- Auto-saving research to the database when pulling reference content (you must click **Save Research Content**)
- Auto-writing pulled data into the internal knowledge-base cache table
- Admin API endpoints for bulk import / knowledge-base sync

What remains is **manual, per product**: Pull Reference Research, Fetch Sources, Generate Draft Copy, then Save.
