// server.js
const express = require("express");
const cors = require("cors");
const app = express();

// Import the anime API router and Redis client
const {
	router: animeApiRouter,
	redisClient,
	isRedisAvailable,
} = require("./animeApi");

// Set port from environment variable or default to 5001
const PORT = process.env.PORT || 5001;

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname + "/public"));

// Use the anime API router for all routes
app.use("/", animeApiRouter);

// Start the server
const server = app
	.listen(PORT, () => {
		console.log(`Server is running on http://localhost:${PORT}`);
		console.log(`Cache type: ${isRedisAvailable() ? "Redis" : "In-memory"}`);
	})
	.on("error", (err) => {
		console.log(err);
		process.exit(1);
	});

// Graceful shutdown
process.on("SIGINT", async () => {
	console.log("Shutting down gracefully...");

	// Close the server
	server.close(() => {
		console.log("HTTP server closed");
	});

	// Close Redis connection if open
	if (redisClient && redisClient.isOpen) {
		await redisClient.disconnect();
		console.log("Redis connection closed");
	}

	process.exit(0);
});
