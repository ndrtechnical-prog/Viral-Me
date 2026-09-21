import express from 'express';
import {
  handleFetchVideo,
  handleFetchTikTokProfile,
  handleTikTokAvatarProxy,
  handleNotifyOrderEmail,
  handleRecalculateOrder,
  handleVerifyAdminCode,
  handleCheckAdminSession,
  handleGetSeoKeywords,
  handleSearchKeywords,
  handleGetSitemapXml
} from './apiHandlers.ts';

export const apiRouter = express.Router();

apiRouter.use(express.json());

// Video info / process endpoints
apiRouter.post('/video-info', handleFetchVideo);
apiRouter.post('/process-video', handleFetchVideo);

// TikTok user profile endpoint & image proxy
apiRouter.get('/tiktok-profile', handleFetchTikTokProfile);
apiRouter.post('/tiktok-profile', handleFetchTikTokProfile);
apiRouter.get('/tiktok-avatar', handleTikTokAvatarProxy);

// Order placement email notification to ndrtechnical@gmail.com
apiRouter.post('/notify-order-email', handleNotifyOrderEmail);

apiRouter.post('/recalculate-order', handleRecalculateOrder);
apiRouter.post('/admin/verify-code', handleVerifyAdminCode);
apiRouter.get('/admin/check-session', handleCheckAdminSession);

// SEO & Search Keywords Endpoints
apiRouter.get('/seo/keywords', handleGetSeoKeywords);
apiRouter.get('/seo/search-suggestions', handleSearchKeywords);
apiRouter.get('/seo/sitemap.xml', handleGetSitemapXml);

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
