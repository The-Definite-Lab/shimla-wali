const fs = require('fs');
const path = require('path');

const exts = ['.html', '.js', '.css', '.json'];
const skipDirs = ['.git', 'node_modules', '.gemini', 'uploads', 'scratch', 'backups'];

const results = [];

function searchDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (skipDirs.includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      searchDir(full);
    } else if (exts.includes(path.extname(ent.name).toLowerCase())) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude firebase project ID "shimlawali-store" if it's the backend firebase config/rc, but let's check
        if (/shimla[\s_-]?wali|@shimlawali|shimlawali\.in|shimlawali/i.test(line)) {
          results.push({
            file: full,
            lineNum: idx + 1,
            lineText: line.trim()
          });
        }
      });
    }
  }
}

searchDir('.');

console.log(`Found ${results.length} occurrences:`);
results.forEach(r => {
  console.log(`${r.file}:${r.lineNum} -> ${r.lineText}`);
});
