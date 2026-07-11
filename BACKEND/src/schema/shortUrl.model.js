import mongoose from 'mongoose';

const shortUrlSchema = mongoose.Schema(
  {
    full_url: {
      type: String,
      maxlength: 2048,
      validate: {
        validator: (v) => /^https?:\/\//.test(v),
        message: 'full_url must start with http:// or https://'
      }
    },
    canonical_url: {
      type: String,
      maxlength: 2048,
      index: true
    },
    short_url: {
      type: String,
      required: true,
      maxlength: 20
    },
    click: {
      type: Number,
      default: 0,
      required: true,
      min: 0
    },
    disabled: {
      type: Boolean,
      default: false
    },
    retiredAt: {
      type: Date,
      default: null
    },
    manage_token: {
      type: String,
      select: false
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

shortUrlSchema.index({ user: 1, createdAt: -1 });
shortUrlSchema.index(
  { user: 1, canonical_url: 1 },
  {
    unique: true,
    partialFilterExpression: {
      user: { $type: 'objectId' },
      canonical_url: { $type: 'string' },
      retiredAt: null
    }
  }
);
shortUrlSchema.index({ user: 1, click: -1 });
shortUrlSchema.index({ short_url: 1 }, { unique: true });

const short_urlModel = mongoose.model('ShortUrl', shortUrlSchema);

export default short_urlModel;
