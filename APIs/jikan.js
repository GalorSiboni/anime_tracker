// jikan.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/jikan/anime", async (req, res) => {
	const page = parseInt(req.query.page) || 1;

	try {
		const response = await axios.get(
			`https://api.jikan.moe/v4/anime?page=${page}`
		);
		res.json({
			data: response.data.data,
			pagination: response.data.pagination,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
