/**
 * SEO & Search Keywords Catalog for Viral Me (Domain: https://viralme.site)
 * Powered by Viral Wave
 */

export interface SeoKeywordGroup {
  category: string;
  description: string;
  keywords: string[];
}

export const SEO_KEYWORDS_CONFIG = {
  domain: 'viralme.site',
  canonicalUrl: 'https://viralme.site',
  brandName: 'Viral Me',
  poweredBy: 'Viral Wave',
  contactNumber: '03052838367',
  accountHolder: 'Muhammad Nadir',

  // Primary High-Rank Search Keywords
  primaryKeywords: [
    'viral me',
    'viralme',
    'viralme.site',
    'viral me site',
    'viral wave',
    'viral wave pakistan',
    'social media promotion platform',
    'tiktok views pakistan',
    'buy tiktok views easypaisa',
    'buy tiktok views jazzcash',
    'instagram followers pakistan',
    'youtube views boost pakistan',
    'facebook video views',
    'social boost pro',
    'video viral package'
  ],

  // Platform and Service Groupings
  keywordGroups: [
    {
      category: 'TikTok Promotion',
      description: 'High-retention algorithmic views, likes, and followers for TikTok creators',
      keywords: [
        'tiktok views',
        'buy tiktok views',
        'tiktok views cheap pakistan',
        'real tiktok likes',
        'increase tiktok views fast',
        'tiktok follower boost',
        'tiktok viral algorithm pacing',
        'tiktok fyp booster',
        'tiktok shares and saves package',
        'tiktok comments boost',
        'tiktok monetization watchtime pakistan',
        'tiktok par views kaise badhaye',
        'tiktok video viral trick 2026'
      ]
    },
    {
      category: 'Instagram Growth',
      description: 'Instagram profile reach, reel views, followers and engagement',
      keywords: [
        'instagram followers',
        'buy instagram followers pakistan',
        'instagram reels views',
        'instagram post likes',
        'instagram profile growth service',
        'active instagram followers',
        'insta viral reels reach',
        'instagram business growth pakistan',
        'high retention insta likes'
      ]
    },
    {
      category: 'YouTube Optimization',
      description: 'YouTube video reach, subscriber growth, and watch hours',
      keywords: [
        'youtube views',
        'youtube views pakistan',
        'buy youtube views',
        'youtube channel promotion',
        'youtube watch hours boost',
        'youtube subscribers real',
        'youtube shorts viral boost',
        'youtube algorithm boost'
      ]
    },
    {
      category: 'Facebook Reach',
      description: 'Facebook video monetization views, page likes, and post shares',
      keywords: [
        'facebook video views',
        'facebook page followers',
        'facebook post shares',
        'fb reels views pakistan',
        'facebook engagement booster',
        'facebook monetization views'
      ]
    },
    {
      category: 'Pakistan Local Payments & Trust',
      description: 'Fast local payments via Easypaisa, JazzCash, and instant order tracking',
      keywords: [
        'easypaisa tiktok views',
        'jazzcash instagram followers',
        'pakistan smm panel',
        'cheap social media services pakistan',
        'trusted video promotion pakistan',
        'muhammad nadir viral me',
        '03052838367 easypaisa',
        'instant order tracking viral me'
      ]
    }
  ] as SeoKeywordGroup[],

  // Long-tail high-conversion intent keywords
  longTailIntents: [
    'how to make video viral on tiktok in pakistan',
    'best site to boost social media followers pakistan',
    'viral me order status tracking',
    'safe social media growth with easypaisa payment',
    'multi day volume drip feed social promotion',
    'algorithmic reach calculator online'
  ]
};

/**
 * Returns a deduplicated flat array of all SEO keywords
 */
export function getAllSeoKeywords(): string[] {
  const set = new Set<string>();

  SEO_KEYWORDS_CONFIG.primaryKeywords.forEach(k => set.add(k.toLowerCase()));
  SEO_KEYWORDS_CONFIG.longTailIntents.forEach(k => set.add(k.toLowerCase()));

  for (const group of SEO_KEYWORDS_CONFIG.keywordGroups) {
    group.keywords.forEach(k => set.add(k.toLowerCase()));
  }

  return Array.from(set);
}

/**
 * Searches keywords based on a query parameter
 */
export function queryKeywords(searchTerm: string): {
  matchedKeywords: string[];
  suggestedCategories: string[];
} {
  const query = searchTerm.toLowerCase().trim();
  const all = getAllSeoKeywords();

  if (!query) {
    return {
      matchedKeywords: SEO_KEYWORDS_CONFIG.primaryKeywords,
      suggestedCategories: SEO_KEYWORDS_CONFIG.keywordGroups.map(g => g.category)
    };
  }

  const matchedKeywords = all.filter(k => k.includes(query));
  const suggestedCategories = SEO_KEYWORDS_CONFIG.keywordGroups
    .filter(g =>
      g.category.toLowerCase().includes(query) ||
      g.keywords.some(k => k.includes(query))
    )
    .map(g => g.category);

  return { matchedKeywords, suggestedCategories };
}

/**
 * Generates XML Sitemap string dynamically
 */
export function generateDynamicSitemapXml(): string {
  const baseUrl = SEO_KEYWORDS_CONFIG.canonicalUrl;
  const currentDate = new Date().toISOString().split('T')[0];

  const routes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/track', priority: '0.9', changefreq: 'daily' },
    { path: '/calculator', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/tiktok-views', priority: '0.9', changefreq: 'weekly' },
    { path: '/services/tiktok-likes', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/tiktok-followers', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/instagram-followers', priority: '0.9', changefreq: 'weekly' },
    { path: '/services/instagram-likes', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/instagram-views', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/youtube-views', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/youtube-subscribers', priority: '0.8', changefreq: 'weekly' },
    { path: '/services/facebook-views', priority: '0.7', changefreq: 'weekly' },
    { path: '/services/facebook-likes', priority: '0.7', changefreq: 'weekly' }
  ];

  const urlEntries = routes
    .map(
      r => `  <url>
    <loc>${baseUrl}${r.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}
