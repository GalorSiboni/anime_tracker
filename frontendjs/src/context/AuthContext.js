import React, { createContext, useState, useEffect } from "react";
import { setAuthToken } from "../services/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Check if user is logged in from localStorage
		const storedUser = localStorage.getItem("user");
		if (storedUser) {
			try {
				const userData = JSON.parse(storedUser);
				setUser(userData);

				// Set token for API requests on page refresh
				const token = userData.token || (userData.user && userData.user.token);
				if (token) {
					setAuthToken(token);
				}
			} catch (error) {
				console.error("Error parsing stored user data:", error);
				localStorage.removeItem("user");
			}
		}
		setLoading(false);
	}, []);

	const login = (userData) => {
		setUser(userData);
		localStorage.setItem("user", JSON.stringify(userData));

		// Set the token for future API requests
		const token = userData.token || (userData.user && userData.user.token);
		if (token) {
			setAuthToken(token);
		}
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem("user");
		setAuthToken(null);
	};

	const contextValue = {
		user,
		login,
		logout,
		loading,
		// Additional utility functions
		isAuthenticated: !!user,
		getUserId: () => {
			if (!user) return null;
			return (
				user.id ||
				user._id ||
				user.userId ||
				(user.user && (user.user.id || user.user._id))
			);
		},
	};

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
};
