const sharp = require('sharp');
const fs = require('fs');

const srcPath = 'C:/Users/user/.gemini/antigravity/brain/a919e7ce-9649-4b7a-9237-c77513b72300/amita_kinnaur_orchard_portrait_1794933772857.jpg';

const dirs = [
  'G:/IMPORTANT SITE + L PAGE/websites/tribal-treasure/images',
  'G:/IMPORTANT SITE + L PAGE/SHIMLA -- GHEE + WALNUT/images'
];

async function run() {
  const buf = fs.readFileSync(srcPath);

  // 1. Portrait WebP (800x1067)
  const portraitWebp = await sharp(buf)
    .resize(800, 1067, { fit: 'cover', position: 'top' })
    .webp({ quality: 92 })
    .toBuffer();

  // 2. Square WebP (800x800)
  const squareWebp = await sharp(buf)
    .resize(800, 800, { fit: 'cover', position: 'top' })
    .webp({ quality: 92 })
    .toBuffer();

  // 3. Square JPEG (800x800)
  const squareJpg = await sharp(buf)
    .resize(800, 800, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 90 })
    .toBuffer();

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(dir + '/amita-tribal-girl.webp', portraitWebp);
    fs.writeFileSync(dir + '/amita-square.webp', squareWebp);
    fs.writeFileSync(dir + '/founders.webp', squareWebp);
    fs.writeFileSync(dir + '/founders.jpg', squareJpg);
    console.log('[SAVED AMITA ASSETS TO] ' + dir);
  }

  console.log('Successfully saved Amita assets in all target directories.');
}

run().catch(console.error);
