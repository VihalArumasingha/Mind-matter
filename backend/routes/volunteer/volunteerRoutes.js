import express from 'express';
import {
  getAvailabilitySchedule,
  saveAvailabilitySchedule,
  createAvailabilitySlot,
  updateAvailabilitySlot,
  deleteAvailabilitySlot,
  updateAvailabilityStatus,
  getVolunteerDashboard,
} from '../../controllers/volunteer/volunteerController.js';
import authMiddleware from '../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', authMiddleware, getVolunteerDashboard);
router.get('/availability/schedule', authMiddleware, getAvailabilitySchedule);
router.post('/availability/schedule', authMiddleware, saveAvailabilitySchedule);
router.post('/availability/slots', authMiddleware, createAvailabilitySlot);
router.put('/availability/slots/:id', authMiddleware, updateAvailabilitySlot);
router.delete('/availability/slots/:id', authMiddleware, deleteAvailabilitySlot);
router.put('/availability', authMiddleware, updateAvailabilityStatus);

export default router;
