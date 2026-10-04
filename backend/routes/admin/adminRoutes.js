import express from 'express';
import {
  getDashboardOverview,
  getUsers,
  warnUser,
  suspendUser,
  unsuspendUser,
  getProfessionalApplications,
  getCommunityOrganizerApplications,
  submitProfessionalApplication,
  approveProfessional,
  rejectProfessional,
  approveCommunityOrganizer,
  rejectCommunityOrganizer,
  getReports,
  investigateReport,
  resolveReport,
  dismissReport,
  getAuditLogs,
  getAnalytics,
  createBroadcast,
  getBroadcasts,
  getPosts,
  keepPost,
  restrictPost,
  removePost,
  deletePostPermanently
} from '../../controllers/admin/adminController.js';
import {getReportSummary, exportReportData} from '../../controllers/reportController.js';
import {uploadMultiple} from '../../middleware/uploadMiddleware.js';
import authMiddleware from '../../middleware/authMiddleware.js';
import requireRole from '../../middleware/roleMiddleware.js';

const router = express.Router();
router.post('/broadcasts', authMiddleware, requireRole('admin'), createBroadcast);
router.get('/broadcasts', authMiddleware, requireRole('admin'), getBroadcasts);

router.get('/overview', getDashboardOverview);

router.get('/users', getUsers);
router.put('/users/:id/warn', warnUser);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);

router.get('/professionals/applications', authMiddleware, requireRole('admin'), getProfessionalApplications);
router.get('/community-organizers/applications', authMiddleware, requireRole('admin'), getCommunityOrganizerApplications);
router.post('/professionals/applications/apply', uploadMultiple, submitProfessionalApplication);
router.put('/professionals/applications/:id/approve', authMiddleware, requireRole('admin'), approveProfessional);
router.put('/professionals/applications/:id/reject', authMiddleware, requireRole('admin'), rejectProfessional);
router.put('/community-organizers/applications/:id/approve', authMiddleware, requireRole('admin'), approveCommunityOrganizer);
router.put('/community-organizers/applications/:id/reject', authMiddleware, requireRole('admin'), rejectCommunityOrganizer);

router.get('/reports', getReports);
router.put('/reports/:id/investigate', investigateReport);
router.put('/reports/:id/resolve', resolveReport);
router.put('/reports/:id/dismiss', dismissReport);

router.get('/posts', getPosts);
router.put('/posts/:id/keep', keepPost);
router.put('/posts/:id/restrict', restrictPost);
router.put('/posts/:id/remove', removePost);
router.delete('/posts/:id', deletePostPermanently);
router.get('/audit-logs', getAuditLogs);

router.get('/reports/summary', authMiddleware, requireRole('admin'), getReportSummary);

router.get('/reports/export', authMiddleware, requireRole('admin'), exportReportData);
router.get('/analytics', authMiddleware, requireRole('admin'), getAnalytics);

export default router;