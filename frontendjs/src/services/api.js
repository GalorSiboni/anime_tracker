import axios from "axios";

const API_URL = "http://localhost:5000/api"; // Adjust to your backend URL

// Get all anime shows
export const getAnimeList = async () => {
	try {
		const response = await axios.get(`${API_URL}/anime`);
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
		const response = await axios.get(`${API_URL}/users/${userId}/favorites`);
		return response.data;
	} catch (error) {
		console.error("Error fetching favorites:", error);
		throw error;
	}
};

// Add to favorites
export const addToFavorites = async (userId, animeId) => {
	try {
		const response = await axios.post(`${API_URL}/users/${userId}/favorites`, {
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
		const response = await axios.delete(
			`${API_URL}/users/${userId}/favorites/${animeId}`
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
		const response = await axios.post(`${API_URL}/users/${userId}/watched`, {
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
		const response = await axios.get(
			`${API_URL}/users/${userId}/watched/${animeId}`
		);
		return response.data;
	} catch (error) {
		console.error("Error fetching watched episodes:", error);
		throw error;
	}
};
