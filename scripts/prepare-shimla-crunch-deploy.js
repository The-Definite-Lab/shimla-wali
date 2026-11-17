// scripts/prepare-shimla-crunch-deploy.js
const fs = require('fs');
const path = require('path');

const srcDir = path.resolve('G:/IMPORTANT SITE + L PAGE/websites/shimla-crunch');
const destDir = path.resolve('G:/IMPORTANT SITE + L PAGE/SHIMLA -- GHEE + WALNUT');

console.log('🔄 Preparing 100% Pure Shimla Crunch Storefront for Firebase Deployment...');
console.log(`Source: ${srcDir}`);
console.log(`Destination: ${destDir}`);

// 1. Files / directories to copy
const filesToCopy = [
  'index.html',
  'product.html',
  'product-apple-crunch.html',
  'product-apples.html',
  'product-gala-apples.html',
  'product-royal-apples.html',
  'product-walnuts.html',
  'product-honey.html',
  'about.html',
  'contact.html',
  'shop.html',
  'profile.html',
  'admin.html',
  'admin.js',
  'admin.css',
  'admin-copilot.js',
  'app.js',
  'styles.css',
  'checkout.html',
  'verify.html',
  'policies.html',
  'terms.html',
  'privacy.html',
  'refund.html',
  'cost-breakdown-infographic.html',
  'floating-widget.js',
  'three.min.js',
  'products.json',
  'firebase-bridge.js',
  'firebase-config.js',
  'CLIENT_STOREFRONT_MANAGEMENT_GUIDE.md',
  'server.js'
];

// Directories to copy recursively
const dirsToCopy = [
  'db',
  'images',
  'server',
  'shared',
  'tests'
];

function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy top files
for (const file of filesToCopy) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  ✓ Copied: ${file}`);
  } else {
    console.warn(`  ⚠️ Missing in src: ${file}`);
  }
}

// Copy directories
for (const dir of dirsToCopy) {
  const src = path.join(srcDir, dir);
  const dest = path.join(destDir, dir);
  copyFolderSync(src, dest);
  console.log(`  ✓ Synced directory: ${dir}`);
}

// 2. Remove obsolete legacy files that should not exist
const obsoleteFiles = [
  'product-ghee.html',
  'product-pickle.html',
  'product-rajma.html',
  'product-red-rice.html'
];

for (const oldFile of obsoleteFiles) {
  const p1 = path.join(destDir, oldFile);
  if (fs.existsSync(p1)) {
    fs.unlinkSync(p1);
    console.log(`  🗑️ Removed legacy file: ${oldFile}`);
  }
}

// 3. Deep Brand Cleansing Pass across all web files
console.log('\n🧹 Performing Deep Brand Scrubbing (Zero Shimla Crunch Residue)...');

const extensionsToScrub = ['.html', '.js', '.json', '.css', '.md'];

function scrubFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Exact replacements
  content = content.replace(/Shimla Crunch/g, 'Shimla Crunch');
  content = content.replace(/SHIMLA CRUNCH/g, 'SHIMLA CRUNCH');
  content = content.replace(/shimla-crunch/g, 'shimla-crunch');
  content = content.replace(/shimlawali\.in/g, 'shimlacrunch.com');
  content = content.replace(/admin@shimlawali\.in/g, 'admin@shimlacrunch.com');
  content = content.replace(/care@shimlawali\.in/g, 'care@shimlacrunch.com');
  content = content.replace(/support@shimlawali\.com/g, 'support@shimlacrunch.com');
  content = content.replace(/tech@shimlawali\.com/g, 'tech@shimlacrunch.com');
  content = content.replace(/shimlawali-store\.web\.app/g, 'shimlacrunch-store.web.app');
  content = content.replace(/shimlawali-([a-z0-9_-]+)\.csv/g, 'shimlacrunch-$1.csv');

  // Fix old whatsapp number if present
  content = content.replace(/918580861606/g, '918580861606');
  content = content.replace(/918580861606/g, '918580861606');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✨ Scrubbed: ${path.relative(destDir, filePath)}`);
  }
}

function walkAndScrub(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.firebase') continue;
      walkAndScrub(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensionsToScrub.includes(ext)) {
        scrubFile(fullPath);
      }
    }
  }
}

walkAndScrub(destDir);

// 4. Update firebase.json with dual-site hosting
const firebaseJsonPath = path.join(destDir, 'firebase.json');
const firebaseConfig = {
  "hosting": [
    {
      "site": "shimlacrunch-store",
      "public": ".",
      "ignore": [
        "firebase.json",
        ".firebaserc",
        "firestore.rules",
        "firestore.indexes.json",
        "**/.*",
        "**/node_modules/**",
        "db/**",
        "server/**",
        "scripts/**",
        "tests/**",
        "scratch/**",
        "uploads/**",
        "server.js",
        "package.json",
        "package-lock.json",
        "*.zip",
        "*.exe",
        "*.ps1",
        "*.log",
        "*.secret",
        "AUDIT_*.md",
        ".env*",
        ".session*",
        "cloudflared*"
      ],
      "headers": [
        {
          "source": "**/*.@(html|json|js|css)",
          "headers": [
            { "key": "Cache-Control", "value": "no-cache, max-age=0, must-revalidate" }
          ]
        },
        {
          "source": "images/**",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=604800" }
          ]
        }
      ]
    },
    {
      "site": "shimlawali-store",
      "public": ".",
      "ignore": [
        "firebase.json",
        ".firebaserc",
        "firestore.rules",
        "firestore.indexes.json",
        "**/.*",
        "**/node_modules/**",
        "db/**",
        "server/**",
        "scripts/**",
        "tests/**",
        "scratch/**",
        "uploads/**",
        "server.js",
        "package.json",
        "package-lock.json",
        "*.zip",
        "*.exe",
        "*.ps1",
        "*.log",
        "*.secret",
        "AUDIT_*.md",
        ".env*",
        ".session*",
        "cloudflared*"
      ],
      "headers": [
        {
          "source": "**/*.@(html|json|js|css)",
          "headers": [
            { "key": "Cache-Control", "value": "no-cache, max-age=0, must-revalidate" }
          ]
        },
        {
          "source": "images/**",
          "headers": [
            { "key": "Cache-Control", "value": "public, max-age=604800" }
          ]
        }
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
};

fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2), 'utf8');
console.log('\n✅ Updated firebase.json with dual-site configuration:');
console.log('   - https://shimlacrunch-store.web.app (Primary Clean Brand Domain)');
console.log('   - https://organic.thedefinite.one via shimlawali-store (Custom Domain)');

// 5. Update firestore.rules
const firestoreRulesPath = path.join(destDir, 'firestore.rules');
if (fs.existsSync(firestoreRulesPath)) {
  let fr = fs.readFileSync(firestoreRulesPath, 'utf8');
  fr = fr.replace(/admin@shimlawali\.in/g, 'admin@shimlacrunch.com');
  fs.writeFileSync(firestoreRulesPath, fr, 'utf8');
  console.log('✅ Updated firestore.rules admin whitelist');
}

console.log('\n🎉 Shimla Crunch deployment preparation complete!');
