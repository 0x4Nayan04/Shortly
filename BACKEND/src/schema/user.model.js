import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcrypt";

const resetTokenSize = 32;

function getGravatarUrl(email) {
  // Use Node.js built-in crypto instead of md5 package
  const emailHash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${emailHash}?d=identicon`;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  avatar: {
    type: String,
    required: false,
    // as gravatar as default
    default: function () {
      return getGravatarUrl(this.email);
    },
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(resetTokenSize).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
  this.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  return token;
};

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(`Password comparison failed: ${error.message}`);
  }
};

const User = mongoose.model("User", userSchema);

export default User;
