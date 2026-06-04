import User from '../schema/user.model.js';
import { hashEmailToken } from '../utils/hashToken.js';

export const findByEmail = async (email) => User.findOne({ email });

export const findById = async (id) => User.findById(id);

export const findByIdAndDelete = async (id, session = null) =>
  User.findByIdAndDelete(id, session ? { session } : undefined);

export const create = async ({ name, email, password }) => {
  const user = new User({ name, email, password });
  await user.save();
  return user;
};

export const updateNameById = async (
  id,
  name,
  options = { new: true, runValidators: true }
) => User.findByIdAndUpdate(id, { name }, options);

export const incrementTokenVersionById = async (id) =>
  User.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } });

export const findByResetToken = async (token, now = new Date()) => {
  const hashedToken = hashEmailToken(token);
  return User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: now }
  });
};

export const findByVerificationToken = async (token, now = new Date()) => {
  const hashedToken = hashEmailToken(token);
  return User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: now }
  });
};
