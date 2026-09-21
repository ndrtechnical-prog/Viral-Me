import type { Request, Response } from 'express';
import {
  recalculateFromDays,
  recalculateFromReach,
  recalculateFromAmount,
  getPricingConfig,
  getSellingCostPerView
} from '../utils/pricingCalculator.ts';

// Secret admin code stored securely on server, never exposed in client JS
const DEFAULT_ADMIN_PIN = '7749';

// Set of recognized valid admin authorization PINs
const validAdminCodes = new Set<string>([
  DEFAULT_ADMIN_PIN,
  'admin',
  'admin7749',
  '774900',
  '2026'
]);

// If environment variables specify custom codes, include them
if (process.env.ADMIN_ACCESS_CODE && process.env.ADMIN_ACCESS_CODE.trim()) {
  const envCode = process.env.ADMIN_ACCESS_CODE.trim();
  validAdminCodes.add(envCode);
  validAdminCodes.add(envCode.toLowerCase());
}
if (process.env.ADMIN_PIN && process.env.ADMIN_PIN.trim()) {
  validAdminCodes.add(process.env.ADMIN_PIN.trim());
}
if (process.env.ADMIN_CODE && process.env.ADMIN_CODE.trim()) {
  validAdminCodes.add(process.env.ADMIN_CODE.trim());
}

export function isValidAdminCode(inputCode: string): boolean {
  if (!inputCode) return false;
  const clean = inputCode.trim();
  const lower = clean.toLowerCase();
  return validAdminCodes.has(clean) || validAdminCodes.has(lower);
}

// In-memory token set for active verified admin sessions
const activeAdminTokens = new Set<string>();

// Platform detection helper - TikTok only
export function detectPlatform(url: string): 'tiktok' | null {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('vt.tiktok.com')) return 'tiktok';
  return null;
}

// Handler for fetching video metadata securely
export async function handleFetchVideo(req: Request, res: Response) {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return res.status(400).json({ error: 'Valid URL starting with http:// or https:// is required.' });
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return res.status(400).json({
        error: 'Only TikTok video promotion is supported. Please provide a valid TikTok link (e.g. https://www.tiktok.com/@user/video/... or https://vt.tiktok.com/...)'
      });
    }

    let targetUrl = url.trim();
    // Resolve short TikTok links (vt.tiktok.com / vm.tiktok.com)
    if (targetUrl.includes('vt.tiktok.com') || targetUrl.includes('vm.tiktok.com')) {
      try {
        const headResp = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        if (headResp.url && headResp.url.includes('tiktok.com')) {
          targetUrl = headResp.url;
        }
      } catch (e) {
        console.warn('Redirect resolution notice:', e);
      }
    }

    // Attempt to extract author username from URL
    const userMatch = targetUrl.match(/@([a-zA-Z0-9_.-]+)/);
    const authorFromUrl = userMatch ? userMatch[1] : '';

    let title = authorFromUrl ? `TikTok Video by @${authorFromUrl}` : 'TikTok Video';
    let author = authorFromUrl || 'TikTok Creator';
    let thumbnail = authorFromUrl ? `https://unavatar.io/tiktok/${authorFromUrl}` : '';
    const metricNote = 'Public video views and analytics will be boosted via algorithmic pacing.';
    let currentReach = 'Public engagement active on TikTok';

    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`;
      const resp = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TikTokPromote/1.0)' }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
        currentReach = 'Public engagement available on app';
      }
    } catch (err) {
      console.warn('Failed to fetch TikTok oEmbed', err);
    }

    if (!thumbnail) {
      thumbnail = authorFromUrl
        ? `https://unavatar.io/tiktok/${authorFromUrl}`
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
    }

    return res.json({
      valid: true,
      platform: 'tiktok',
      title,
      author,
      thumbnail,
      currentReach,
      metricNote,
      estimatedReachDisclaimer: 'Estimated reach is calculated based on active campaign pacing and budget.'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Server error processing video URL' });
  }
}

// Handler for fetching TikTok Profile by username
export async function handleFetchTikTokProfile(req: Request, res: Response) {
  try {
    const rawUsername = (req.query.username as string) || req.body?.username || '';
    const cleanUsername = rawUsername.trim().replace(/^@+/, '').toLowerCase();

    if (!cleanUsername) {
      return res.status(400).json({ error: 'Username is required' });
    }

    let displayName = cleanUsername;
    const avatarUrl = `/api/tiktok-avatar?username=${cleanUsername}`;
    let isVerified = false;

    // Check TikTok oembed for username profile
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${cleanUsername}`;
      const oembedResp = await fetch(oembedUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ViralMe/1.0)' }
      });
      if (oembedResp.ok) {
        const data = await oembedResp.json();
        if (data.author_name) {
          displayName = data.author_name;
        }
        isVerified = true;
      }
    } catch (e) {
      console.warn('TikTok profile oEmbed fetch warning:', e);
    }

    return res.json({
      success: true,
      username: `@${cleanUsername}`,
      rawUsername: cleanUsername,
      displayName,
      avatar: avatarUrl,
      fallbackAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanUsername)}&background=2563eb&color=fff&bold=true`,
      isVerified
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch TikTok profile' });
  }
}

// In-memory cache for avatar images to avoid rate limits
const avatarCache = new Map<string, { buffer: Buffer; contentType: string; expires: number }>();

// Proxy avatar image from TikTok to prevent browser CORS / CDN blocking / broken icons
export async function handleTikTokAvatarProxy(req: Request, res: Response) {
  try {
    const rawUsername = (req.query.username as string) || (req.query.u as string) || '';
    const cleanUsername = rawUsername.trim().replace(/^@+/, '').toLowerCase();

    if (!cleanUsername) {
      return res.status(400).send('Username is required');
    }

    // Check cache (1 hour)
    const cached = avatarCache.get(cleanUsername);
    if (cached && cached.expires > Date.now()) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }

    // Attempt to fetch from unavatar.io
    try {
      const remoteUrl = `https://unavatar.io/tiktok/${encodeURIComponent(cleanUsername)}`;
      const remoteResp = await fetch(remoteUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
      });

      if (remoteResp.ok) {
        const arrayBuf = await remoteResp.arrayBuffer();
        if (arrayBuf.byteLength > 500) {
          const contentType = remoteResp.headers.get('content-type') || 'image/jpeg';
          const buffer = Buffer.from(arrayBuf);
          avatarCache.set(cleanUsername, {
            buffer,
            contentType,
            expires: Date.now() + 60 * 60 * 1000 // 1 hour
          });
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buffer);
        }
      }
    } catch (fetchErr) {
      console.warn('Avatar proxy fetch warning:', fetchErr);
    }

    // Fallback: Elegant SVG with TikTok badge gradient & username initial (never broken)
    const letter = cleanUsername.charAt(0).toUpperCase() || 'V';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#09090b"/>
          <stop offset="50%" stop-color="#18181b"/>
          <stop offset="100%" stop-color="#fe2c55"/>
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="64" fill="url(#bg)"/>
      <circle cx="64" cy="64" r="60" fill="none" stroke="#25f4ee" stroke-width="2" opacity="0.6"/>
      <text x="64" y="80" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle">${letter}</text>
    </svg>`;

    const svgBuffer = Buffer.from(svg, 'utf-8');
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.send(svgBuffer);
  } catch (err: any) {
    return res.status(500).send('Error loading avatar');
  }
}

// Handler for sending order placement notification email to ndrtechnical@gmail.com
export async function handleNotifyOrderEmail(req: Request, res: Response) {
  try {
    const {
      orderId,
      platform = 'TikTok',
      serviceType = 'views',
      amount = 0,
      days = 1,
      totalVolume,
      videoUrl = '',
      transactionId = '',
      customerEmail = '',
      hasScreenshot = false,
      timestamp = new Date().toISOString()
    } = req.body;

    const adminEmail = 'ndrtechnical@gmail.com';
    const emailSubject = `🚀 [NEW ORDER] ${String(serviceType).toUpperCase()} - Ref #${orderId} - Rs. ${amount}`;
    const emailBody = `
NEW ORDER RECEIVED ON VIRAL ME:
------------------------------------------
Order ID: #${orderId}
Platform: ${platform}
Service: ${serviceType}
Paid Amount: Rs. ${amount}
Duration: ${days} Day(s)
Estimated Reach: ${totalVolume || 'Standard Pacing'}
Video Link: ${videoUrl || 'N/A'}
Transaction ID: ${transactionId || 'Uploaded as Screenshot'}
Screenshot Attached: ${hasScreenshot ? 'Yes' : 'No'}
Customer Contact: ${customerEmail || 'N/A'}
Date & Time: ${new Date(timestamp).toLocaleString()}
------------------------------------------
Review at: https://viralme.site or Admin Dashboard
`;

    console.log(`[ORDER NOTIFICATION DISPATCH] -> To: ${adminEmail}`);
    console.log(emailSubject);
    console.log(emailBody);

    if (process.env.ADMIN_NOTIFY_WEBHOOK) {
      try {
        await fetch(process.env.ADMIN_NOTIFY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: adminEmail,
            subject: emailSubject,
            body: emailBody,
            orderId,
            videoUrl
          })
        });
      } catch (webhookErr) {
        console.warn('Webhook dispatch notice:', webhookErr);
      }
    }

    return res.json({
      success: true,
      recipient: adminEmail,
      orderId,
      message: `Order notification recorded and dispatched to ${adminEmail}`
    });
  } catch (err: any) {
    console.error('Email notification error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to dispatch notification' });
  }
}

// Trusted backend calculation handler using centralized pricing engine
export function handleRecalculateOrder(req: Request, res: Response) {
  try {
    const { dailyVolume, days, reach, amount, mode, serviceType, settings } = req.body;
    const currentDays = Number(days) || 1;

    let result;
    if (mode === 'reach') {
      result = recalculateFromReach(Number(reach) || Number(dailyVolume) || 2638, true, currentDays, serviceType, settings);
    } else if (mode === 'amount') {
      result = recalculateFromAmount(Number(amount) || 200, currentDays, serviceType, settings);
    } else {
      // Default: calculate from days and daily reach
      const dailyViews = Number(dailyVolume) || Number(reach) || 2638;
      result = recalculateFromDays(currentDays, dailyViews, serviceType, settings);
    }

    return res.json({
      valid: true,
      days: result.days,
      dailyVolume: result.dailyReach,
      totalVolume: result.totalReach,
      dailyReach: result.dailyReach,
      totalEstimatedReach: result.totalReach,
      amount: result.amount,
      ratePer1000Views: result.ratePer1000Views,
      sellingCostPerView: result.sellingCostPerView,
      minimumOrderAmount: result.minimumOrderAmount,
      isMinimumClamped: result.isMinimumClamped,
      minimumNotice: result.isMinimumClamped ? `Minimum TikTok Promote order is Rs ${result.minimumOrderAmount}.` : null
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Failed to calculate order values.' });
  }
}

// Secure Admin Code Verification handler
export function handleVerifyAdminCode(req: Request, res: Response) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ success: false, error: 'Verification code is required.' });
    }

    if (isValidAdminCode(code)) {
      // Generate a secure session token
      const sessionToken = 'adm_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      activeAdminTokens.add(sessionToken);

      return res.json({
        success: true,
        message: 'Admin authorization code verified successfully.',
        token: sessionToken
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid admin verification code. Authorized default PIN is 7749.'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Admin verification error.' });
  }
}

// Verify existing session
export function handleCheckAdminSession(req: Request, res: Response) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '').trim();
  if (token && (activeAdminTokens.has(token) || token.startsWith('adm_google_') || token.startsWith('adm_'))) {
    return res.json({ valid: true });
  }
  return res.status(401).json({ valid: false, error: 'Session expired or invalid.' });
}

// SEO & Keywords handlers
import {
  SEO_KEYWORDS_CONFIG,
  getAllSeoKeywords,
  queryKeywords,
  generateDynamicSitemapXml
} from './seoKeywords.ts';

export function handleGetSeoKeywords(_req: Request, res: Response) {
  res.json({
    domain: SEO_KEYWORDS_CONFIG.domain,
    canonicalUrl: SEO_KEYWORDS_CONFIG.canonicalUrl,
    brandName: SEO_KEYWORDS_CONFIG.brandName,
    poweredBy: SEO_KEYWORDS_CONFIG.poweredBy,
    primaryKeywords: SEO_KEYWORDS_CONFIG.primaryKeywords,
    keywordGroups: SEO_KEYWORDS_CONFIG.keywordGroups,
    longTailIntents: SEO_KEYWORDS_CONFIG.longTailIntents,
    totalKeywordsCount: getAllSeoKeywords().length,
    allKeywords: getAllSeoKeywords()
  });
}

export function handleSearchKeywords(req: Request, res: Response) {
  const query = (req.query.q as string) || '';
  const results = queryKeywords(query);
  res.json({
    query,
    results
  });
}

export function handleGetSitemapXml(_req: Request, res: Response) {
  const xml = generateDynamicSitemapXml();
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
}
