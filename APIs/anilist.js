const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/anilist/anime", async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const perPage = parseInt(req.query.perPage) || 10;

	const query = `
    query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            pageInfo {
                total
                currentPage
                lastPage
                hasNextPage
            }
            media(type: ANIME, sort: POPULARITY_DESC) {
                id
                title {
                    romaji
                    english
                }
                coverImage {
                    large
                }
            }
        }
    }
    `;

	const variables = { page, perPage };

	try {
		const response = await axios.post("https://graphql.anilist.co", {
			query,
			variables,
		});
		res.json(response.data.data.Page);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

module.exports = router;
