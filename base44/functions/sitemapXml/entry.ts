import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SITE_URL = 'https://yourmindstylist.com';

// Core public marketing pages with their priorities
const STATIC_PAGES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/About', priority: '0.9', changefreq: 'monthly' },
  { path: '/Programs', priority: '0.9', changefreq: 'monthly' },
  { path: '/Consultations', priority: '0.8', changefreq: 'monthly' },
  { path: '/LENS', priority: '0.8', changefreq: 'monthly' },
  { path: '/LearnHypnosis', priority: '0.8', changefreq: 'monthly' },
  { path: '/CleaningOutYourCloset', priority: '0.8', changefreq: 'monthly' },
  { path: '/PocketMindset', priority: '0.8', changefreq: 'monthly' },
  { path: '/SpeakingTraining', priority: '0.8', changefreq: 'monthly' },
  { path: '/FreeMasterclass', priority: '0.8', changefreq: 'monthly' },
  { path: '/Contact', priority: '0.8', changefreq: 'monthly' },
  { path: '/Blog', priority: '0.9', changefreq: 'daily' },
  { path: '/Books', priority: '0.8', changefreq: 'monthly' },
  { path: '/Bookings', priority: '0.7', changefreq: 'monthly' },
  { path: '/Shop', priority: '0.7', changefreq: 'weekly' },
  { path: '/Certification', priority: '0.7', changefreq: 'monthly' },
  { path: '/Podcast', priority: '0.7', changefreq: 'weekly' },
  { path: '/Accessibility', priority: '0.3', changefreq: 'yearly' },
];

function escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch dynamic content in parallel
    const [blogPosts, products, webinars, leadMagnets, legalPages] = await Promise.all([
      base44.asServiceRole.entities.BlogPost.filter({ status: 'published' }).catch(() => []),
      base44.asServiceRole.entities.Product.filter({ status: 'published' }).catch(() => []),
      base44.asServiceRole.entities.Webinar.filter({ status: 'published' }).catch(() => []),
      base44.asServiceRole.entities.LeadMagnet.filter({ active: true }).catch(() => []),
      base44.asServiceRole.entities.LegalPage.filter({}).catch(() => []),
    ]);

    // Build URL entries
    const urls = [];

    // Static pages
    for (const page of STATIC_PAGES) {
      urls.push({
        loc: `${SITE_URL}${page.path}`,
        priority: page.priority,
        changefreq: page.changefreq,
      });
    }

    // Published blog posts → /BlogPost?slug=xxx
    for (const post of blogPosts) {
      if (!post.slug) continue;
      urls.push({
        loc: `${SITE_URL}/BlogPost?slug=${encodeURIComponent(post.slug)}`,
        lastmod: formatDate(post.updated_date || post.publish_date || post.created_date),
        priority: '0.7',
        changefreq: 'monthly',
      });
    }

    // Published book products → /books/slug
    const bookProducts = products.filter(p => p.product_subtype === 'book' && p.slug);
    for (const book of bookProducts) {
      urls.push({
        loc: `${SITE_URL}/books/${encodeURIComponent(book.slug)}`,
        lastmod: formatDate(book.updated_date || book.created_date),
        priority: '0.7',
        changefreq: 'monthly',
      });
    }

    // Published non-book products → /ProductPage?slug=xxx (only published, public ones)
    const nonBookProducts = products.filter(p => p.product_subtype !== 'book' && p.slug && p.active);
    for (const product of nonBookProducts) {
      urls.push({
        loc: `${SITE_URL}/ProductPage?slug=${encodeURIComponent(product.slug)}`,
        lastmod: formatDate(product.updated_date || product.created_date),
        priority: '0.6',
        changefreq: 'monthly',
      });
    }

    // Published webinars (free or paid, publicly listed)
    for (const webinar of webinars) {
      if (!webinar.slug) continue;
      urls.push({
        loc: `${SITE_URL}/WebinarPage?slug=${encodeURIComponent(webinar.slug)}`,
        lastmod: formatDate(webinar.updated_date || webinar.created_date),
        priority: '0.6',
        changefreq: 'monthly',
      });
    }

    // Active lead magnets
    for (const lm of leadMagnets) {
      if (!lm.slug) continue;
      urls.push({
        loc: `${SITE_URL}/LeadMagnetPage?slug=${encodeURIComponent(lm.slug)}`,
        lastmod: formatDate(lm.updated_date || lm.created_date),
        priority: '0.6',
        changefreq: 'monthly',
      });
    }

    // Legal pages
    for (const legal of legalPages) {
      if (!legal.slug) continue;
      urls.push({
        loc: `${SITE_URL}/LegalPage?slug=${encodeURIComponent(legal.slug)}`,
        lastmod: formatDate(legal.updated_date || legal.last_reviewed || legal.created_date),
        priority: '0.3',
        changefreq: 'yearly',
      });
    }

    // Generate XML
    const xmlEntries = urls.map(u => {
      let entry = `  <url>\n    <loc>${escapeXml(u.loc)}</loc>`;
      if (u.lastmod) entry += `\n    <lastmod>${u.lastmod}</lastmod>`;
      if (u.changefreq) entry += `\n    <changefreq>${u.changefreq}</changefreq>`;
      if (u.priority) entry += `\n    <priority>${u.priority}</priority>`;
      entry += `\n  </url>`;
      return entry;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    // Return a minimal valid sitemap on error so crawlers don't get a broken response
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><priority>1.0</priority></url>
</urlset>`;
    return new Response(fallbackXml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
});