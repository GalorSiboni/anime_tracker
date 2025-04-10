import axios from "axios";

const API_URL = "http://localhost:5001/";

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
export const registerUser = async (name, email, password) => {
	try {
		const response = await axios.post(`${API_URL}/auth/register`, {
			name,
			email,
			password,
		});
		return response.data;
	} catch (error) {
		console.error("Registration error:", error);
		throw error;
	}
};
