const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// CloudLinux's Node.js Selector installs dependencies under nodevenv and runs
// lifecycle hooks from that directory. INIT_CWD retains the directory where
// the user started npm, which is the actual application root.
const projectRoot = path.resolve(process.env.INIT_CWD || path.join(__dirname, '..'));
const entryFile = path.join(projectRoot, 'index.html');
const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');

if (!fs.existsSync(entryFile)) {
  console.error(`Cannot build SignFix: index.html was not found in ${projectRoot}`);
  process.exit(1);
}

if (!fs.existsSync(viteCli)) {
  console.error(`Cannot build SignFix: Vite was not found at ${viteCli}`);
  process.exit(1);
}

const result = spawnSync(process.execPath, [viteCli, 'build'], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);
