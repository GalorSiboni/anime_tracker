// animeApi.js
const express = require("express");
const axios = require("axios");
const router = express.Router();
const redis = require("redis");

// Base URL for the Jikan API
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// In-memory cache as fallback
const memoryCache = new Map();

// Redis client status
let redisAvailable = false;
let redisClient = null;

// Try to create Redis client
try {
	redisClient = redis.createClient({
		url: process.env.REDIS_URL || "redis://localhost:6379",
		socket: {
			reconnectStrategy: false, // Don't keep retrying and printing errors
		},
	});

	// Connect to Redis
	(async () => {
		try {
			await redisClient.connect();
			console.log("Redis client connected");
			redisAvailable = true;
		} catch (err) {
			console.error(
				"Redis connection failed, using in-memory cache instead:",
				err.message
			);
			redisAvailable = false;
		}
	})();

	// Handle Redis errors
	redisClient.on("error", (err) => {
		if (redisAvailable) {
			console.error("Redis error, switching to in-memory cache:", err.message);
			redisAvailable = false;
		}
	});
} catch (err) {
	console.error(
		"Failed to initialize Redis, using in-memory cache instead:",
		err.message
	);
	redisAvailable = false;
}

// Helper function to get from cache (either Redis or in-memory)
async function getFromCache(key) {
	if (redisAvailable) {
		try {
			return await redisClient.get(key);
		} catch (err) {
			console.error(
				"Redis get error, falling back to memory cache:",
				err.message
			);
			redisAvailable = false;
			return memoryCache.get(key);
		}
	} else {
		return memoryCache.get(key);
	}
}

// Helper function to set cache (either Redis or in-memory)
async function setCache(key, value, ttlSeconds) {
	if (redisAvailable) {
		try {
			await redisClient.set(key, value, { EX: ttlSeconds });
		} catch (err) {
			console.error(
				"Redis set error, falling back to memory cache:",
				err.message
			);
			redisAvailable = false;
			memoryCache.set(key, value);
			// For in-memory cache, we could add expiration, but keeping it simple for now
		}
	} else {
		memoryCache.set(key, value);
	}
}

// Route to fetch anime information by anime ID with caching
router.get("/anime/:id", async (req, res) => {
	const animeId = req.params.id;
	const cacheKey = `anime:${animeId}:details`;

	try {
		// Try to get data from cache
		let cachedData = await getFromCache(cacheKey);

		if (cachedData) {
			console.log(`Cache hit for anime details: ${animeId}`);
			return res.json(JSON.parse(cachedData));
		}

		console.log(`Cache miss for anime details: ${animeId}, fetching from API`);

		// Add a small delay to respect rate limits
		await new Promise((resolve) => setTimeout(resolve, 500));

		const response = await axios.get(`${JIKAN_BASE_URL}/anime/${animeId}`);

		// Cache for 24 hours
		await setCache(cacheKey, JSON.stringify(response.data), 86400);

		res.json(response.data);
	} catch (error) {
		console.error("Error fetching anime details:", error.message);
		res.status(500).send("Error fetching anime data");
	}
});

// Route to get anime episodes with caching
router.get("/anime/:id/episodes", async (req, res) => {
	const animeId = req.params.id;
	const cacheKey = `anime:${animeId}:episodes`;

	try {
		// Try to get data from cache
		let cachedData = await getFromCache(cacheKey);

		if (cachedData) {
			console.log(`Cache hit for anime episodes: ${animeId}`);
			return res.json(JSON.parse(cachedData));
		}

		console.log(`Cache miss for anime episodes: ${animeId}, fetching from API`);

		// Add delay to respect rate limits
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const response = await axios.get(
			`${JIKAN_BASE_URL}/anime/${animeId}/episodes`
		);

		// Store in cache for 24 hours (86400 seconds)
		await setCache(cacheKey, JSON.stringify(response.data), 86400);

		res.json(response.data);
	} catch (error) {
		console.error("Error fetching episodes:", error.message);

		if (error.response && error.response.status === 429) {
			return res.status(429).json({
				error: "Rate limit exceeded",
				message: "Please wait a moment before trying again",
			});
		}

		res.status(500).send(`Error fetching anime episodes: ${error.message}`);
	}
});

// Route to get anime list with sorting and caching
router.get("/", async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const sort = req.query.sort || "score";
	const cacheKey = `anime:list:page${page}:sort${sort}`;

	try {
		// Try to get data from cache
		let cachedData = await getFromCache(cacheKey);

		if (cachedData) {
			console.log(`Cache hit for anime list: page ${page}, sort ${sort}`);
			return res.json(JSON.parse(cachedData));
		}

		console.log(
			`Cache miss for anime list: page ${page}, sort ${sort}, fetching from API`
		);

		// Add a small delay to respect rate limits
		await new Promise((resolve) => setTimeout(resolve, 500));

		const response = await axios.get(`${JIKAN_BASE_URL}/anime`, {
			params: {
				page: page,
				order_by: sort,
				sort: "desc",
			},
		});

		// Prepare the response data
		const responseData = {
			data: response.data.data,
			pagination: response.data.pagination,
		};

		// Cache for 6 hours (shorter time for lists that might change)
		await setCache(cacheKey, JSON.stringify(responseData), 21600);

		res.json(responseData);
	} catch (error) {
		console.error("Error fetching anime list:", error.message);
		res.status(500).json({ error: error.message });
	}
});

// Route to search anime by title with caching
router.get("/search", async (req, res) => {
	const title = req.query.title;
	const cacheKey = `anime:search:${title}`;

	try {
		// Try to get data from cache
		let cachedData = await getFromCache(cacheKey);

		if (cachedData) {
			console.log(`Cache hit for anime search: "${title}"`);
			return res.json(JSON.parse(cachedData));
		}

		console.log(`Cache miss for anime search: "${title}", fetching from API`);

		// Add a small delay to respect rate limits
		await new Promise((resolve) => setTimeout(resolve, 500));

		const response = await axios.get(`${JIKAN_BASE_URL}/anime`, {
			params: { q: title },
		});

		// Cache for 6 hours (21600 seconds)
		await setCache(cacheKey, JSON.stringify(response.data), 21600);

		res.json(response.data);
	} catch (error) {
		console.error("Error searching anime:", error.message);
		res.status(500).send("Error searching anime");
	}
});

// Gracefully close Redis on module exit
process.on("exit", () => {
	if (redisClient && redisClient.isOpen) {
		redisClient.disconnect();
	}
});

// Provide a function to check if Redis is available
function isRedisAvailable() {
	return redisAvailable;
}

// Export both the router and the client for shutdown handling
module.exports = {
	router,
	redisClient,
	isRedisAvailable,
};
