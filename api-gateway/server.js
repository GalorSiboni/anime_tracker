const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

// Middleware
app.use(
	cors({
		origin: process.env.CLIENT_URL || "http://localhost:3000",
		credentials: true,
	})
);

// Proxy to auth service
app.use(
	"/api/auth",
	createProxyMiddleware({
		target: process.env.AUTH_SERVICE_URL || "http://localhost:5002",
		changeOrigin: true,
	})
);

// Proxy to anime service
app.use(
	"/",
	createProxyMiddleware({
		target: process.env.ANIME_SERVICE_URL || "http://localhost:5001",
		changeOrigin: true,
	})
);

const PORT = process.env.PORT || 5003;

// For auth calls
const authApi = axios.create({
	baseURL: "http://localhost:5002",
	withCredentials: true,
});

// For anime API calls
const animeApi = axios.create({
	baseURL: "http://localhost:5001",
	withCredentials: true,
});

app.listen(PORT, () => {
	console.log(`API Gateway running on port ${PORT}`);
});
