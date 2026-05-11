import User from "../schema/user.model.js";

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
