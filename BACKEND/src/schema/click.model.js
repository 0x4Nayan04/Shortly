import mongoose from 'mongoose';

const clickSchema = mongoose.Schema(
  {
    short_url_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShortUrl',
      required: true,
      index: true
    },
    referrer: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    },
    user_agent: {
      type: String,
      default: '',
      maxlength: 512
    },
    device_type: {
      type: String,
      default: ''
    },
    browser: {
      type: String,
      default: ''
    },
    os: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

clickSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
clickSchema.index({ short_url_id: 1, timestamp: -1 });

const Click = mongoose.model('Click', clickSchema);

export default Click;
