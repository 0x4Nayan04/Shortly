import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const stylesDir = path.join(frontendRoot, 'src/styles');
const domainsDir = path.join(stylesDir, 'domains');
const outFile = path.join(stylesDir, '.assembled-check.css');

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

/** Required CSS custom properties in the repository's token source of truth. */
const DESIGN_VARIABLE_CHECKS = [
  '--color-primary',
  '--color-accent',
  '--color-ink',
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
  const tokensCss = await readFile(path.join(domainsDir, 'tokens.css'), 'utf8');
  const variables = parseCssVariables(tokensCss);
  const missing = DESIGN_VARIABLE_CHECKS.filter((name) => !variables.has(name));

  if (missing.length > 0) {
    throw new Error(
      `Design token check failed:\n${missing.map((name) => `  - ${name} is missing from domains/tokens.css`).join('\n')}`
    );
  }

  console.log(
    `Design token check OK (${DESIGN_VARIABLE_CHECKS.length} variables checked)`
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
