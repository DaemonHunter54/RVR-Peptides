# RVR Peptides — Owner Handoff Notepad

**Last updated:** June 13, 2026  
**Live site:** https://rvr-peptides-production.up.railway.app  
**Reference catalog:** https://peptidelabs.us/research-peptides/  
**Admin:** `/admin` → Products  

Product descriptions now follow the **Peptide Labs** layout: **Description**, **Product Details**, and **Potential Research Applications**. Dose, price, vial image, and stock are unchanged.

---

## One-time setup (developer / Railway)

After deploy, run this once from your computer (with `railway login` + `railway link` already done):

```bash
npm run peptide-labs:import:prod -- --apply
```

This automatically uses Railway's public MySQL URL — no manual `DATABASE_URL` copy/paste.

Preview matches only (no database changes):

```bash
npm run peptide-labs:report
```

---

## How to finish a product manually

1. Admin → **Products** → open the product (or use **Missing Info** / **Show missing only**).
2. Scroll to **Product Description**.
3. Find the matching listing on [Peptide Labs](https://peptidelabs.us/research-peptides/) and copy its product URL (example: `https://peptidelabs.us/bpc-157/?attribute_strength=5%20mg`).
4. Paste the URL → click **Pull Reference Research**.
5. Review the three sections, adjust dose wording if needed for your RVR listing.
6. Click **Save Description**, then **Save Product**.

---

## Products that still need a manual Peptide Labs URL (13)

These are **not** on Peptide Labs or have no reliable auto-match. Paste the closest URL or write copy by hand.

| Product | Slug | Notes |
|---------|------|-------|
| Mazdutide 5mg | `mazdutide-5mg` | Not listed on Peptide Labs |
| Super Wolf 10mg/10mg/10mg | `super-wolf-10mg-10mg-10mg` | Custom blend — find closest blend URL or write manually |
| Survodutide 5mg | `survodutide-5mg` | Not listed on Peptide Labs |
| Reconstitution Kit | `reconstitution-kit` | Accessory — short utility copy |
| L-Carnitine 300mg/ml 30ml | `l-carnitine-300mg-ml-30ml` | Wellness — not on Peptide Labs |
| Vitamin B Complex | `vitamin-b-complex` | Wellness |
| Vitamin D 100,000 IU/ml | `vitamin-d-100-000-iu-ml` | Wellness |
| Curenex Daily Care Rejuvenating Cream | `curenex-daily-care-rejuvenating-cream` | Skin care |
| Curenex Daily Care Skin Booster | `curenex-daily-care-skin-booster` | Skin care |
| Curenex Hydrating Cleanser | `curenex-hydrating-cleanser` | Skin care |
| Curenex Sheer Sunscreen 50 SPF | `curenex-sheer-sunscreen-50-spf` | Skin care |
| RM Repair Moisturizing Cream | `rm-repair-moisturizing-cream` | Skin care |
| Urea Cream Skin Softener | `urea-cream-skin-softener` | Skin care |

**Custom products** (e.g. renamed “Glow”): use **Missing Info** in admin if flagged.

---

## Products auto-filled from Peptide Labs (41)

Run `npm run peptide-labs:import:prod -- --apply` to load these. Re-check dose wording after import — some RVR doses differ from the closest Peptide Labs listing (e.g. 5mg vs 10mg).

| Product | Peptide Labs source |
|---------|---------------------|
| BPC-157 5mg | BPC-157 5 mg |
| BPC-157 10mg | BPC-157 10 mg |
| BPC-157 Capsules 500mcg (30) | BPC-157 5 mg (review — capsules) |
| TB-500 | TB-500 5 mg |
| Cagrilintide 5mg | Cagrilintide 5 mg |
| Cagrilintide/Semaglutide 5mg/5mg | Cagrilintide 5 mg (review — blend) |
| CJC-1295 No DAC/Ipamorelin 5mg/5mg | CJC-1295 (No DAC) + Ipamorelin 10 mg |
| DSIP 5mg | DSIP 10 mg (closest dose) |
| Epithalon 10mg | Epithalon (Epitalon) 10 mg |
| GHK-Cu 50mg | GHK-Cu 50 mg |
| GLP-1 Semaglutide 5mg | Semaglutide 10 mg (closest dose) |
| GLP-1 Semaglutide 10mg | Semaglutide 10 mg |
| Kisspeptin 10mg | KissPeptin 10 mg |
| KPV 10mg | KPV 10 mg |
| Melanotan 1 10mg | Melanotan 1 (MT-1) 10 mg |
| Melanotan 2 10mg | Melanotan 2 (MT-2) 10 mg |
| MOTS-c 5mg | MOTS-c 10 mg (closest dose) |
| MOTS-c 10mg | MOTS-c 10 mg |
| NAD+ 500mg | NAD+ 500 mg |
| NAD+ 1000mg | NAD+ 1000 mg |
| Oxytocin Acetate 5mg | Oxytocin-Acetate 5 mg |
| PE-22-28 10mg | Closest match from catalog (verify URL) |
| Pinealon 20mg | Pinealon 20 mg |
| PT-141 10mg | PT-141 10 mg |
| Retatrutide 5mg | Retatrutide 10 mg (closest dose) |
| Retatrutide 15mg | Retatrutide 20 mg (closest dose) |
| Selank 10mg | Selank 10 mg |
| Selank/Semax Blend 10mg/10mg | Semax + Selank 10 mg |
| Semax 10mg | Semax 10 mg |
| Sermorelin 10mg | Sermorelin 10 mg |
| SS-31 30mg | SS-31 50 mg (closest dose) |
| Tesamorelin 10mg | Tesamorelin 10 mg |
| Thymosin Alpha-1 10mg | Thymosin Alpha-1 10 mg |
| Tirzepatide 5mg | Tirzepatide 10 mg (closest dose) |
| Tirzepatide 15mg | Tirzepatide 20 mg (closest dose) |
| Wolverine Blend 20mg | BPC-157+TB-500 20 mg |
| 5-Amino-1MQ 50mg | 5-amino-1MQ 50 mg |
| Bacteriostatic Water 10ml | Bacteriostatic Water 10 ml |
| Bacteriostatic Water 30ml | Bacteriostatic Water 10 ml (review size) |
| Hospira Bacteriostatic Water 30ml | Bacteriostatic Water 10 ml (review) |
| Glutathione 1200mg | Glutathione 1500 mg (closest dose) |

Full URL list: `reports/peptide-labs-import-latest.json`

---

## Site & business setup (unchanged)

- [ ] Business address, phone, domain, email forwarding  
- [ ] PaymentCloud setup and test payment  
- [ ] Legal review of Terms / Privacy / research disclaimers  

---

## After all products are complete

- [ ] Remove **Missing Info** links / filter (temporary)  
- [ ] Archive this notepad  

---

## What changed (June 2026)

- Research source is now **Peptide Labs** (not Core Peptides).  
- Admin shows only: URL, **Pull Reference Research**, and three description fields.  
- Removed: AI draft copy, PubMed fetch, citations editor, product brief, quality notes.  
- Storefront **Description** tab matches Peptide Labs section titles.  
- Old research / citations cleared when `peptide-labs:import:prod -- --apply` is run.
