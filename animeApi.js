const express = require("express");
const axios = require("axios");
const router = express.Router();
const redis = require("redis");

// Base URL for the Jikan API
const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

// In-memory cache as fallback
const memoryCache = new Map();

// In-memory storage for user data (favorites and watched episodes)
// In a production environment, this would be in a database
const userFavorites = {}; // userId -> array of anime ids
const userWatched = {}; // userId -> { animeId -> array of episode ids }

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

// ====== NEW ENDPOINTS FOR USER FAVORITES AND WATCHED EPISODES ======

// Get user favorites
router.get("/favorites/:userId", (req, res) => {
	const userId = req.params.userId;

	try {
		// If user has no favorites yet, initialize with empty array
		if (!userFavorites[userId]) {
			userFavorites[userId] = [];
		}

		// Get anime details for each favorite
		const getFavoriteDetails = async () => {
			const favorites = userFavorites[userId];
			const detailedFavorites = [];

			for (const animeId of favorites) {
				try {
					// Try to get from cache first
					const cacheKey = `anime:${animeId}:details`;
					let animeData = await getFromCache(cacheKey);

					if (animeData) {
						animeData = JSON.parse(animeData);
						// Extract just what we need to keep the response smaller
						detailedFavorites.push({
							_id: animeId,
							mal_id: animeData.data?.mal_id || animeId,
							title: animeData.data?.title || "Unknown Anime",
							image: animeData.data?.images?.jpg?.image_url || "",
							synopsis: animeData.data?.synopsis || "",
						});
					} else {
						// If not in cache, just add the ID (frontend can fetch details)
						detailedFavorites.push({ _id: animeId, mal_id: animeId });
					}
				} catch (err) {
					console.error(
						`Error getting details for favorite anime ${animeId}:`,
						err.message
					);
					detailedFavorites.push({ _id: animeId, mal_id: animeId });
				}
			}

			return detailedFavorites;
		};

		// Execute and send the response
		getFavoriteDetails()
			.then((detailedFavorites) => {
				res.json(detailedFavorites);
			})
			.catch((err) => {
				console.error("Error processing favorites:", err);
				res.status(500).json({ error: "Error processing favorites" });
			});
	} catch (error) {
		console.error("Error fetching favorites:", error.message);
		res.status(500).json({ error: "Error fetching favorites" });
	}
});

// Add anime to favorites
router.post("/favorites", express.json(), (req, res) => {
	const { userId, animeId } = req.body;

	if (!userId || !animeId) {
		return res.status(400).json({ error: "Missing userId or animeId" });
	}

	try {
		// Initialize if this is the first favorite for this user
		if (!userFavorites[userId]) {
			userFavorites[userId] = [];
		}

		// Check if already in favorites
		if (!userFavorites[userId].includes(animeId)) {
			userFavorites[userId].push(animeId);
		}

		res.json({ success: true, message: "Added to favorites" });
	} catch (error) {
		console.error("Error adding to favorites:", error.message);
		res.status(500).json({ error: "Error adding to favorites" });
	}
});

// Remove anime from favorites
router.delete("/favorites/:userId/:animeId", (req, res) => {
	const { userId, animeId } = req.params;

	try {
		// Check if user has any favorites
		if (!userFavorites[userId]) {
			return res.status(404).json({ error: "User has no favorites" });
		}

		// Remove from favorites
		userFavorites[userId] = userFavorites[userId].filter(
			(id) => id !== animeId
		);

		res.json({ success: true, message: "Removed from favorites" });
	} catch (error) {
		console.error("Error removing from favorites:", error.message);
		res.status(500).json({ error: "Error removing from favorites" });
	}
});

// Get watched episodes for a specific anime
router.get("/watched/:userId/:animeId", (req, res) => {
	const { userId, animeId } = req.params;

	try {
		// Check if user has watched any episodes
		if (!userWatched[userId] || !userWatched[userId][animeId]) {
			return res.json({ episodeIds: [] });
		}

		res.json({ episodeIds: userWatched[userId][animeId] });
	} catch (error) {
		console.error("Error fetching watched episodes:", error.message);
		res.status(500).json({ error: "Error fetching watched episodes" });
	}
});

// Update watched episodes for an anime
router.post("/watched", express.json(), (req, res) => {
	const { userId, animeId, episodeIds } = req.body;

	if (!userId || !animeId || !Array.isArray(episodeIds)) {
		return res.status(400).json({ error: "Invalid request data" });
	}

	try {
		// Initialize user watched data if not exists
		if (!userWatched[userId]) {
			userWatched[userId] = {};
		}

		// Update watched episodes
		userWatched[userId][animeId] = episodeIds;

		res.json({ success: true, message: "Watched episodes updated" });
	} catch (error) {
		console.error("Error updating watched episodes:", error.message);
		res.status(500).json({ error: "Error updating watched episodes" });
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
