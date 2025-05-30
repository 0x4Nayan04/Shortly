import mongoose from "mongoose";

const clickAnalyticsSchema = mongoose.Schema(
  {
    shortUrl: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShortUrl",
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    referer: {
      type: String,
      default: "Direct",
    },
    country: {
      type: String,
      default: "Unknown",
    },
    city: {
      type: String,
      default: "Unknown",
    },
    device: {
      type: String,
      default: "Unknown",
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    os: {
      type: String,
      default: "Unknown",
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
clickAnalyticsSchema.index({ shortUrl: 1, createdAt: -1 });

const ClickAnalytics = mongoose.model("ClickAnalytics", clickAnalyticsSchema);

export default ClickAnalytics;
