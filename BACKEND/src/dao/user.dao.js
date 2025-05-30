import User from "../schema/user.model.js";

export const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ email: email });
    return user; // Return user or null if not found
  } catch (error) {
    throw new Error(`Error finding user: ${error.message}`);
  }
};

export const findUserById = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    return user;
  } catch (error) {
    throw new Error(`Error finding user by ID: ${error.message}`);
  }
};

export const createUser = async (name, email, password) => {
  try {
    const user = new User({ name, email, password });
    await user.save();
    return user;
  } catch (error) {
    throw new Error(`Error creating user: ${error.message}`);
  }
};