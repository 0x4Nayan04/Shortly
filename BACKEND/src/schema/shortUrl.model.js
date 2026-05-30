import mongoose from 'mongoose';

const shortUrlSchema = mongoose.Schema(
  {
    full_url: {
      type: String,
      required: true,
      maxlength: 2048,
      validate: {
        validator: (v) => /^https?:\/\//.test(v),
        message: 'full_url must start with http:// or https://'
      }
    },
    short_url: {
      type: String,
      required: true,
      unique: true,
      index: true,
      maxlength: 20
    },
    click: {
      type: Number,
      default: 0,
      required: true,
      min: 0
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for common query patterns
shortUrlSchema.index({ user: 1, createdAt: -1 });
shortUrlSchema.index({ user: 1, full_url: 1 }, { unique: true });
shortUrlSchema.index({ user: 1, click: -1 });

const short_urlModel = mongoose.model('ShortUrl', shortUrlSchema);

export default short_urlModel;
