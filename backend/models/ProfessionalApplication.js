import mongoose from 'mongoose';

const professionalApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,   
      default: null
    },
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: false
    },
    phone: {
      type: String,
      default: ''
    },
    profession: {
      type: String,
      required: true
    },
    licenseNum: {
      type: String,
      required: true,
      unique: true
    },
    specialization: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      default: ''
    },
    expYears: {
      type: Number,
      default: 0
    },
    documents: [
      {
        title: { type: String, default: 'Credential Document' },
        url: { type: String, default: '' },   // Not required — mobile uploads use filename only
        type: { type: String, default: 'license' },
        fileName: { type: String, default: '' },
        mimeType: { type: String, default: '' }
      }
    ],
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

const ProfessionalApplication = mongoose.model('ProfessionalApplication', professionalApplicationSchema);

export default ProfessionalApplication;
