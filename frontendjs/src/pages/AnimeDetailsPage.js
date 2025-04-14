import React, { useState, useEffect, useContext, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
	getAnimeById,
	getWatchedEpisodes,
	updateWatchedEpisodes,
	addToFavorites,
	removeFromFavorites,
	getFavorites,
	updateAnimeStatus,
} from "../services/api";
import { AuthContext } from "../context/AuthContext";
import ProgressBar from "../components/ProgressBar";
import EpisodeList from "../components/EpisodeList";
import "./AnimeDetailsPage.css";

const AnimeDetailsPage = () => {
	const { id } = useParams();
	const { user, getUserId } = useContext(AuthContext);
	const [anime, setAnime] = useState(null);
	const [watchedEpisodes, setWatchedEpisodes] = useState([]);
	const [isFavorite, setIsFavorite] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [favoriteLoading, setFavoriteLoading] = useState(false);

	useEffect(() => {
		const fetchAnimeDetails = async () => {
			try {
				const response = await getAnimeById(id);

				// Handle Jikan API response format
				let processedAnime = response;

				// Check if the response has a data property (Jikan API format)
				if (response && response.data) {
					processedAnime = response.data;
				}

				setAnime(processedAnime);
				setLoading(false);
			} catch (err) {
				console.error("Failed to fetch anime details:", err);
				setError("Failed to fetch anime details");
				setLoading(false);
			}
		};

		fetchAnimeDetails();
	}, [id]);

	// Memoize the getEpisodes function
	const getEpisodes = useCallback(() => {
		if (!anime) return [];

		// If anime has episodes property and it's an array, use it
		if (anime.episodes && Array.isArray(anime.episodes)) {
			return anime.episodes;
		}

		// If anime has episodes_count or episodes as a number, generate episode objects
		const episodeCount =
			anime.episodes_count ||
			(typeof anime.episodes === "number" ? anime.episodes : 0);

		if (episodeCount > 0) {
			const episodeArray = [];
			for (let i = 1; i <= episodeCount; i++) {
				episodeArray.push({
					_id: `${id}-${i}`,
					number: i,
					title: `Episode ${i}`,
					season: 1,
				});
			}
			return episodeArray;
		}

		return [];
	}, [anime, id]);

	useEffect(() => {
		// If not logged in, don't try to fetch user-specific data
		if (!user) {
			setWatchedEpisodes([]);
			setIsFavorite(false);
			return;
		}

		// Get user ID
		const userId = getUserId();
		if (!userId) return;

		const fetchUserData = async () => {
			try {
				// Fetch watched episodes
				const watched = await getWatchedEpisodes(userId, id);
				setWatchedEpisodes(
					Array.isArray(watched.episodeIds) ? watched.episodeIds : []
				);

				// Check if anime is in favorites
				const favorites = await getFavorites(userId);
				if (Array.isArray(favorites)) {
					setIsFavorite(
						favorites.some(
							(fav) =>
								(fav._id && fav._id === id) ||
								(fav.mal_id && fav.mal_id.toString() === id)
						)
					);
				}
			} catch (err) {
				console.error("Error fetching user data:", err);
			}
		};

		fetchUserData();
	}, [id, user, getUserId]);

	// Add a new useEffect to monitor watched episodes and update status automatically
	useEffect(() => {
		if (!user || !anime) return;

		const userId = getUserId();
		if (!userId) return;

		const episodes = getEpisodes();

		// If all episodes are watched and there's at least one episode
		if (episodes.length > 0 && watchedEpisodes.length === episodes.length) {
			// Check if status is not already "completed"
			if (anime.status !== "completed") {
				// Update anime status to "completed"
				updateAnimeStatus(userId, id, "completed")
					.then(() => {
						// You may want to update local state if needed
						setAnime((prev) => ({ ...prev, status: "completed" }));
					})
					.catch((err) => console.error("Error updating anime status:", err));
			}
		}
	}, [watchedEpisodes, anime, user, getUserId, id, getEpisodes]);

	const handleEpisodeToggle = async (episodeId) => {
		if (!user) return;

		const userId = getUserId();
		if (!userId) return;

		const newWatchedEpisodes = watchedEpisodes.includes(episodeId)
			? watchedEpisodes.filter((id) => id !== episodeId)
			: [...watchedEpisodes, episodeId];

		setWatchedEpisodes(newWatchedEpisodes);

		try {
			await updateWatchedEpisodes(userId, id, newWatchedEpisodes);
		} catch (err) {
			console.error("Error updating watched episodes:", err);
			// Revert changes if update fails
			setWatchedEpisodes(watchedEpisodes);
		}
	};

	const handleFavoriteToggle = async () => {
		if (!user) return;

		const userId = getUserId();
		if (!userId) return;

		setFavoriteLoading(true);
		try {
			if (isFavorite) {
				await removeFromFavorites(userId, id);
			} else {
				await addToFavorites(userId, id);
			}
			setIsFavorite(!isFavorite);
		} catch (err) {
			console.error("Error updating favorites:", err);
		} finally {
			setFavoriteLoading(false);
		}
	};

	// Helper function to extract the correct image URL
	const getImageUrl = () => {
		if (!anime) return "";

		// Handle Jikan API format
		if (anime.images && anime.images.jpg) {
			return anime.images.jpg.image_url || anime.images.jpg.large_image_url;
		}

		// Handle your own API format
		return anime.image || "";
	};

	// Helper function to extract trailer URL
	const getTrailerUrl = () => {
		if (!anime) return "";

		// Handle Jikan API format
		if (anime.trailer && anime.trailer.embed_url) {
			return anime.trailer.embed_url;
		}

		// Handle your own API format
		return anime.trailer || "";
	};

	// Helper function to get the correct title
	const getTitle = () => {
		if (!anime) return "";
		return anime.title || anime.title_english || "";
	};

	// Helper function to get the correct description
	const getDescription = () => {
		if (!anime) return "";
		return anime.synopsis || anime.description || "";
	};

	// In AnimeDetailsPage.js, add this new function:
	const handleSeasonToggle = async (seasonNumber, isChecked) => {
		if (!user) return;

		const userId = getUserId();
		if (!userId) return;

		// Get all episodes for this season
		const seasonEpisodes = episodes.filter(
			(ep) => (ep.season || 1) === seasonNumber
		);
		const seasonEpisodeIds = seasonEpisodes.map((ep) => ep._id);

		// Create a new list of watched episodes
		let newWatchedEpisodes;

		if (isChecked) {
			// Add all season episodes to watched list
			newWatchedEpisodes = [
				...new Set([...watchedEpisodes, ...seasonEpisodeIds]),
			];
		} else {
			// Remove all season episodes from watched list
			newWatchedEpisodes = watchedEpisodes.filter(
				(id) => !seasonEpisodeIds.includes(id)
			);
		}

		// Update state
		setWatchedEpisodes(newWatchedEpisodes);

		// Update backend
		try {
			await updateWatchedEpisodes(userId, id, newWatchedEpisodes);
		} catch (err) {
			console.error("Error updating watched episodes:", err);
			// Revert changes if update fails
			setWatchedEpisodes(watchedEpisodes);
		}
	};

	if (loading) return <div className="loading">Loading...</div>;
	if (error) return <div className="error">{error}</div>;
	if (!anime) return <div className="error">Anime not found</div>;

	const episodes = getEpisodes();
	const imageUrl = getImageUrl();
	const trailerUrl = getTrailerUrl();
	const title = getTitle();
	const description = getDescription();

	return (
		<div className="anime-details">
			<div className="anime-header">
				<div className="anime-image">
					<img src={imageUrl} alt={title} />
				</div>
				<div className="anime-info">
					<h1>{title}</h1>
					<p className="anime-description">{description}</p>

					{user && (
						<>
							<ProgressBar
								watchedCount={watchedEpisodes.length}
								totalCount={episodes.length}
							/>

							<button
								className={`favorite-btn ${isFavorite ? "favorited" : ""}`}
								onClick={handleFavoriteToggle}
								disabled={favoriteLoading}
							>
								{favoriteLoading
									? "Loading..."
									: isFavorite
									? "Remove from Favorites"
									: "Add to Favorites"}
							</button>
						</>
					)}
				</div>
			</div>

			{trailerUrl && (
				<div className="anime-trailer">
					<h2>Trailer</h2>
					<div className="trailer-container">
						<iframe
							src={trailerUrl}
							title={`${title} trailer`}
							allowFullScreen
							frameBorder="0"
						></iframe>
					</div>
				</div>
			)}

			{user ? (
				<div className="episodes-section">
					<h2>Episodes</h2>
					<EpisodeList
						episodes={episodes}
						watchedEpisodes={watchedEpisodes}
						onEpisodeToggle={handleEpisodeToggle}
						onSeasonToggle={handleSeasonToggle}
					/>
				</div>
			) : (
				<div className="login-prompt">
					<p>Please log in to track your watched episodes</p>
				</div>
			)}
		</div>
	);
};

export default AnimeDetailsPage;
