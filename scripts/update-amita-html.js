const fs = require('fs');

const dirs = [
  'G:/IMPORTANT SITE + L PAGE/websites/tribal-treasure',
  'G:/IMPORTANT SITE + L PAGE/SHIMLA -- GHEE + WALNUT'
];

dirs.forEach(dir => {
  // 1. Update index.html
  const indexPath = dir + '/index.html';
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');

    // In himalayan-mosaic, replace hero-orchard.webp with amita-tribal-girl.webp
    indexHtml = indexHtml.replace(
      `<div class="h-mosaic-item" onclick="location.href='about.html'" style="cursor:pointer;">
              <img src="./images/hero-orchard.webp" alt="High Altitude Apple Orchards in Kinnaur" loading="lazy" />
              <div class="h-mosaic-caption">
                <span class="h-badge-dot"></span>
                <span>Kinnaur Valley Orchards</span>
              </div>
            </div>`,
      `<div class="h-mosaic-item" onclick="location.href='about.html'" style="cursor:pointer;">
              <img src="./images/amita-tribal-girl.webp" alt="Amita Chhorgia Negi - The Tribal Girl in Kinnaur Orchards" loading="lazy" />
              <div class="h-mosaic-caption">
                <span class="h-badge-dot"></span>
                <span>Amita in Kinnaur Orchards</span>
              </div>
            </div>`
    );

    // Also update Category Story item 1 to feature Amita
    indexHtml = indexHtml.replace(
      `<div class="category-story-item active" onclick="location.href='shop.html'">
          <div class="category-story-ring">
            <div class="category-story-img-wrap">
              <img src="./images/apples-harvest.webp" alt="All Harvest" />
            </div>
          </div>
          <span class="category-story-label">All Harvest</span>
        </div>`,
      `<div class="category-story-item active" onclick="location.href='about.html'">
          <div class="category-story-ring">
            <div class="category-story-img-wrap">
              <img src="./images/amita-square.webp" alt="Amita - The Tribal Girl" />
            </div>
          </div>
          <span class="category-story-label">Meet Amita</span>
        </div>`
    );

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('[INDEX UPDATED] ' + indexPath);
  }

  // 2. Update about.html
  const aboutPath = dir + '/about.html';
  if (fs.existsSync(aboutPath)) {
    let aboutHtml = fs.readFileSync(aboutPath, 'utf8');

    // Replace hero-orchard.webp in about.html body with amita-tribal-girl.webp
    aboutHtml = aboutHtml.replace(
      `<img src="./images/hero-orchard.webp" alt="Kinnauri Tribal Orchards" style="width: 100%; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" />
      <span style="display: block; text-align: center; font-size: 0.8rem; color: var(--color-text-muted); margin-top: 8px;">High-altitude tribal orchard belt in Kinnaur, Himachal Pradesh</span>`,
      `<img src="./images/amita-tribal-girl.webp" alt="Amita Chhorgia Negi - The Tribal Girl in Kinnaur Orchards" style="width: 100%; max-height: 540px; object-fit: cover; border-radius: var(--radius-md); box-shadow: var(--shadow-md);" />
      <span style="display: block; text-align: center; font-size: 0.85rem; color: var(--color-primary-dark); font-weight: 700; margin-top: 10px;">Amita Chhorgia Negi (&quot;The Tribal Girl&quot;) harvesting apples at 10,000 ft in Kinnaur</span>`
    );

    fs.writeFileSync(aboutPath, aboutHtml, 'utf8');
    console.log('[ABOUT UPDATED] ' + aboutPath);
  }
});

console.log('Finished updating HTML files.');
