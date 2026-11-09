import { Router } from 'express';
import { getHomeData, getPublicSettings } from '../controllers/public.controller.js';

const router = Router();

router.get('/home', getHomeData);
router.get('/settings', getPublicSettings);

export default router;
