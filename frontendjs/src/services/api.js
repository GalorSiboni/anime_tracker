import axios from "axios";

const API_URL = "http://localhost:5003";

// Get all anime shows with pagination
export const getAnimeList = async (page = 1, limit = 12) => {
	try {
		// Your API endpoint is "/" for anime list
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

// Get user favorites (requires auth)
export const getFavorites = async (userId) => {
	try {
		// Adjust this endpoint to match your backend
		const response = await axios.get(`${API_URL}/favorites/${userId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching favorites:", error);
		throw error;
	}
};

// Add to favorites
export const addToFavorites = async (userId, animeId) => {
	try {
		// Adjust this endpoint to match your backend
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
	try {
		// Adjust this endpoint to match your backend
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
	try {
		// Adjust this endpoint to match your backend
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
	try {
		// Adjust this endpoint to match your backend
		const response = await axios.get(`${API_URL}/watched/${userId}/${animeId}`);
		return response.data;
	} catch (error) {
		console.error("Error fetching watched episodes:", error);
		throw error;
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
