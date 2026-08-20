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
    repeatWeekly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Availability = mongoose.model('Availability', availabilitySchema, 'availabilities');

export default Availability;
