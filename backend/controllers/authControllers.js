const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const USERS_FILE = path.join(__dirname, "../data/users.json");
const SECRET = "bloodbank_secret_key_2024";

// Ensure users.json exists and is valid JSON
const initializeUsersFile = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
      console.log("Created users.json file");
    }

    const content = fs.readFileSync(USERS_FILE, "utf-8");
    if (!content.trim()) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
    JSON.parse(content);
  } catch (error) {
    console.error("Error initializing users file:", error);
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
};

// Read users from file with error handling
const readUsers = () => {
  try {
    initializeUsersFile();
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error reading users:", error);
    return [];
  }
};

// Save users to file with error handling
const saveUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    console.log("Users saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving users:", error);
    return false;
  }
};

// Initialize file on module load
initializeUsersFile();

exports.register = (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Register request:", { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const users = readUsers();

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    const saved = saveUsers(users);

    if (!saved) {
      return res.status(500).json({ message: "Error saving user data" });
    }

    console.log("User registered successfully:", email);
    res.status(201).json({
      message: "Registration successful",
      userId: newUser.id,
      email: newUser.email
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request:", email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const users = readUsers();

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Verify password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      SECRET,
      { expiresIn: "24h" }
    );

    console.log("User logged in successfully:", email);
    res.json({
      message: "Login successful",
      token,
      name: user.name,
      userId: user.id,
      email: user.email
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error: " + error.message });
  }
};

exports.verifyToken = (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    console.error("Token verification error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Get all users (for debugging - remove in production)
exports.getAllUsers = (req, res) => {
  try {
    const users = readUsers();
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Error retrieving users" });
  }
};
