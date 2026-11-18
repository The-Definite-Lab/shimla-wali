const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern, results = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'db' || file === 'scratch') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchDir(fullPath, pattern, results);
    } else if (/\.(html|js|css|json|md)$/i.test(file)) {
      if (file.includes('prepare-shimla-crunch') || file.includes('check_') || file.includes('find-all-wali') || file.includes('verify-zero-wali')) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        // Exclude GCP project ID infrastructure references
        if (line.includes('shimlawali-store.firebaseapp.com') ||
            line.includes('shimlawali-store.firebasestorage.app') ||
            line.includes("projectId: 'shimlawali-store'") ||
            line.includes('"site": "shimlawali-store"')) {
          return;
        }
        if (pattern.test(line)) {
          // If it's a defensive check like /shimla[\s_-]*wali/i.test, that's code defending against it
          if (line.includes('/shimla[') || line.includes('/shimla_wali/')) return;
          results.push({ file: fullPath.replace(/\\/g, '/'), lineNum: idx + 1, text: line.trim() });
        }
      });
    }
  }
  return results;
}

const matches = searchDir('.', /shimla[_\s-]*wali|@shimlawali|@shimla_wali/i);
console.log('User-facing / active file matches found:', matches.length);
matches.forEach(m => console.log(m.file + ':' + m.lineNum + ' -> ' + m.text.substring(0, 120)));
