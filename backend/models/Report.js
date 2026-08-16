import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reporterName: {
      type: String,
      default: 'Anonymous Reporter'
    },
    targetType: {
      type: String,
      enum: ['User', 'Post', 'Professional', 'Community'],
      required: true
    },
    targetId: {
      type: String,
      required: true
    },
    targetTitle: {
      type: String,
      default: ''
    },
    reason: {
      type: String,
      required: true
    },
    details: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open'
    },
    actionTaken: {
      type: String,
      default: ''
    },
    resolvedBy: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const Report = mongoose.model('Report', reportSchema);

export default Report;
