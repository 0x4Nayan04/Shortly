import User from '../schema/user.model.js';
import { hashEmailToken } from '../utils/hashToken.js';
import { MAX_LINKS_PER_USER } from '../constants/shortUrlLimits.js';

export const findByEmail = async (email) => User.findOne({ email });

export const findById = async (id) => User.findById(id);

export const findByIdAndDelete = async (id, session = null) =>
  User.findByIdAndDelete(id, session ? { session } : undefined);

export const create = async ({ name, email, password }) => {
  const user = new User({
    name,
    email,
    password
  });
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

export const reserveActiveLinkSlot = async (userId, session) =>
  User.findOneAndUpdate(
    { _id: userId, activeLinkCount: { $lt: MAX_LINKS_PER_USER } },
    { $inc: { activeLinkCount: 1 } },
    { session, new: true, projection: { _id: 1 } }
  ).lean();

export const releaseActiveLinkSlots = async (userId, count, session) => {
  if (!count) return;
  await User.updateOne(
    { _id: userId },
    [
      {
        $set: {
          activeLinkCount: {
            $max: [
              0,
              { $subtract: [{ $ifNull: ['$activeLinkCount', 0] }, count] }
            ]
          }
        }
      }
    ],
    { session }
  );
};

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
