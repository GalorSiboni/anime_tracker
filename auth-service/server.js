const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

// Connect to database
connectDB();

const app = express();

// Set port
const PORT = process.env.AUTH_SERVICE_PORT || 5002;

// Middleware
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true,
	})
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({ status: "Auth service is running" });
});

// Start server
app.listen(PORT, () => {
	console.log(`Auth service running on port ${PORT}`);
});
