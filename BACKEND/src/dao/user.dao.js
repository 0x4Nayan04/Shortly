import User from '../schema/user.model.js';

export const findUserByEmail = async (email) => {
  const user = await User.findOne({ email: email });
  return user; // Return user or null if not found
};

export const findUserById = async (id) => {
  const user = await User.findById(id);
  return user; // Return user or null if not found
};

export const createUser = async (name, email, password) => {
  const user = new User({ name, email, password });
  await user.save();
  return user;
};

export const findUserByResetToken = async (hashedToken) => {
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() }
  });
  return user;
};

export const findUserByVerificationToken = async (hashedToken) => {
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: new Date() }
  });
  return user;
};

export const updateUser = async (id, updates) => {
  const user = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true
  });
  return user;
};

export const deleteUserById = async (id) => {
  return User.findByIdAndDelete(id);
};
