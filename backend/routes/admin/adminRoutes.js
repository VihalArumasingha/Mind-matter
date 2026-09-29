import express from 'express';
import {
  getDashboardOverview,
  getUsers,
  warnUser,
  suspendUser,
  unsuspendUser,
  getProfessionalApplications,
  submitProfessionalApplication,
  approveProfessional,
  rejectProfessional,
  getReports,
  investigateReport,
  resolveReport,
  dismissReport,
  getAuditLogs,
  getAnalytics,
  getPosts,
  keepPost,
  restrictPost,
  removePost,
  deletePostPermanently
} from '../../controllers/admin/adminController.js';
import {uploadMultiple} from '../../middleware/uploadMiddleware.js';

const router = express.Router();
router.get('/overview', getDashboardOverview);

router.get('/users', getUsers);
router.put('/users/:id/warn', warnUser);
router.put('/users/:id/suspend', suspendUser);
router.put('/users/:id/unsuspend', unsuspendUser);

router.get('/professionals/applications', getProfessionalApplications);
router.post('/professionals/applications/apply', uploadMultiple, submitProfessionalApplication);
router.put('/professionals/applications/:id/approve', approveProfessional);
router.put('/professionals/applications/:id/reject', rejectProfessional);

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

router.get('/analytics', getAnalytics);

export default router;