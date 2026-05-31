import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const stylesDir = path.join(frontendRoot, 'src/styles');
const domainsDir = path.join(stylesDir, 'domains');
const outFile = path.join(stylesDir, '.assembled-check.css');
const designVariablesFile = path.resolve(
  frontendRoot,
  '../Design/supermemory-ai-variables.css'
);

const DOMAIN_FILES = [
  'tokens.css',
  'layout.css',
  'auth.css',
  'dashboard.css',
  'nav.css',
  'landing.css',
  'components.css',
  'mobile.css'
];

/** CSS custom properties that must stay in sync between Design/ and tokens.css */
const DESIGN_VARIABLE_CHECKS = [
  '--color-primary',
  '--color-accent',
  '--color-text-1',
  '--color-border'
];

function parseCssVariables(css) {
  const variables = new Map();
  const pattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = pattern.exec(css)) !== null) {
    variables.set(match[1], match[2].trim());
  }
  return variables;
}

async function verifyDesignTokenSync() {
  const [designVariablesRaw, tokensCss] = await Promise.all([
    readFile(designVariablesFile, 'utf8'),
    readFile(path.join(domainsDir, 'tokens.css'), 'utf8')
  ]);

  const designVariables = parseCssVariables(designVariablesRaw);
  const missing = [];

  for (const name of DESIGN_VARIABLE_CHECKS) {
    const designValue = designVariables.get(name);
    if (!designValue) {
      missing.push(`${name}: missing in Design/supermemory-ai-variables.css`);
      continue;
    }

    const normalized = designValue.toLowerCase();
    if (!tokensCss.toLowerCase().includes(normalized)) {
      missing.push(`${name} (${designValue}) not found in domains/tokens.css`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Design token sync failed:\n${missing.map((line) => `  - ${line}`).join('\n')}`
    );
  }

  console.log(
    `Design token sync OK (${DESIGN_VARIABLE_CHECKS.length} variables checked)`
  );
}

const assembled = (
  await Promise.all(
    DOMAIN_FILES.map(async (name) => {
      const filePath = path.join(domainsDir, name);
      const content = await readFile(filePath, 'utf8');
      if (!content.trim()) {
        throw new Error(`Domain CSS file is empty: ${name}`);
      }
      return `/* --- ${name} --- */\n${content.trim()}\n`;
    })
  )
).join('\n');

await mkdir(path.dirname(outFile), { recursive: true });
await writeFile(outFile, `${assembled}\n`, 'utf8');

console.log(`Assembled ${DOMAIN_FILES.length} domain files → ${outFile}`);
console.log(`Total lines: ${assembled.split('\n').length}`);

await verifyDesignTokenSync();
