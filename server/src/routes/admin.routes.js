import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { 
  uploadSingleImage, 
  uploadSingleDocument, 
  uploadMultiImages, 
  uploadDesignImages 
} from '../middleware/upload.middleware.js';
import {
  getDashboardStats,
  // Members
  getMembers,
  createMember,
  updateMember,
  deleteMember,
  importMembers,
  // Donors
  getDonors,
  createDonor,
  updateDonor,
  deleteDonor,
  importDonors,
  // Committee
  getCommitteeMembers,
  createCommitteeMember,
  updateCommitteeMember,
  deleteCommitteeMember,
  archiveCommitteeTerm,
  // Albums & Photos
  getAlbums,
  getAlbumById,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  uploadAlbumPhotos,
  updatePhoto,
  deletePhoto,
  setCoverPhoto,
  // Documents
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  getDocumentSignedUrl,
  // Land Maps
  getLandMaps,
  createLandMap,
  updateLandMap,
  deleteLandMap,
  // Notices
  getNotices,
  createNotice,
  updateNotice,
  deleteNotice,
  // Designs
  getDesigns,
  updateDesign,
  updateDesignVideo,
  // Settings
  getSettings,
  updateSettings,
  // Users (ADMIN only)
  getUsers,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  // Trash
  getTrashItems,
  restoreTrashItem,
  permanentDeleteTrashItem,
  // Activity Logs
  getActivityLogs,
  // Backup
  getDatabaseBackup,
} from '../controllers/admin.controller.js';

const router = Router();

// Protect ALL admin routes with requireAuth
router.use(requireAuth);

// 1. Dashboard
router.get('/dashboard', getDashboardStats);

// 2. Members
router.get('/members', getMembers);
router.post('/members', uploadSingleImage, createMember);
router.put('/members/:id', uploadSingleImage, updateMember);
router.delete('/members/:id', deleteMember);
router.post('/members/import', importMembers);

// 3. Donors
router.get('/donors', getDonors);
router.post('/donors', createDonor);
router.put('/donors/:id', updateDonor);
router.delete('/donors/:id', deleteDonor);
router.post('/donors/import', importDonors);

// 4. Committee
router.get('/committee', getCommitteeMembers);
router.post('/committee', uploadSingleImage, createCommitteeMember);
router.put('/committee/:id', uploadSingleImage, updateCommitteeMember);
router.delete('/committee/:id', deleteCommitteeMember);
router.post('/committee/archive-term', archiveCommitteeTerm);

// 5. Albums & Photos
router.get('/albums', getAlbums);
router.get('/albums/:id', getAlbumById);
router.post('/albums', createAlbum);
router.put('/albums/:id', updateAlbum);
router.delete('/albums/:id', deleteAlbum);
router.post('/albums/:id/photos', uploadMultiImages, uploadAlbumPhotos);
router.put('/photos/:photoId', updatePhoto);
router.delete('/photos/:photoId', deletePhoto);
router.post('/albums/:id/cover', setCoverPhoto);

// 6. Documents
router.get('/documents', getDocuments);
router.post('/documents', uploadSingleDocument, createDocument);
router.put('/documents/:id', updateDocument);
router.delete('/documents/:id', requireRole('ADMIN'), deleteDocument);
router.get('/documents/:id/signed-url', getDocumentSignedUrl);

// 7. Land Maps
router.get('/land-maps', getLandMaps);
router.post('/land-maps', uploadSingleDocument, createLandMap);
router.put('/land-maps/:id', updateLandMap);
router.delete('/land-maps/:id', deleteLandMap);

// 8. Notices
router.get('/notices', getNotices);
router.post('/notices', uploadSingleDocument, createNotice);
router.put('/notices/:id', uploadSingleDocument, updateNotice);
router.delete('/notices/:id', deleteNotice);

// 9. Designs & 3D Video
router.get('/designs', getDesigns);
router.put('/designs/:id', uploadSingleImage, updateDesign);
router.post('/designs/video', updateDesignVideo);

// 10. Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// 11. Users (ADMIN only)
router.get('/users', requireRole('ADMIN'), getUsers);
router.post('/users', requireRole('ADMIN'), createUser);
router.put('/users/:id', requireRole('ADMIN'), updateUser);
router.post('/users/:id/reset-password', requireRole('ADMIN'), resetUserPassword);
router.delete('/users/:id', requireRole('ADMIN'), deleteUser);

// 12. Trash
router.get('/trash', getTrashItems);
router.post('/trash/restore', restoreTrashItem);
router.post('/trash/permanent-delete', requireRole('ADMIN'), permanentDeleteTrashItem);

// 13. Activity Log
router.get('/activity-logs', getActivityLogs);

// 14. Full Database Backup (ADMIN only)
router.get('/backup/export', requireRole('ADMIN'), getDatabaseBackup);

export default router;
