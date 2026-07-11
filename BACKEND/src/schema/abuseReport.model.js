import mongoose from 'mongoose';

const abuseReportSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    },
    reporterEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    shortUrlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShortUrl',
      default: null
    },
    linkFound: {
      type: Boolean,
      default: false
    },
    linkRetiredAtSubmit: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    },
    reviewNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: null
    },
    resolvedAt: {
      type: Date,
      default: null
    },
    resolvedByEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    }
  },
  { timestamps: true }
);

abuseReportSchema.index({ slug: 1, createdAt: -1 });
abuseReportSchema.index({ createdAt: -1 });
abuseReportSchema.index({ status: 1, createdAt: -1 });

const AbuseReport = mongoose.model('AbuseReport', abuseReportSchema);

export default AbuseReport;
