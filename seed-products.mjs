import mysql from "mysql2/promise";
import "dotenv/config";

const products = [
  {"name":"5-Amino-1MQ 50MG","price":40.00,"categories":["Peptides","Energy","Fat Loss","Longevity","Metabolism"],"description":"5-Amino-1MQ is a potent, selective NNMT (nicotinamide N-methyltransferase) inhibitor. Research suggests it may play a role in metabolic regulation, energy expenditure, and fat cell metabolism.","shortDescription":"NNMT inhibitor peptide for metabolic research","purity":">98%","size":"50mg","form":"Lyophilized Powder"},
  {"name":"BPC-157 5mg","price":35.00,"categories":["Peptides","Longevity","Recovery"],"description":"BPC-157 (Body Protection Compound-157) is a pentadecapeptide derived from human gastric juice. It has been extensively studied for its regenerative and protective properties in various tissue types.","shortDescription":"Body Protection Compound-157 peptide","purity":">99%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"BPC-157 10mg","price":60.00,"categories":["Peptides","Longevity","Recovery"],"description":"BPC-157 (Body Protection Compound-157) is a pentadecapeptide derived from human gastric juice. Higher dose vial for extended research protocols.","shortDescription":"Body Protection Compound-157 peptide - 10mg","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"BPC-157 Capsules 500MCG (30)","price":50.00,"categories":["Peptides","Longevity","Recovery","Orals"],"description":"Oral BPC-157 capsules providing 500mcg per capsule. 30 capsules per bottle for convenient oral administration research protocols.","shortDescription":"Oral BPC-157 capsules, 500mcg each, 30 count","purity":">98%","size":"500mcg x 30","form":"Capsules"},
  {"name":"Cagrilintide/Semaglutide 5mg/5mg","price":88.00,"categories":["Peptides","Fat Loss"],"description":"A research blend combining Cagrilintide and Semaglutide. This dual-action combination targets both amylin and GLP-1 receptor pathways for metabolic research.","shortDescription":"Cagrilintide and Semaglutide blend","purity":">98%","size":"5mg/5mg","form":"Lyophilized Powder"},
  {"name":"Cagrilintide 5MG","price":60.00,"categories":["Peptides","Fat Loss"],"description":"Cagrilintide is a long-acting amylin analog being researched for its role in appetite regulation and metabolic function.","shortDescription":"Cagrilintide peptide for metabolic research","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"CJC-1295 (No DAC) / Ipamorelin 5mg/5mg","price":45.00,"categories":["Peptides","Fat Loss","Hormone Support","Longevity","Muscle Growth","Recovery","Sleep"],"description":"A synergistic blend of CJC-1295 without DAC and Ipamorelin. This combination is widely studied for growth hormone releasing properties with complementary mechanisms of action.","shortDescription":"Growth hormone releasing peptide blend","purity":">99%","size":"5mg/5mg","form":"Lyophilized Powder"},
  {"name":"DSIP 5mg","price":33.00,"categories":["Peptides","Sleep"],"description":"Delta Sleep Inducing Peptide (DSIP) is a neuropeptide that has been studied for its role in sleep regulation, stress response, and neuromodulation.","shortDescription":"Delta Sleep Inducing Peptide","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"Epithalon 10mg","price":28.00,"categories":["Peptides","Energy","Longevity","Recovery","Sleep"],"description":"Epithalon (Epitalon) is a synthetic tetrapeptide studied for its potential to activate telomerase, the enzyme responsible for maintaining telomere length. Research focuses on its anti-aging properties.","shortDescription":"Telomerase activator peptide","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"GHK-Cu 50MG","price":35.00,"categories":["Peptides","Cosmetics"],"description":"GHK-Cu is a naturally occurring copper peptide found in human plasma. It has been extensively studied for its role in tissue remodeling, anti-inflammatory signaling, and skin regeneration.","shortDescription":"Copper peptide for skin and tissue research","purity":">98%","size":"50mg","form":"Lyophilized Powder"},
  {"name":"Glow 70MG","price":85.00,"categories":["Peptides","Cosmetics","Energy","Longevity","Recovery"],"description":"Glow is a multi-peptide cosmetic blend formulated for skin rejuvenation and regeneration research. Contains a proprietary combination of bioactive peptides.","shortDescription":"Multi-peptide cosmetic blend","purity":">98%","size":"70mg","form":"Lyophilized Powder"},
  {"name":"GLP-1 Semaglutide 5mg","price":40.00,"categories":["Peptides","Fat Loss"],"description":"Semaglutide is a GLP-1 receptor agonist extensively studied for its effects on glucose metabolism, appetite regulation, and body composition.","shortDescription":"Semaglutide - GLP-1 receptor agonist","purity":">99%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"GLP-1 Semaglutide 10mg","price":100.00,"categories":["Peptides","Fat Loss"],"description":"Higher dose Semaglutide for extended research protocols. GLP-1 receptor agonist studied for metabolic and body composition research.","shortDescription":"Semaglutide - GLP-1 receptor agonist 10mg","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Tirzepatide 5mg","price":75.00,"categories":["Peptides","Fat Loss","Metabolism"],"description":"Tirzepatide is a dual GIP/GLP-1 receptor agonist being studied for its effects on glucose metabolism, insulin sensitivity, and body composition.","shortDescription":"Tirzepatide - dual GIP/GLP-1 receptor agonist","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"Tirzepatide 15mg","price":245.00,"categories":["Peptides","Fat Loss","Metabolism"],"description":"Higher dose Tirzepatide for extended research protocols. Dual GIP/GLP-1 receptor agonist.","shortDescription":"Tirzepatide - dual GIP/GLP-1 receptor agonist 15mg","purity":">98%","size":"15mg","form":"Lyophilized Powder"},
  {"name":"Retatrutide 5mg","price":75.00,"categories":["Peptides","Fat Loss","Metabolism"],"description":"Retatrutide is a novel triple hormone receptor agonist (GIP/GLP-1/Glucagon) being studied for its effects on metabolism and body composition.","shortDescription":"Retatrutide - triple hormone receptor agonist","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"Retatrutide 15mg","price":250.00,"categories":["Peptides","Fat Loss","Metabolism"],"description":"Higher dose Retatrutide for extended research. Triple hormone receptor agonist.","shortDescription":"Retatrutide - triple hormone receptor agonist 15mg","purity":">98%","size":"15mg","form":"Lyophilized Powder"},
  {"name":"Glutathione 1200MG","price":45.00,"categories":["Peptides","Energy","Longevity","Recovery"],"description":"Glutathione is a tripeptide and the body's master antioxidant. Research focuses on its role in oxidative stress reduction, detoxification, and cellular protection.","shortDescription":"Master antioxidant peptide","purity":">99%","size":"1200mg","form":"Lyophilized Powder"},
  {"name":"Kisspeptin 10MG","price":30.00,"categories":["Peptides","Hormone Support"],"description":"Kisspeptin is a neuropeptide that plays a critical role in the regulation of reproductive hormones through the hypothalamic-pituitary-gonadal axis.","shortDescription":"Kisspeptin peptide for reproductive hormone research","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"KLOW 80MG","price":85.00,"categories":["Peptides","Cosmetics","Longevity","Recovery"],"description":"KLOW is a multi-peptide cosmetic blend designed for advanced skin research and regeneration protocols.","shortDescription":"Multi-peptide cosmetic blend","purity":">98%","size":"80mg","form":"Lyophilized Powder"},
  {"name":"KPV 10MG","price":35.00,"categories":["Peptides","Longevity","Recovery"],"description":"KPV is a naturally occurring anti-inflammatory tripeptide (Lys-Pro-Val) derived from alpha-MSH. It has been studied for its potent anti-inflammatory and antimicrobial properties.","shortDescription":"Anti-inflammatory tripeptide","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Mazdutide 5MG","price":50.00,"categories":["Peptides","Fat Loss"],"description":"Mazdutide is a dual GLP-1/glucagon receptor agonist being investigated for its effects on metabolic regulation and body composition.","shortDescription":"Dual GLP-1/glucagon receptor agonist","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"Melanotan 1 10MG","price":35.00,"categories":["Peptides","Cosmetics","Hormone Support"],"description":"Melanotan 1 (Afamelanotide) is a synthetic analog of alpha-melanocyte stimulating hormone. It is studied for its effects on melanogenesis and photoprotection.","shortDescription":"Afamelanotide - melanocortin receptor agonist","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Melanotan 2 10MG","price":35.00,"categories":["Peptides","Cosmetics","Energy","Longevity"],"description":"Melanotan 2 is a synthetic melanocortin receptor agonist studied for its effects on pigmentation, appetite, and libido in research settings.","shortDescription":"Melanocortin receptor agonist peptide","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"MOTS-C 5mg","price":35.00,"categories":["Peptides","Energy","Longevity","Metabolism","Mitochondrial"],"description":"MOTS-C is a mitochondrial-derived peptide encoded within the 12S rRNA gene. Research suggests it plays a role in metabolic homeostasis and exercise physiology.","shortDescription":"Mitochondrial-derived peptide","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"MOTS-C 10mg","price":85.00,"categories":["Peptides","Energy","Longevity","Metabolism","Mitochondrial"],"description":"Higher dose MOTS-C for extended research protocols. Mitochondrial-derived peptide for metabolic research.","shortDescription":"Mitochondrial-derived peptide - 10mg","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"NAD+ 500mg","price":45.00,"categories":["Peptides","Energy","Longevity","Metabolism","Mitochondrial"],"description":"NAD+ (Nicotinamide Adenine Dinucleotide) is a critical coenzyme present in every cell. Research focuses on its role in cellular energy production, DNA repair, and aging.","shortDescription":"Nicotinamide adenine dinucleotide","purity":">99%","size":"500mg","form":"Lyophilized Powder"},
  {"name":"NAD+ 1000mg","price":75.00,"categories":["Peptides","Energy","Longevity","Metabolism","Mitochondrial"],"description":"Higher dose NAD+ for extended research protocols. Critical coenzyme for cellular energy and repair research.","shortDescription":"Nicotinamide adenine dinucleotide - 1000mg","purity":">99%","size":"1000mg","form":"Lyophilized Powder"},
  {"name":"Oxytocin Acetate 5mg","price":30.00,"categories":["Peptides","Hormone Support"],"description":"Oxytocin is a neuropeptide hormone studied for its role in social bonding, stress response, and reproductive physiology.","shortDescription":"Oxytocin peptide for research","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"PE-22-28 10mg","price":36.00,"categories":["Peptides","Nootropic","Sleep"],"description":"PE-22-28 is a nootropic peptide derived from PACAP (Pituitary Adenylate Cyclase-Activating Polypeptide). It is studied for its neuroprotective and cognitive enhancement properties.","shortDescription":"Nootropic peptide derived from PACAP","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Pinealon 20mg","price":33.00,"categories":["Peptides","Hormone Support","Nootropic","Sleep"],"description":"Pinealon is a tripeptide bioregulator (Glu-Asp-Arg) that targets the pineal gland. Research focuses on its role in circadian rhythm regulation and neuroprotection.","shortDescription":"Tripeptide bioregulator for pineal gland","purity":">98%","size":"20mg","form":"Lyophilized Powder"},
  {"name":"PT-141 10MG","price":30.00,"categories":["Peptides","Hormone Support"],"description":"PT-141 (Bremelanotide) is a melanocortin receptor agonist studied for its effects on sexual function through central nervous system pathways.","shortDescription":"Bremelanotide - melanocortin receptor agonist","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Selank 10MG","price":30.00,"categories":["Peptides","Nootropic"],"description":"Selank is a synthetic analog of the immunomodulatory peptide tuftsin. It is studied for its anxiolytic, nootropic, and immunomodulatory properties.","shortDescription":"Anxiolytic nootropic peptide","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Selank/Semax Blend 10mg/10mg","price":65.00,"categories":["Peptides","Nootropic"],"description":"A synergistic blend of Selank and Semax, two well-studied nootropic peptides with complementary mechanisms for cognitive enhancement research.","shortDescription":"Dual nootropic peptide blend","purity":">98%","size":"10mg/10mg","form":"Lyophilized Powder"},
  {"name":"Semax 10MG","price":30.00,"categories":["Peptides","Nootropic"],"description":"Semax is a synthetic peptide analog of ACTH(4-10). It is extensively studied for its nootropic, neuroprotective, and neurorestorative properties.","shortDescription":"Nootropic neuropeptide","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Sermorelin 10MG","price":40.00,"categories":["Peptides","Fat Loss","Metabolism","Muscle Growth","Recovery","Sleep"],"description":"Sermorelin is a growth hormone releasing hormone (GHRH) analog consisting of the first 29 amino acids of GHRH. It stimulates natural growth hormone production.","shortDescription":"Growth hormone releasing hormone analog","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"SS-31 30MG","price":90.00,"categories":["Peptides","Mitochondrial"],"description":"SS-31 (Elamipretide) is a mitochondria-targeted tetrapeptide that concentrates in the inner mitochondrial membrane. Research focuses on mitochondrial dysfunction and cellular energetics.","shortDescription":"Elamipretide - mitochondrial targeted peptide","purity":">98%","size":"30mg","form":"Lyophilized Powder"},
  {"name":"Super Wolf 10mg/10mg/10mg","price":100.00,"categories":["Peptides","Recovery"],"description":"Super Wolf is a triple peptide recovery blend combining three synergistic peptides for advanced tissue repair and regeneration research.","shortDescription":"Triple peptide recovery blend","purity":">98%","size":"10mg/10mg/10mg","form":"Lyophilized Powder"},
  {"name":"Survodutide 5MG","price":50.00,"categories":["Peptides","Fat Loss"],"description":"Survodutide is a dual GLP-1/glucagon receptor agonist being studied for its metabolic effects and potential in body composition research.","shortDescription":"Dual GLP-1/glucagon receptor agonist","purity":">98%","size":"5mg","form":"Lyophilized Powder"},
  {"name":"Tesamorelin 10MG","price":40.00,"categories":["Peptides","Muscle Growth","Recovery","Sleep"],"description":"Tesamorelin is a growth hormone releasing factor (GRF) analog studied for its effects on growth hormone secretion and body composition.","shortDescription":"Growth hormone releasing factor analog","purity":">99%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Thymosin Alpha 1 10mg","price":36.00,"categories":["Peptides","Recovery"],"description":"Thymosin Alpha 1 is a peptide naturally produced by the thymus gland. It is studied for its immune-modulating properties and role in T-cell maturation.","shortDescription":"Immune modulating peptide","purity":">98%","size":"10mg","form":"Lyophilized Powder"},
  {"name":"Wolverine Blend 20MG","price":75.00,"categories":["Peptides","Cosmetics","Longevity","Recovery"],"description":"Wolverine Blend is a multi-peptide formulation combining regenerative peptides for advanced tissue repair, recovery, and skin rejuvenation research.","shortDescription":"Multi-peptide recovery and regeneration blend","purity":">98%","size":"20mg","form":"Lyophilized Powder"},
  {"name":"Bacteriostatic Water 10mL","price":5.00,"categories":["Accessories","Bacteriostatic Water"],"description":"Sterile water containing 0.9% benzyl alcohol for reconstitution of lyophilized peptides. 10mL vial.","shortDescription":"Sterile water for reconstitution","size":"10mL","form":"Liquid"},
  {"name":"Bacteriostatic Water 30mL","price":10.00,"categories":["Accessories","Bacteriostatic Water"],"description":"Sterile water containing 0.9% benzyl alcohol for reconstitution. Larger 30mL vial for multiple reconstitutions.","shortDescription":"Sterile water for reconstitution - 30mL","size":"30mL","form":"Liquid"},
  {"name":"Hospira Bacteriostatic Water 30mL","price":30.00,"categories":["Accessories","Bacteriostatic Water"],"description":"Hospira brand pharmaceutical-grade bacteriostatic water. 30mL multi-dose vial with 0.9% benzyl alcohol preservative.","shortDescription":"Hospira brand bacteriostatic water","size":"30mL","form":"Liquid"},
  {"name":"Reconstitution Kit","price":10.00,"categories":["Accessories"],"description":"Complete kit for peptide reconstitution including syringes, alcohol swabs, and mixing vials.","shortDescription":"Complete kit for peptide reconstitution","form":"Kit"},
  {"name":"L-Carnitine 300mg/mL (30mL)","price":60.00,"categories":["Aminos"],"description":"Injectable L-Carnitine solution at 300mg/mL concentration. 30mL multi-dose vial for amino acid research.","shortDescription":"Injectable L-Carnitine solution","purity":">99%","size":"30mL","form":"Liquid"},
  {"name":"Vitamin B Complex","price":50.00,"categories":["Aminos","Longevity","Metabolism"],"description":"Injectable vitamin B complex containing essential B vitamins for metabolic and energy research.","shortDescription":"Injectable vitamin B complex","size":"30mL","form":"Liquid"},
  {"name":"Vitamin D 100,000 IU/mL","price":30.00,"categories":["Aminos"],"description":"High-dose injectable vitamin D at 100,000 IU/mL for research applications.","shortDescription":"High-dose injectable vitamin D","size":"1mL","form":"Liquid"},
  {"name":"CURENEX Daily Care Rejuvenating Cream","price":35.00,"categories":["Cosmetics"],"description":"Advanced daily rejuvenating cream formulated with peptide technology for skin research applications.","shortDescription":"Daily rejuvenating skin cream","form":"Cream"},
  {"name":"CURENEX Daily Care Skin Booster","price":36.00,"categories":["Cosmetics"],"description":"Skin booster treatment utilizing peptide-based technology for daily skin care research.","shortDescription":"Daily skin booster treatment","form":"Serum"},
  {"name":"Curenex Hydrating Cleanser","price":35.00,"categories":["Cosmetics"],"description":"Hydrating facial cleanser with peptide-infused formula for gentle yet effective cleansing.","shortDescription":"Hydrating facial cleanser","form":"Cleanser"},
  {"name":"Curenex Sheer Sunscreen 50 SPF","price":35.00,"categories":["Cosmetics"],"description":"SPF 50 sunscreen with sheer finish and peptide-enhanced formula for daily protection.","shortDescription":"SPF 50 sunscreen","form":"Cream"},
  {"name":"CINDELRIA","price":25.00,"categories":["Cosmetics","Peptides"],"description":"CINDELRIA is a cosmetic peptide formulation designed for skin brightening and rejuvenation research.","shortDescription":"Cosmetic peptide formulation","form":"Serum"},
  {"name":"DERMAGEN","price":5.00,"categories":["Cosmetics","Peptides"],"description":"DERMAGEN is a dermal regeneration peptide studied for its effects on skin cell renewal and tissue repair.","shortDescription":"Dermal regeneration peptide","form":"Serum"},
  {"name":"DR. LIPO+","price":50.00,"categories":["Cosmetics"],"description":"DR. LIPO+ is a lipolytic cosmetic treatment formulated for body contouring and fat reduction research.","shortDescription":"Lipolytic cosmetic treatment","form":"Solution"},
  {"name":"RM Repair Moisturizing Cream","price":23.00,"categories":["Cosmetics"],"description":"Repair moisturizing cream with advanced peptide technology for skin barrier restoration research.","shortDescription":"Repair moisturizing cream","form":"Cream"},
  {"name":"Urea Cream Skin Softener","price":15.00,"categories":["Cosmetics"],"description":"Urea-based skin softening cream for dermatological research applications.","shortDescription":"Urea-based skin softening cream","form":"Cream"}
];

async function seed() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Get existing categories
  const [existingCats] = await conn.execute("SELECT id, name FROM categories");
  const catMap = {};
  for (const c of existingCats) catMap[c.name] = c.id;

  // Collect all unique categories
  const allCats = new Set();
  for (const p of products) {
    for (const c of p.categories) allCats.add(c);
  }

  // Insert missing categories
  for (const catName of allCats) {
    if (!catMap[catName]) {
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const [result] = await conn.execute(
        "INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)",
        [catName, slug, `${catName} research products`]
      );
      catMap[catName] = result.insertId;
      console.log(`Created category: ${catName} (id: ${result.insertId})`);
    }
  }

  // Insert products
  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const sku = "RVR-" + slug.toUpperCase().replace(/-/g, "").slice(0, 12);

    try {
      const [result] = await conn.execute(
        `INSERT INTO products (name, slug, sku, price, description, shortDescription, purity, size, form, imageUrl, inStock, stockQuantity, isActive, isFeatured)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.name, slug, sku, p.price,
          p.description || "", p.shortDescription || "",
          p.purity || "", p.size || "", p.form || "",
          "", true, 100, true,
          p.categories.includes("Peptides") && p.price >= 35
        ]
      );
      const productId = result.insertId;

      // Link categories
      for (const catName of p.categories) {
        const catId = catMap[catName];
        if (catId) {
          await conn.execute(
            "INSERT IGNORE INTO productCategories (productId, categoryId) VALUES (?, ?)",
            [productId, catId]
          );
        }
      }

      console.log(`Created product: ${p.name} (id: ${productId})`);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        console.log(`Skipped (duplicate): ${p.name}`);
      } else {
        console.error(`Error creating ${p.name}:`, err.message);
      }
    }
  }

  // Add sample research data for key peptides
  const researchData = [
    { slug: "bpc-157-5mg", overview: "BPC-157 is a pentadecapeptide consisting of 15 amino acids. It is a partial sequence of body protection compound (BPC) that is discovered in and isolated from human gastric juice.", chemicalMakeup: "Sequence: Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val\nMolecular Formula: C62H98N16O22\nMolecular Weight: 1419.53 g/mol\nCAS Number: 137525-51-0", researchContent: "BPC-157 has demonstrated remarkable regenerative properties across multiple studies. Research has shown its ability to accelerate wound healing, protect organs, and promote angiogenesis. Studies in animal models have demonstrated its effectiveness in healing tendons, muscles, and the gastrointestinal tract." },
    { slug: "glp-1-semaglutide-5mg", overview: "Semaglutide is a glucagon-like peptide-1 (GLP-1) receptor agonist that mimics the effects of the naturally occurring hormone GLP-1.", chemicalMakeup: "Molecular Formula: C187H291N45O59\nMolecular Weight: 4113.58 g/mol\nCAS Number: 910463-68-2", researchContent: "Semaglutide has been extensively studied in clinical trials for its effects on glycemic control and body weight management. The STEP trials demonstrated significant weight reduction in participants. Research continues to explore its potential cardiovascular benefits and neuroprotective properties." },
    { slug: "epithalon-10mg", overview: "Epithalon (also known as Epitalon or Epithalone) is a synthetic tetrapeptide based on the natural peptide Epithalamin, which is produced by the pineal gland.", chemicalMakeup: "Sequence: Ala-Glu-Asp-Gly\nMolecular Formula: C14H22N4O9\nMolecular Weight: 390.35 g/mol\nCAS Number: 307297-39-8", researchContent: "Research by Professor Vladimir Khavinson demonstrated that Epithalon can activate telomerase, the enzyme responsible for replicating telomeres. Studies have shown potential anti-aging effects through telomere elongation and improved cellular function." },
    { slug: "selank-10mg", overview: "Selank is a synthetic analog of the immunomodulatory peptide tuftsin, developed at the Institute of Molecular Genetics of the Russian Academy of Sciences.", chemicalMakeup: "Sequence: Thr-Lys-Pro-Arg-Pro-Gly-Pro\nMolecular Formula: C33H57N11O9\nMolecular Weight: 751.87 g/mol\nCAS Number: 129954-34-3", researchContent: "Selank has been studied for its anxiolytic effects comparable to benzodiazepines but without sedative or addictive properties. Research has shown it can modulate the expression of BDNF and influence serotonin metabolism." },
    { slug: "semax-10mg", overview: "Semax is a synthetic peptide analog of adrenocorticotropic hormone (ACTH) fragment 4-10, developed at the Institute of Molecular Genetics of the Russian Academy of Sciences.", chemicalMakeup: "Sequence: Met-Glu-His-Phe-Pro-Gly-Pro\nMolecular Formula: C39H51N9O10S\nMolecular Weight: 813.93 g/mol\nCAS Number: 80714-61-0", researchContent: "Semax has been extensively studied for its nootropic and neuroprotective properties. Research demonstrates its ability to enhance BDNF expression, improve cognitive function, and provide neuroprotection against ischemic damage." },
  ];

  for (const rd of researchData) {
    const [prods] = await conn.execute("SELECT id FROM products WHERE slug = ?", [rd.slug]);
    if (prods.length > 0) {
      const pid = prods[0].id;
      await conn.execute(
        `INSERT INTO productResearch (productId, overview, chemicalMakeup, researchContent) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE overview = VALUES(overview), chemicalMakeup = VALUES(chemicalMakeup), researchContent = VALUES(researchContent)`,
        [pid, rd.overview, rd.chemicalMakeup, rd.researchContent]
      );
      console.log(`Added research for: ${rd.slug}`);
    }
  }

  // Add sample citations
  const citations = [
    { slug: "bpc-157-5mg", citations: [
      { num: 1, title: "Stable gastric pentadecapeptide BPC 157: Novel therapy in gastrointestinal tract", authors: "Sikiric P, et al.", journal: "Current Pharmaceutical Design", year: "2018", url: "https://pubmed.ncbi.nlm.nih.gov/29569994/" },
      { num: 2, title: "BPC 157 and its effects on wound healing", authors: "Seiwerth S, et al.", journal: "Medical Science Monitor Basic Research", year: "2014", url: "https://pubmed.ncbi.nlm.nih.gov/25370353/" },
    ]},
    { slug: "glp-1-semaglutide-5mg", citations: [
      { num: 1, title: "Once-Weekly Semaglutide in Adults with Overweight or Obesity (STEP 1)", authors: "Wilding JPH, et al.", journal: "New England Journal of Medicine", year: "2021", url: "https://pubmed.ncbi.nlm.nih.gov/33567185/" },
      { num: 2, title: "Semaglutide and Cardiovascular Outcomes in Patients with Type 2 Diabetes", authors: "Marso SP, et al.", journal: "New England Journal of Medicine", year: "2016", url: "https://pubmed.ncbi.nlm.nih.gov/27633186/" },
    ]},
    { slug: "epithalon-10mg", citations: [
      { num: 1, title: "Peptide Regulation of Gene Expression and Protein Synthesis in Bronchial Epithelium", authors: "Khavinson VK, et al.", journal: "Lung", year: "2014", url: "https://pubmed.ncbi.nlm.nih.gov/24952604/" },
    ]},
  ];

  for (const cd of citations) {
    const [prods] = await conn.execute("SELECT id FROM products WHERE slug = ?", [cd.slug]);
    if (prods.length > 0) {
      const pid = prods[0].id;
      for (const cit of cd.citations) {
        await conn.execute(
          `INSERT INTO researchCitations (productId, citationNumber, title, authors, journal, year, url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [pid, cit.num, cit.title, cit.authors, cit.journal, cit.year, cit.url]
        );
      }
      console.log(`Added citations for: ${cd.slug}`);
    }
  }

  await conn.end();
  console.log("\nSeeding complete!");
}

seed().catch(console.error);
