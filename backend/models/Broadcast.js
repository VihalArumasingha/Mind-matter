import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    targetAudience: {
      type: String,
      enum: ['all', 'user', 'volunteer', 'therapist', 'communityOrganizer'],
      required: true
    },
    recipientCount: {
      type: Number,
      required: true,
      min: 1
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    senderName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Broadcast = mongoose.model('Broadcast', broadcastSchema, 'broadcasts');

export default Broadcast;
