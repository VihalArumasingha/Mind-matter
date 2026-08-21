import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    weeklySchedule: {
      type: Map,
      of: Array,
      default: {},
    },
  },
  { timestamps: true }
);

const Availability = mongoose.model('Availability', availabilitySchema, 'availabilities');

export default Availability;
