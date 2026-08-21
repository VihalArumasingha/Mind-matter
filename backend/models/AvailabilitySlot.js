import mongoose from 'mongoose';

const availabilitySlotSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    start: {
      type: String,
      required: true,
    },
    end: {
      type: String,
      required: true,
    },
    slotDuration: {
      type: String,
      default: '',
    },
    breakStart: {
      type: String,
      default: '',
    },
    breakEnd: {
      type: String,
      default: '',
    },
    breakDuration: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const AvailabilitySlot = mongoose.model(
  'AvailabilitySlot',
  availabilitySlotSchema,
  'availabilityslots'
);

export default AvailabilitySlot;
