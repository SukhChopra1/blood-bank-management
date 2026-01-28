const express = require("express");
const { register, login, verifyToken } = require("../controllers/authControllers");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/verify", authMiddleware, verifyToken);

module.exports = router;
