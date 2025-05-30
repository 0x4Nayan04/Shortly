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
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt fields automatically
  }
);

const short_urlModel = mongoose.model("ShortUrl", shortUrlSchema);

export default short_urlModel;
