import { registerUser, loginUser } from "../services/auth.services.js";
import { findUserById } from "../dao/user.dao.js";
import { cookieOptions } from "../config/config.js";

export const register_user = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      // It's good practice to validate input early
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    const token = await registerUser(name, email, password);
    res.cookie("token", token, cookieOptions); // Set cookie with token
    res.status(201).json({ success: true, token });
  } catch (error) {
    next(error); // Pass errors to the centralized error handler
  }
};

export const login_user = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const { token, user } = await loginUser(email, password);

    res
      .cookie("token", token, cookieOptions)
      .status(200)
      .json({ success: true, user, token });
  } catch (error) {
    next(error);
  }
};

export const logout_user = (req, res, next) => {
  try {
    res.clearCookie("token", {
      ...cookieOptions,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }); // Ensure secure for production
    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const get_user_profile = async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming 'isLoggedIn' middleware attaches user to req
    const user = await findUserById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Optionally remove password before sending
    user.password = undefined;
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
