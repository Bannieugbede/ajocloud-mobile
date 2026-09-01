const { execFileSync } = require('node:child_process');
const { readdirSync, readFileSync, statSync } = require('node:fs');
const { join, relative, sep } = require('node:path');

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

const skippedDirectories = new Set([
  'node_modules',
  '.git',
  'web-design',
  'dist',
  'ios',
  'android',
  '.expo',
]);
const excludedFiles = new Set(
  excluded.filter((path) => !path.endsWith('/**')).map((path) => path.split('/').join(sep)),
);
const scannedExtensions = /\.(ts|tsx|js|jsx|cjs|mjs|json|md)$/;

/**
 * Scans with ripgrep when it is installed and falls back to an equivalent Node
 * walk otherwise. The fallback exists because a missing binary previously made
 * this gate throw rather than report, which reads as a terminology failure on a
 * machine that simply lacks ripgrep.
 */
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
    return execFileSync('rg', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (error) {
    if (error.status === 1) return '';
    if (error.code === 'ENOENT') return scanWithNode(root);
    throw error;
  }
}

function scanWithNode(root) {
  const needle = forbidden.toLowerCase();
  const findings = [];

  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const absolute = join(directory, entry);
      const relativePath = relative(root, absolute);
      if (statSync(absolute).isDirectory()) {
        if (!skippedDirectories.has(entry)) walk(absolute);
        continue;
      }
      if (excludedFiles.has(relativePath) || !scannedExtensions.test(entry)) continue;
      readFileSync(absolute, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          if (line.toLowerCase().includes(needle)) {
            findings.push(`./${relativePath}:${index + 1}:${line.trim()}`);
          }
        });
    }
  };

  walk(root);
  return findings.join('\n').trim();
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
