import { createUser, findUserByEmail } from "../dao/user.dao.js";
import { signToken } from "../utils/helper.js";
import { AppError } from "../utils/errorHandler.js";

export const registerUser = async (name, email, password) => {
  // Check if user already exists
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    // User already exists, throw error
    throw new AppError("User already exists with this email", 409);
  }

  // User doesn't exist, create new user
  const newUser = await createUser(name, email, password);

  const token = await signToken({ id: newUser._id });

  newUser.password = undefined;
  return { token, user: newUser };
};

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email);

  if (!user) {
    throw new AppError("Invalid Credentials", 401);
  }

  // Assuming you have a comparePassword method on your user model
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError("Invalid Credentials", 401);
  }

  const token = await signToken({ id: user._id, email: user.email });

  // Remove password from user object before returning
  user.password = undefined;

  return { token, user };
};
