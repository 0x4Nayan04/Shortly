import { createUser, findUserByEmail } from "../dao/user.dao.js";
import { signToken } from "../utlis/helper.js";
import { AppError } from "../utlis/errorHandler.js";

export const registerUser = async (name, email, password) => {
  try {
    // Check if user already exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      // User already exists, throw error
      throw new AppError("User already exists with this email", 409);
    }

    // User doesn't exist, create new user
    const newUser = await createUser(name, email, password);

    const token = await signToken({ id: newUser._id });
    return token;
  } catch (error) {
    // If it's already an AppError, just re-throw it
    if (error instanceof AppError) {
      throw error;
    }

    // For any other error, wrap it in AppError
    throw new AppError(`Registration failed: ${error.message}`, 500);
  }
};

export const loginUser = async (email, password) => {
  try {
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
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Login failed: ${error.message}`, 500);
  }
};
