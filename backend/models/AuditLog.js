import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      default: 'admin_1'
    },
    adminName: {
      type: String,
      default: 'Admin User'
    },
    action: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    },
    targetId: {
      type: String,
      default: ''
    },
    targetName: {
      type: String,
      default: ''
    },
    details: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
