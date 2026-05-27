import crypto from "crypto";
import { createUser, findUserByEmail, findUserById, findUserByResetToken } from "../dao/user.dao.js";
import { signToken } from "../utils/helper.js";
import { AppError } from "../utils/errorHandler.js";
import { sendPasswordResetEmail } from "./email.service.js";

export const registerUser = async (name, email, password) => {
  // Check if user already exists
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    // User already exists, throw error
    throw new AppError("User already exists with this email", 409);
  }

  // User doesn't exist, create new user
  const newUser = await createUser(name, email, password);

  const token = await signToken({
    id: newUser._id,
    tokenVersion: newUser.tokenVersion ?? 0,
  });

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

  const token = await signToken({
    id: user._id,
    email: user.email,
    tokenVersion: user.tokenVersion ?? 0,
  });

  // Remove password from user object before returning
  user.password = undefined;

  return { token, user };
};

export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await findUserById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new AppError("Old password is incorrect", 401);
  }

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  const token = await signToken({
    id: user._id,
    email: user.email,
    tokenVersion: user.tokenVersion ?? 0,
  });

  user.password = undefined;
  return { token, user };
};

export const requestPasswordReset = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) {
    return { message: "If an account with that email exists, a reset link has been sent." };
  }

  const resetToken = user.generateResetToken();
  await user.save();

  await sendPasswordResetEmail(email, resetToken);

  return { message: "If an account with that email exists, a reset link has been sent." };
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await findUserByResetToken(hashedToken);
  if (!user) {
    throw new AppError("Invalid or expired reset token", 400);
  }

  user.password = newPassword;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  const jwtToken = await signToken({
    id: user._id,
    email: user.email,
    tokenVersion: user.tokenVersion ?? 0,
  });

  user.password = undefined;
  return { token: jwtToken, user };
};
