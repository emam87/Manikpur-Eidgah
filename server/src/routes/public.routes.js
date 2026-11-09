import { Router } from 'express';
import {
  getHomeData,
  getPublicSettings,
  getAboutData,
  getMembers,
  getDonors,
  getDocuments,
  getLandMaps,
  getNotices,
  getNoticeBySlug,
} from '../controllers/public.controller.js';

const router = Router();

router.get('/home', getHomeData);
router.get('/settings', getPublicSettings);
router.get('/about', getAboutData);
router.get('/members', getMembers);
router.get('/donors', getDonors);
router.get('/documents', getDocuments);
router.get('/land-maps', getLandMaps);
router.get('/notices', getNotices);
router.get('/notices/:slug', getNoticeBySlug);

export default router;
