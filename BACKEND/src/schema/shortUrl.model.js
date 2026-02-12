import mongoose from "mongoose";

const shortUrlSchema = mongoose.Schema(
  {
    full_url: {
      type: String,
      required: true,
    },
    short_url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    click: {
      type: Number,
      default: 0,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true, // Add index for user field
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
  }
);

// Add compound indexes for common query patterns
shortUrlSchema.index({ user: 1, createdAt: -1 }); // For getting user URLs sorted by creation date
shortUrlSchema.index({ user: 1, full_url: 1 }); // For checking if user already has this URL

const short_urlModel = mongoose.model("ShortUrl", shortUrlSchema);

export default short_urlModel;
