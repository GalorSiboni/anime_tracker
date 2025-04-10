const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validationResult } = require("express-validator");

// Create token
const generateToken = (id) => {
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN || "7d",
	});
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
	const token = generateToken(user._id);

	const options = {
		expires: new Date(
			Date.now() +
				(parseInt(process.env.JWT_COOKIE_EXPIRE) || 7) * 24 * 60 * 60 * 1000
		),
		httpOnly: true,
	};

	if (process.env.NODE_ENV === "production") {
		options.secure = true;
	}

	user.password = undefined;

	res.status(statusCode).cookie("token", token, options).json({
		success: true,
		token,
		user,
	});
};

// Register user
exports.register = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { username, email, password } = req.body;

		const existingUser = await User.findOne({
			$or: [{ email }, { username }],
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "User already exists",
			});
		}

		const user = await User.create({
			username,
			email,
			password,
		});

		sendTokenResponse(user, 201, res);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

// Login user
exports.login = async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.status(400).json({ errors: errors.array() });
	}

	try {
		const { email, password } = req.body;

		const user = await User.findOne({ email }).select("+password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		const isMatch = await user.comparePassword(password);

		if (!isMatch) {
			return res.status(401).json({
				success: false,
				message: "Invalid credentials",
			});
		}

		sendTokenResponse(user, 200, res);
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

// Logout user
exports.logout = (req, res) => {
	res.cookie("token", "none", {
		expires: new Date(Date.now() + 10 * 1000),
		httpOnly: true,
	});

	res.status(200).json({
		success: true,
		message: "User logged out successfully",
	});
};

// Get user profile
exports.getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		res.status(200).json({
			success: true,
			data: user,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

// Update favorites
exports.updateFavorites = async (req, res) => {
	try {
		const user = await User.findById(req.user.id);

		user.favorites = req.body.favorites;
		await user.save();

		res.status(200).json({
			success: true,
			data: user.favorites,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Server error",
			error: process.env.NODE_ENV === "development" ? error.message : undefined,
		});
	}
};

// Verify token
exports.verifyToken = (req, res) => {
	res.status(200).json({
		success: true,
		message: "Token is valid",
		user: req.user,
	});
};
