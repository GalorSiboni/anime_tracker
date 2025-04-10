// auth-service/routes/authRoutes.js
const express = require("express");
const { check } = require("express-validator");
const {
	register,
	login,
	logout,
	getMe,
	updateFavorites,
	verifyToken,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post(
	"/register",
	[
		check("username", "Username is required").not().isEmpty(),
		check("email", "Please include a valid email").isEmail(),
		check("password", "Password must be at least 6 characters").isLength({
			min: 6,
		}),
	],
	register
);

router.post(
	"/login",
	[
		check("email", "Please include a valid email").isEmail(),
		check("password", "Password is required").exists(),
	],
	login
);

// Protected routes
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/favorites", protect, updateFavorites);
router.get("/verify", protect, verifyToken);

module.exports = router;
