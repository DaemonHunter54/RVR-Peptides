function extractDosage(name) {
  const multiMatch = name.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml)(?:\s*\/\s*\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml))+/i);
  if (multiMatch) {
    const allDosages = multiMatch[0].match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml)/gi);
    if (allDosages && allDosages.length > 1) {
      return allDosages.map(d => {
        const m = d.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml)/i);
        return m ? `${m[1]}${m[2].toUpperCase()}` : d;
      }).join('/');
    }
  }
  const match = name.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml|mL)(?:\s*\/\s*mL)?/i);
  if (match) {
    const perMl = match[0].match(/\/\s*mL/i) ? '/ML' : '';
    return `${match[1]}${match[2].toUpperCase()}${perMl}`;
  }
  return '';
}

function extractPeptideName(name) {
  return name
    .replace(/\s*\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml)(?:\s*\/\s*\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml))*(?:\s*\/\s*(?:mL|ml))?\s*(?:\(\d+(?:mL|ml)?\))?\s*/gi, ' ')
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/\s*\/\s*$/g, '')
    .replace(/^\s*\/\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const tests = [
  'BPC-157 5mg',
  '5-Amino-1MQ 50MG',
  'GHK-Cu 50mg',
  'Semaglutide 5mg',
  'BPC-157 Capsules 500MCG (30)',
  'TB-500 / BPC-157 5mg/5mg'
];

for (const t of tests) {
  console.log(`"${t}" => name: "${extractPeptideName(t)}", dosage: "${extractDosage(t)}"`);
}
