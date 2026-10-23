// Netlify build: pours content/*.json (edited from /admin) into the page and copies assets to dist/.
import fs from 'node:fs';
const read = n => JSON.parse(fs.readFileSync(`content/${n}.json`, 'utf8'))[n] || [];
const cats = read('cats').filter(c => c && c.label).map(c => ({ id: c.label, label: c.label }));
const works = read('works').map(w => ({ ...w, id: w.title + '|' + (w.img || w.video || ''), year: String(w.year ?? '') }));
const reels = read('reels').filter(r => r.src).map(r => ({ ...r, id: r.src }));
const quotes = read('quotes').filter(q => q.name && q.text).map(q => ({ ...q, stars: Number(q.stars) || 0 }));
const data = JSON.stringify({ cats, works, reels, quotes }).replace(/</g, '\\u003c');
const html = fs.readFileSync('src/index.html', 'utf8').replace('__SITE_DATA__', () => data);
fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.writeFileSync('dist/index.html', html);
for (const d of ['media', 'fonts', 'admin']) if (fs.existsSync(d)) fs.cpSync(d, `dist/${d}`, { recursive: true });
console.log(`built: ${works.length} works, ${reels.length} videos, ${quotes.length} reviews`);
