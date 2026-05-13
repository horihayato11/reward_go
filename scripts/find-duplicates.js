const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const ignore = ['node_modules', '.git', '.vscode', 'dist', 'build'];

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (ignore.includes(file)) continue;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else if (stat.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function sha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

(function main() {
  const files = walk(root);
  const byBasename = {};
  const byHash = {};

  for (const f of files) {
    const name = path.basename(f);
    byBasename[name] = byBasename[name] || [];
    byBasename[name].push(f.replace(root + path.sep, ''));
  }

  for (const f of files) {
    try {
      const h = sha256(f);
      byHash[h] = byHash[h] || [];
      byHash[h].push(f.replace(root + path.sep, ''));
    } catch (e) {
      // ignore read errors
    }
  }

  const basenameDuplicates = Object.entries(byBasename)
    .filter(([, arr]) => arr.length > 1)
    .map(([name, arr]) => ({ name, paths: arr }));

  const contentDuplicates = Object.values(byHash)
    .filter(arr => arr.length > 1)
    .map(arr => ({ paths: arr }));

  const report = { totalFiles: files.length, basenameDuplicates, contentDuplicates };
  const outPath = path.join(root, 'scripts', 'duplicates-report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log('WROTE', outPath);
  console.log(JSON.stringify(report, null, 2));
})();
