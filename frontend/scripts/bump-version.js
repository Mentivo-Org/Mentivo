#!/usr/bin/env node
/**
 * Bumps the app version (versionName) and build number (versionCode) across:
 *   - package.json                  -> version
 *   - app.json                      -> expo.version, expo.android.versionCode
 *   - android/app/build.gradle      -> versionName, versionCode
 *
 * Files are edited by targeted regex replacement so formatting stays untouched.
 *
 * Usage:
 *   node scripts/bump-version.js patch|minor|major [buildNumber]
 *   node scripts/bump-version.js 1.2.3 [buildNumber]
 *   node scripts/bump-version.js build            (build number only)
 *
 * The build number is incremented by 1 unless given explicitly.
 */

const fs = require('fs');
const path = require('path');

const FRONTEND = path.resolve(__dirname, '..');

const FILES = {
  packageJson: path.join(FRONTEND, 'package.json'),
  appJson: path.join(FRONTEND, 'app.json'),
  buildGradle: path.join(FRONTEND, 'android', 'app', 'build.gradle'),
};

// `kind` decides which new value gets written. app.json is the source of truth
// for the current values; the other files are reported if they disagree.
const TARGETS = [
  { file: 'appJson', kind: 'version', label: 'app.json      version', re: /("version"\s*:\s*")([^"]+)(")/ },
  { file: 'appJson', kind: 'code', label: 'app.json      versionCode', re: /("versionCode"\s*:\s*)(\d+)()/ },
  { file: 'packageJson', kind: 'version', label: 'package.json  version', re: /("version"\s*:\s*")([^"]+)(")/ },
  { file: 'buildGradle', kind: 'version', label: 'build.gradle  versionName', re: /^(\s*versionName\s+")([^"]+)(")/m },
  { file: 'buildGradle', kind: 'code', label: 'build.gradle  versionCode', re: /^(\s*versionCode\s+)(\d+)()/m },
];

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function usage() {
  console.log([
    'Usage:',
    '  node scripts/bump-version.js patch|minor|major [buildNumber]',
    '  node scripts/bump-version.js <x.y.z> [buildNumber]',
    '  node scripts/bump-version.js build',
    '',
    'The build number is incremented by 1 unless given explicitly.',
  ].join('\n'));
}

function nextVersion(current, target) {
  if (target === 'build') return current;
  if (/^\d+\.\d+\.\d+$/.test(target)) return target;

  const parsed = current.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!parsed) fail(`current version "${current}" is not x.y.z - pass an explicit version instead`);
  let [major, minor, patch] = parsed.slice(1).map(Number);

  if (target === 'major') return `${major + 1}.0.0`;
  if (target === 'minor') return `${major}.${minor + 1}.0`;
  if (target === 'patch') return `${major}.${minor}.${patch + 1}`;

  usage();
  return fail(`unknown target "${target}"`);
}

function main() {
  const [target, buildArg] = process.argv.slice(2);
  if (!target || target === '--help' || target === '-h') {
    usage();
    process.exit(target ? 0 : 1);
  }

  const contents = {};
  for (const [key, file] of Object.entries(FILES)) {
    if (!fs.existsSync(file)) fail(`missing file: ${file}`);
    contents[key] = fs.readFileSync(file, 'utf8');
  }

  const found = TARGETS.map((t) => {
    const match = contents[t.file].match(t.re);
    if (!match) fail(`could not find ${t.label} in ${path.relative(FRONTEND, FILES[t.file])}`);
    return { ...t, current: match[2] };
  });

  const currentVersion = found.find((f) => f.file === 'appJson' && f.kind === 'version').current;
  const currentCode = Number(found.find((f) => f.file === 'appJson' && f.kind === 'code').current);

  for (const f of found) {
    const expected = f.kind === 'version' ? currentVersion : String(currentCode);
    if (f.current !== expected) {
      console.warn(`warning: ${f.label} was ${f.current}, expected ${expected} (will be aligned)`);
    }
  }

  const newVersion = nextVersion(currentVersion, target);

  let newCode;
  if (buildArg === undefined) {
    newCode = currentCode + 1;
  } else if (/^\d+$/.test(buildArg)) {
    newCode = Number(buildArg);
  } else {
    fail(`build number must be a positive integer, got "${buildArg}"`);
  }
  if (newCode <= currentCode) {
    console.warn(`warning: build number ${newCode} is not greater than ${currentCode} - Play Store will reject it`);
  }

  for (const f of found) {
    const value = f.kind === 'version' ? newVersion : String(newCode);
    contents[f.file] = contents[f.file].replace(f.re, (_, prefix, __, suffix) => prefix + value + suffix);
    console.log(`${f.label.padEnd(26)} ${f.current} -> ${value}`);
  }

  for (const [key, file] of Object.entries(FILES)) {
    fs.writeFileSync(file, contents[key]);
  }

  console.log(`\nversion ${newVersion} (build ${newCode})`);
}

main();
