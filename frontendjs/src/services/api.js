import axios from "axios";

const API_URL = "http://localhost:5003"; // Your API gateway URL

// Get all anime shows with pagination
export const getAnimeList = async (page = 1, limit = 12) => {
	try {
		const response = await axios.get(`${API_URL}/`, {
			params: { page, limit },
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching anime list:", error);
		throw error;
	}
};

// Get a specific anime by ID
export const getAnimeById = async (id) => {
	try {
		const response = await axios.get(`${API_URL}/anime/${id}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching anime with id ${id}:`, error);
		throw error;
	}
};

// Get anime episodes
export const getAnimeEpisodes = async (id) => {
	try {
		const response = await axios.get(`${API_URL}/anime/${id}/episodes`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching episodes for anime ${id}:`, error);
		throw error;
	}
};

// Get user favorites (requires auth)
export const getFavorites = async (userId) => {
	if (!userId) {
		console.log("No userId provided for getFavorites");
		return [];
	}

	try {
		const response = await axios.get(`${API_URL}/favorites/${userId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching favorites:", error);
		return [];
	}
};

// Add to favorites
export const addToFavorites = async (userId, animeId) => {
	if (!userId || !animeId) {
		console.log("Missing userId or animeId for addToFavorites");
		return null;
	}

	try {
		const response = await axios.post(`${API_URL}/favorites`, {
			userId,
			animeId,
		});
		return response.data;
	} catch (error) {
		console.error("Error adding to favorites:", error);
		throw error;
	}
};

// Remove from favorites
export const removeFromFavorites = async (userId, animeId) => {
	if (!userId || !animeId) {
		console.log("Missing userId or animeId for removeFromFavorites");
		return null;
	}

	try {
		const response = await axios.delete(
			`${API_URL}/favorites/${userId}/${animeId}`
		);
		return response.data;
	} catch (error) {
		console.error("Error removing from favorites:", error);
		throw error;
	}
};

// Update watched episodes
export const updateWatchedEpisodes = async (userId, animeId, episodeIds) => {
	if (!userId || !animeId) {
		console.log("Missing userId or animeId for updateWatchedEpisodes");
		return null;
	}

	try {
		const response = await axios.post(`${API_URL}/watched`, {
			userId,
			animeId,
			episodeIds,
		});
		return response.data;
	} catch (error) {
		console.error("Error updating watched episodes:", error);
		throw error;
	}
};

// Get watched episodes for a user and anime
export const getWatchedEpisodes = async (userId, animeId) => {
	if (!userId || !animeId) {
		console.log("Missing userId or animeId for getWatchedEpisodes");
		return { episodeIds: [] };
	}

	try {
		const response = await axios.get(`${API_URL}/watched/${userId}/${animeId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching watched episodes:", error);
		return { episodeIds: [] };
	}
};

// Update anime watch status (completed, in-progress, waiting)
export const updateAnimeStatus = async (userId, animeId, status) => {
	if (!userId || !animeId) {
		console.log("Missing userId or animeId for updateAnimeStatus");
		return null;
	}

	try {
		const response = await axios.put(`${API_URL}/anime-status`, {
			userId,
			animeId,
			status,
		});
		return response.data;
	} catch (error) {
		console.error("Error updating anime status:", error);
		throw error;
	}
};

// Get upcoming episodes with air dates
export const getNextEpisodes = async () => {
	try {
		const response = await axios.get(`${API_URL}/upcoming-episodes`);
		return response.data;
	} catch (error) {
		console.error("Error fetching upcoming episodes:", error);
		return [];
	}
};

// Search for anime by title
export const searchAnime = async (query) => {
	if (!query || query.trim() === "") {
		return [];
	}

	try {
		const response = await axios.get(`${API_URL}/search`, {
			params: { title: query },
		});
		return response.data;
	} catch (error) {
		console.error("Error searching anime:", error);
		return [];
	}
};

// Set auth token for API requests
export const setAuthToken = (token) => {
	if (token) {
		axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
	} else {
		delete axios.defaults.headers.common["Authorization"];
	}
};
