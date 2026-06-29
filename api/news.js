// api/news.js — RealAndPaws live "Dog News" feed (Vercel serverless function).
//
// Zero dependencies. Fetches dog-related headlines SERVER-SIDE (so there is no
// browser CORS problem and no API key exposed in the page) and returns a
// tone-filtered JSON list. The page (news.html) calls /api/news and gracefully
// falls back to its built-in curated articles if this is unavailable or returns
// too few wholesome items.
//
// By default it uses the free, keyless Google News RSS feed (headline + source
// + date). If you set a GNEWS_KEY environment variable in Vercel, it uses the
// GNews API instead, which also returns real article summaries.

// An item must contain a clearly positive signal (ALLOW) and must NOT contain
// anything distressing (BLOCK) or off-topic/food (FOOD). An allow-list keeps a
// friendly dog site from auto-surfacing tragedy headlines on a bad news day.
const ALLOW = /\b(adopt|adopted|adoption|rescued|therapy|emotional support|service dog|hero|reunit|heartwarming|adorable|cute|foster|pets of the week|award|celebrat|festival|parade|comfort dog|good boy|good girl|puppies|welcome|surprise|joy|helps|helped|saved|trained|training|park|beach|swim|playful|loyal|cuddl|wholesome|feel-good|best friend|graduat|birthday)\b/i;
const BLOCK = /\b(dead|die|dies|died|death|kill|shot|shoot|euthan|abuse|cruel|neglect|attack|maul|bite|bitten|seiz|hoard|charged|arrest|lawsuit|danger|rabies|poison|stolen|missing|police|sweltering|abandon|starve|wound|injur|suffer|court|guilty|theft|snatch|bait|fight|warn|fear|tragic|horrif|grave|remains|decompos|carcass|buried|bodies|squalid|raid|investigat|cruelty|emaciat|sick|illness|disease)\b/i;
const FOOD = /\b(hot ?dog|corn ?dog|recipe|grill|cook|sausage|menu|restaurant|diner|underdog|top dog)\b/i;

module.exports = async (req, res) => {
  try {
    const items = process.env.GNEWS_KEY
      ? await fromGNews(process.env.GNEWS_KEY)
      : await fromGoogleNews();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    // Cache at Vercel's edge for 30 min; serve stale up to a day while revalidating.
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.status(200).json({ status: 'ok', provider: process.env.GNEWS_KEY ? 'gnews' : 'google', items });
  } catch (err) {
    // Always 200 with an empty list so the page falls back cleanly to its curated articles.
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({ status: 'error', message: String((err && err.message) || err), items: [] });
  }
};

function wholesome(title) {
  return !!title && ALLOW.test(title) && !BLOCK.test(title) && !FOOD.test(title);
}

function fmtDate(value) {
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

async function fromGoogleNews() {
  const q = encodeURIComponent('dog OR puppy OR dogs');
  const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (RealAndPaws news bot)' } });
  if (!r.ok) throw new Error('Google News HTTP ' + r.status);
  const xml = await r.text();
  const out = [];
  const seen = new Set();
  for (const block of xml.split('<item>').slice(1)) {
    const item = block.split('</item>')[0];
    let title = clean(tag(item, 'title'));
    let source = clean(tag(item, 'source'));
    const link = clean(tag(item, 'link'));
    const date = fmtDate(clean(tag(item, 'pubDate')));
    // Google News titles look like "Headline - Publisher" — split off the publisher.
    const i = title.lastIndexOf(' - ');
    if (i > 0) { if (!source) source = title.slice(i + 3); title = title.slice(0, i); }
    if (!wholesome(title)) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title, source, date, link, summary: '' });
    if (out.length >= 6) break;
  }
  return out;
}

async function fromGNews(key) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent('dog OR puppy')}&lang=en&country=us&max=10&token=${key}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('GNews HTTP ' + r.status);
  const data = await r.json();
  const out = [];
  const seen = new Set();
  for (const a of (data.articles || [])) {
    const title = (a.title || '').trim();
    if (!wholesome(title)) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      title,
      source: (a.source && a.source.name) || '',
      date: fmtDate(a.publishedAt),
      link: a.url || '',
      summary: (a.description || '').trim(),
    });
    if (out.length >= 6) break;
  }
  return out;
}

function tag(s, name) {
  const m = s.match(new RegExp('<' + name + '[^>]*>([\\s\\S]*?)</' + name + '>'));
  return m ? m[1] : '';
}

function clean(s) {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
