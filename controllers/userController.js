const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Order } = require("../models");

// Helper functions for validation and password hashing
const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const validatePassword = (password) => /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);

const hashPassword = (password) => (password ? bcrypt.hashSync(password, 10) : null);

// Login function
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error: JWT_SECRET is missing." });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    });
    // Set cookie for same-origin requests
    res.cookie("token", token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === "production",
      secure: true, // make sure this is true in production
      //sameSite: "strict",
      sameSite: "None", // important for cross-site cookies
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/", // important for cross-site cookies 
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();
    // Also return the token in the response for cross-origin requests
    return res.status(200).json({
      message: "Login successful",
      user: userWithoutPassword,
      token: token, // Return token in response body
    });
  } catch (err) {
    console.error("Login Error:", err.message || err);
    return res.status(500).json({ error: err.message || "Unable to login" });
  }
};

// Register function
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long, contain at least 1 uppercase letter and 1 number",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const hashedPassword = hashPassword(password);

    // Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "customer",
      address: address || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const { password: _, ...userWithoutPassword } = newUser.toJSON();

    return res.status(201).json({
      message: "User registered successfully!",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Registration Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Update user function
exports.updateUser = async (req, res) => {
  try {
    const { name, email, newPassword, address } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(409).json({ error: "This email is already in use" });
      }
    }

    let updatedPassword = user.password;
    if (newPassword) {
      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          error: "New password must be at least 6 characters long, contain at least 1 uppercase letter and 1 number",
        });
      }
      updatedPassword = hashPassword(newPassword);
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      password: updatedPassword,
      address: address !== undefined ? address : user.address,
      updated_at: new Date(),
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return res.status(200).json({
      message: "User updated successfully!",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update User Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Logout function
exports.logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    return res.status(200).json({ message: "Logout successful!" });
  } catch (error) {
    console.error("Logout Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Get user by ID (Admin only)
exports.getUserById = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied! Admins only." });
    }

    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get User By ID Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Get current user data
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get Me Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Delete user function
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has any orders
    const orderCount = await Order.count({
      where: { user_id: id },
    });

    if (orderCount > 0) {
      return res.status(400).json({ error: "User cannot be deleted because they have existing orders" });
    }

    // Delete the user
    await user.destroy();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Get All Users Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// Update user by ID (Admin only)
exports.updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, newPassword, address } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (email && email !== user.email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(409).json({ error: "This email is already in use" });
      }
    }

    let updatedPassword = user.password;
    if (newPassword) {
      if (!validatePassword(newPassword)) {
        return res.status(400).json({
          error: "New password must be at least 6 characters long, contain at least 1 uppercase letter and 1 number",
        });
      }
      updatedPassword = hashPassword(newPassword);
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      password: updatedPassword,
      address: address !== undefined ? address : user.address,
      updated_at: new Date(),
    });

    const { password: _, ...userWithoutPassword } = user.toJSON();

    return res.status(200).json({
      message: "User updated successfully!",
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Update User By ID Error:", error.message || error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};
