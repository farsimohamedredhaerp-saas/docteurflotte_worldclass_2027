const fs = require('fs');
const readline = require('readline');

async function extractStep3523() {
  const fileStream = fs.createReadStream('C:/Users/MAGICSOFTDZ/.gemini/antigravity/brain/f377090f-2930-4f4b-9ad9-d797ba75b022/.system_generated/logs/transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
  for await (const line of rl) {
    if (line.includes('"step_index":3523') || line.includes('"step_index": 3523')) {
      const data = JSON.parse(line);
      fs.writeFileSync('scratch/argon_reference_code.txt', data.content);
      console.log('Saved to scratch/argon_reference_code.txt, length:', data.content.length);
      break;
    }
  }
}
extractStep3523();

