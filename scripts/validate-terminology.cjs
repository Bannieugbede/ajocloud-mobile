const { execFileSync } = require('node:child_process');

const forbidden = ['aka', 'wa'].join('');
const excluded = [
  'web-design/**',
  'AGENTS.md',
  'docs/DESIGN_REFERENCE.md',
  'docs/ROADMAP.md',
  'docs/SCREEN_INVENTORY.md',
  'scripts/validate-terminology.cjs',
  '__tests__/terminology.test.ts',
];

function findViolations(root = process.cwd()) {
  const args = [
    '--line-number',
    '--ignore-case',
    '--glob',
    '!node_modules/**',
    '--glob',
    '!.git/**',
    ...excluded.flatMap((path) => ['--glob', `!${path}`]),
    forbidden,
    '.',
  ];
  try {
    return execFileSync('rg', args, { cwd: root, encoding: 'utf8' }).trim();
  } catch (error) {
    if (error.status === 1) return '';
    throw error;
  }
}

if (require.main === module) {
  const violations = findViolations();
  if (violations) {
    console.error(`Forbidden terminology found:\n${violations}`);
    process.exit(1);
  }
  console.log('Terminology validation passed.');
}

module.exports = { findViolations };
