import express from 'express';
import {
  getAvailabilitySchedule,
  saveAvailabilitySchedule,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  updateAvailabilityStatus,
  getVolunteerDashboard,
  getVolunteerRequests,
  acceptVolunteerRequest,
  declineVolunteerRequest,
} from '../../controllers/volunteer/volunteerController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

// Test route to verify volunteer routes are working
router.get('/test', (req, res) => {
  console.log('[Volunteer Routes] Test route called');
  res.json({
    success: true,
    message: 'Volunteer routes are working',
    timestamp: new Date().toISOString()
  });
});

router.get('/dashboard', authMiddleware, getVolunteerDashboard);
// Test accept route without auth for debugging
router.post('/requests/:id/accept-test', acceptVolunteerRequest);

router.post('/requests/:id/accept', authMiddleware, acceptVolunteerRequest);
router.post('/requests/:id/decline', authMiddleware, declineVolunteerRequest);
router.get('/requests', authMiddleware, getVolunteerRequests);
router.get('/availability/schedule', authMiddleware, getAvailabilitySchedule);
router.post('/availability/schedule', authMiddleware, saveAvailabilitySchedule);
router.post('/availability/slots', authMiddleware, createAvailabilitySlot);
router.put('/availability/slots/:id', authMiddleware, updateAvailabilitySlot);
router.delete('/availability/slots/:id', authMiddleware, deleteAvailabilitySlot);
router.put('/availability', authMiddleware, updateAvailabilityStatus);

export default router;
