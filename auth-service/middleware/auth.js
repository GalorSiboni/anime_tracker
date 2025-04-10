const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
	try {
		let token;

		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			token = req.headers.authorization.split(" ")[1];
		} else if (req.cookies.token) {
			token = req.cookies.token;
		}

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Not authorized to access this route",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.id);
		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User no longer exists",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: "Not authorized to access this route",
		});
	}
};
