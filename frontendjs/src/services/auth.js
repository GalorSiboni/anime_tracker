import axios from "axios";

const API_URL = "http://localhost:5003";

// Login user
export const loginUser = async (email, password) => {
	try {
		const response = await axios.post(`${API_URL}/auth/login`, {
			email,
			password,
		});
		return response.data;
	} catch (error) {
		console.error("Login error:", error);
		throw error;
	}
};

// Register user
export const registerUser = async (username, email, password) => {
	try {
		const response = await axios.post(`${API_URL}/auth/register`, {
			username, // Your backend expects username, not name
			email,
			password,
		});
		return response.data;
	} catch (error) {
		console.error("Registration error:", error);
		throw error;
	}
};

// Logout user
export const logoutUser = async () => {
	try {
		const response = await axios.get(`${API_URL}/auth/logout`);
		return response.data;
	} catch (error) {
		console.error("Logout error:", error);
		throw error;
	}
};

// Get current user info
export const getCurrentUser = async () => {
	try {
		const response = await axios.get(`${API_URL}/auth/me`);
		return response.data;
	} catch (error) {
		console.error("Get user error:", error);
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
